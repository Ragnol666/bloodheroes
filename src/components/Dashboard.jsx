import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert, Navbar, Nav, Modal, Form, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, updateDoc, onSnapshot, orderBy, serverTimestamp 
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import "bootstrap/dist/css/bootstrap.min.css";

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]); // Requests sent to donor
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [availableDonors, setAvailableDonors] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!auth.currentUser) {
          navigate('/login');
          return;
        }

        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        setUserData(userData);

        // Fetch user requests (if recipient)
        if (userData?.role === "recipient") {
          const q = query(
            collection(db, "requests"),
            where("userId", "==", auth.currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          setRequests(querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }

        // If user is a donor, fetch requests sent to them
        if (userData?.role === "donor") {
          const requestsQuery = query(
            collection(db, "donationRequests"),
            where("donorId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
          );
          const requestsSnapshot = await getDocs(requestsQuery);
          setDonationRequests(requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }

        // If user is a recipient, fetch available donors
        if (userData?.role === "recipient") {
          const donorsQuery = query(
            collection(db, "users"),
            where("role", "==", "donor"),
            where("isAvailable", "==", true)
          );
          const donorsSnapshot = await getDocs(donorsQuery);
          setAvailableDonors(donorsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }

        // Set up real-time listener for conversations
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", auth.currentUser.uid),
          orderBy("lastUpdated", "desc")
        );

        const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
          const convos = [];
          snapshot.forEach((doc) => {
            convos.push({
              id: doc.id,
              ...doc.data()
            });
          });
          setConversations(convos);
        });

        // Set up real-time listener for unread messages
        const unreadQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", auth.currentUser.uid)
        );

        const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
          const counts = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.lastMessage && data.lastMessage.sender !== auth.currentUser.uid && !data.lastMessage.read) {
              counts[doc.id] = (counts[doc.id] || 0) + 1;
            }
          });
          setUnreadCounts(counts);
        });

        return () => {
          unsubscribeConversations();
          unsubscribeUnread();
        };
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    // Set up real-time listener for messages when a conversation is active
    if (activeConversation) {
      const messagesQuery = query(
        collection(db, "conversations", activeConversation.id, "messages"),
        orderBy("timestamp", "asc")
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = [];
        snapshot.forEach((doc) => {
          msgs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMessages(msgs);
        
        // Mark messages as read
        markMessagesAsRead();
      });

      return () => unsubscribeMessages();
    }
  }, [activeConversation]);

  const markMessagesAsRead = async () => {
    if (!activeConversation) return;
    
    try {
      // Update the last message read status
      if (activeConversation.lastMessage && 
          activeConversation.lastMessage.sender !== auth.currentUser.uid &&
          !activeConversation.lastMessage.read) {
        
        await updateDoc(doc(db, "conversations", activeConversation.id), {
          "lastMessage.read": true,
          "lastMessage.readAt": serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const startConversation = async (otherUser, isRequester = false) => {
    if (isRequester) {
      setSelectedRequester(otherUser);
    } else {
      setSelectedDonor(otherUser);
    }
    
    // Check if conversation already exists
    const existingConvo = conversations.find(convo => 
      convo.participants.includes(otherUser.id) && convo.participants.includes(auth.currentUser.uid)
    );
    
    if (existingConvo) {
      setActiveConversation(existingConvo);
    } else {
      // Create new conversation
      try {
        // Get the other user's name
        const otherUserDoc = await getDoc(doc(db, "users", otherUser.id));
        const otherUserName = otherUserDoc.exists() ? otherUserDoc.data().name : "Unknown User";
        
        const convoRef = await addDoc(collection(db, "conversations"), {
          participants: [auth.currentUser.uid, otherUser.id],
          participantNames: [userData.name, otherUserName],
          lastUpdated: serverTimestamp(),
          lastMessage: null
        });
        
        setActiveConversation({
          id: convoRef.id,
          participants: [auth.currentUser.uid, otherUser.id],
          participantNames: [userData.name, otherUserName],
          lastUpdated: serverTimestamp(),
          lastMessage: null
        });
      } catch (error) {
        console.error("Error creating conversation:", error);
        setError("Failed to start conversation. Please try again.");
      }
    }
    
    setShowChatModal(true);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return;
    
    try {
      // Add message to subcollection
      const messageData = {
        text: messageText,
        sender: auth.currentUser.uid,
        senderName: userData.name,
        timestamp: serverTimestamp(),
        read: false
      };
      
      await addDoc(
        collection(db, "conversations", activeConversation.id, "messages"),
        messageData
      );
      
      // Update conversation with last message
      await updateDoc(doc(db, "conversations", activeConversation.id), {
        lastMessage: messageData,
        lastUpdated: serverTimestamp()
      });
      
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openConversation = (conversation) => {
    setActiveConversation(conversation);
    setShowChatModal(true);
  };

  const handleRequestResponse = async (requestId, status) => {
    try {
      // Update the request status
      await updateDoc(doc(db, "donationRequests", requestId), {
        status: status,
        respondedAt: serverTimestamp()
      });
      
      // If accepted, also create a conversation
      if (status === 'accepted') {
        const request = donationRequests.find(req => req.id === requestId);
        if (request) {
          // Get requester info
          const requesterDoc = await getDoc(doc(db, "users", request.requesterId));
          const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;
          
          if (requesterData) {
            startConversation({
              id: request.requesterId,
              name: requesterData.name
            }, true);
          }
        }
      }
      
      // Update local state
      setDonationRequests(prev => 
        prev.map(req => 
          req.id === requestId ? {...req, status: status} : req
        )
      );
    } catch (error) {
      console.error("Error updating request:", error);
      setError("Failed to update request. Please try again.");
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Navigation Bar with Logout */}
      <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand className="text-danger fw-bold">
            <span style={{ letterSpacing: "1px" }}>Blood Donation Platform</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => navigate("/dashboard")}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => navigate("/requests")}>Requests</Nav.Link>
              {userData?.role === "donor" && (
                <Nav.Link onClick={() => setShowRequestsModal(true)}>
                  Donation Requests
                  {donationRequests.filter(req => req.status === 'pending').length > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {donationRequests.filter(req => req.status === 'pending').length}
                    </Badge>
                  )}
                </Nav.Link>
              )}
              {userData?.role === "recipient" && (
                <Nav.Link onClick={() => navigate("/available-donors")}>Find Donors</Nav.Link>
              )}
              <Nav.Link onClick={() => setShowChatModal(true)}>
                Messages
                {Object.keys(unreadCounts).length > 0 && (
                  <Badge bg="danger" className="ms-1">
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Nav.Link>
              <Nav.Link onClick={() => setShowLogoutConfirm(true)} className="text-danger">
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1040,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "100%"
            }}
          >
            <h5>Confirm Logout</h5>
            <p>Are you sure you want to log out?</p>
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Requests Modal for Donors */}
      <Modal show={showRequestsModal} onHide={() => setShowRequestsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Donation Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {donationRequests.length === 0 ? (
            <p className="text-muted">No donation requests yet.</p>
          ) : (
            <ListGroup variant="flush">
              {donationRequests.map(request => (
                <ListGroup.Item key={request.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6>{request.requesterName} needs {request.bloodGroup} blood</h6>
                      <p className="mb-1">{request.message || "No additional message"}</p>
                      <small className="text-muted">
                        Requested on {request.createdAt?.toDate().toLocaleDateString()}
                      </small>
                      {request.status !== 'pending' && (
                        <div>
                          <Badge bg={request.status === 'accepted' ? 'success' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <div className="d-flex flex-column gap-1">
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => handleRequestResponse(request.id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRequestResponse(request.id, 'declined')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>

      {/* Chat Modal */}
      <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {activeConversation ? "Chat" : "Messages"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: "400px", maxHeight: "60vh", overflowY: "auto" }}>
          {!activeConversation ? (
            <div>
              <h5>Your Conversations</h5>
              {conversations.length === 0 ? (
                <p className="text-muted">No conversations yet.</p>
              ) : (
                <ListGroup variant="flush">
                  {conversations.map(convo => {
                    const otherParticipantIndex = convo.participants.findIndex(
                      p => p !== auth.currentUser.uid
                    );
                    const otherParticipantName = convo.participantNames[otherParticipantIndex];
                    
                    return (
                      <ListGroup.Item 
                        key={convo.id} 
                        action 
                        onClick={() => openConversation(convo)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{otherParticipantName}</strong>
                          {convo.lastMessage && (
                            <p className="mb-0 text-muted small">
                              {convo.lastMessage.sender === auth.currentUser.uid ? "You: " : ""}
                              {convo.lastMessage.text}
                            </p>
                          )}
                        </div>
                        {unreadCounts[convo.id] > 0 && (
                          <Badge bg="danger">{unreadCounts[convo.id]}</Badge>
                        )}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  Chat with {
                    activeConversation.participantNames[
                      activeConversation.participants.findIndex(
                        p => p !== auth.currentUser.uid
                      )
                    ]
                  }
                </h5>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setActiveConversation(null)}
                >
                  Back to Conversations
                </Button>
              </div>
              
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <p className="text-muted">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`d-flex mb-2 ${msg.sender === auth.currentUser.uid ? 'justify-content-end' : ''}`}
                    >
                      <div 
                        className={`p-2 rounded ${msg.sender === auth.currentUser.uid ? 'bg-primary text-white' : 'bg-light'}`}
                        style={{ maxWidth: '70%' }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        {activeConversation && (
          <Modal.Footer>
            <Form.Control
              as="textarea"
              rows={2}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <Button variant="primary" onClick={sendMessage}>
              Send
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <Container className="mb-5">
        <Row className="justify-content-between align-items-center mb-4">
          <Col md={8}>
            <h2 className="text-danger fw-bold mb-0">
              Welcome, {userData?.name || "User"}!
            </h2>
            <p className="text-muted">Blood Donation Dashboard</p>
          </Col>
          <Col md={4} className="text-md-end">
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
              className="me-2"
            >
              Logout
            </Button>
            {userData?.role === "donor" && (
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={() => setShowRequestsModal(true)}
                className="me-2"
              >
                Requests
                {donationRequests.filter(req => req.status === 'pending').length > 0 && (
                  <Badge bg="danger" className="ms-1">
                    {donationRequests.filter(req => req.status === 'pending').length}
                  </Badge>
                )}
              </Button>
            )}
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowChatModal(true)}
            >
              Messages
              {Object.keys(unreadCounts).length > 0 && (
                <Badge bg="danger" className="ms-1">
                  {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-lg border-0">
              <Card.Body>
                <Card.Title className="text-primary fs-4">User Info</Card.Title>
                <Card.Text className="fs-5">
                  <strong>Name:</strong> {userData?.name || "N/A"}<br />
                  <strong>Blood Group:</strong> {userData?.bloodGroup || "N/A"}<br />
                  <strong>Location:</strong> {userData?.location || "N/A"}<br />
                  <strong>Role:</strong> {userData?.role || "N/A"}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="shadow-lg border-0">
              <Card.Body>
                <Card.Title className="text-success fs-4">Quick Actions</Card.Title>
                <Button
                  variant="danger"
                  className="me-2 mb-2"
                  onClick={() => navigate("/post-request")}
                >
                  Post Request
                </Button>
                <Button
                  variant="primary"
                  className="mb-2"
                  onClick={() => navigate("/requests")}
                >
                  View Request List
                </Button>
                {userData?.role === "donor" && (
                  <>
                    <Button
                      variant="warning"
                      className="ms-2 mb-2"
                      onClick={() => setShowRequestsModal(true)}
                    >
                      View Requests
                      {donationRequests.filter(req => req.status === 'pending').length > 0 && (
                        <Badge bg="danger" className="ms-1">
                          {donationRequests.filter(req => req.status === 'pending').length}
                        </Badge>
                      )}
                    </Button>
                  </>
                )}
                {userData?.role === "recipient" && (
                  <Button
                    variant="success"
                    className="ms-2 mb-2"
                    onClick={() => navigate("/available-donors")}
                  >
                    Find Donors
                  </Button>
                )}
                <Button
                  variant="info"
                  className="ms-2 mb-2"
                  onClick={() => setShowChatModal(true)}
                >
                  View Messages
                  {Object.keys(unreadCounts).length > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Available Donors Section for Recipients */}
        {userData?.role === "recipient" && availableDonors.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-lg border-0">
                <Card.Body>
                  <Card.Title className="text-info fs-4">
                    Available Donors Near You
                  </Card.Title>
                  <Row>
                    {availableDonors.map(donor => (
                      <Col md={6} lg={4} key={donor.id} className="mb-3">
                        <Card>
                          <Card.Body>
                            <Card.Title>{donor.name}</Card.Title>
                            <Card.Text>
                              <strong>Blood Group:</strong> {donor.bloodGroup}<br />
                              <strong>Location:</strong> {donor.location}<br />
                              <strong>Last Donation:</strong> {donor.lastDonation || "N/A"}
                            </Card.Text>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => startConversation(donor)}
                            >
                              Contact Donor
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        
        {/* Donation Requests Preview for Donors */}
        {userData?.role === "donor" && donationRequests.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-lg border-0">
                <Card.Body>
                  <Card.Title className="text-warning fs-4">
                    Recent Donation Requests
                  </Card.Title>
                  <ListGroup variant="flush">
                    {donationRequests.slice(0, 3).map(request => (
                      <ListGroup.Item key={request.id}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{request.requesterName}</strong> needs {request.bloodGroup} blood
                            <Badge bg={request.status === 'pending' ? 'warning' : 
                                      request.status === 'accepted' ? 'success' : 'secondary'} 
                                   className="ms-2">
                              {request.status}
                            </Badge>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowRequestsModal(true)}
                          >
                            View Details
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  {donationRequests.length > 3 && (
                    <div className="text-center mt-3">
                      <Button variant="outline-primary" onClick={() => setShowRequestsModal(true)}>
                        View All Requests ({donationRequests.length})
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        
        <Row>
          <Col>
            <Card className="shadow-lg border-0">
              <Card.Body>
                <Card.Title className="text-warning fs-4">
                  Your Recent {userData?.role === "donor" ? "Donation Offers" : "Blood Requests"}
                </Card.Title>
                <ListGroup variant="flush">
                  {requests.length === 0 ? (
                    <ListGroup.Item className="text-muted">
                      No {userData?.role === "donor" ? "donation offers" : "requests"} found.
                    </ListGroup.Item>
                  ) : (
                    requests.map((req) => (
                      <ListGroup.Item key={req.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{req.bloodGroup}</strong> blood needed at {req.hospital || req.location}
                          {req.urgency && <span className="badge bg-danger ms-2">{req.urgency}</span>}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => navigate(`/request/${req.id}`)}
                        >
                          View Details
                        </Button>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;