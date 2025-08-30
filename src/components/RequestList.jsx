import React, { useEffect, useState } from "react";
import { Table, Container, Spinner, Alert, Button, Badge, Modal, Form } from "react-bootstrap";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Droplet, GeoAlt, Clock, Telephone, Person, Chat } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function RequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'open', 'urgent'
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversations, setConversations] = useState({});
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener to get user role
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Try to get role from user object first, then from localStorage
        const role = user.role || localStorage.getItem('userRole');
        setUserRole(role);

        // If still no role, try to fetch it from Firestore
        if (!role) {
          fetchUserRole(user.uid);
        } else {
          // If we have a role, we're ready to fetch requests
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user role from Firestore
  const fetchUserRole = async (userId) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const role = userData.role;
        setUserRole(role);
        // Store in localStorage for future use
        localStorage.setItem('userRole', role);
      } else {
        setError('User data not found');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        // Base query - first try without any filters to see what data exists
        let q = query(collection(db, "requests"));

        console.log("Fetching requests with role:", userRole);

        // Try different query approaches to see what works
        try {
          // First try with ordering
          q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
        } catch (orderError) {
          console.log("Ordering error, trying without order:", orderError);
          // If ordering fails, try without it
          q = query(collection(db, "requests"));
        }

        // Add filters based on user role
        if (userRole === "donor") {
          try {
            q = query(
              collection(db, "requests"),
              where("status", "==", "open"),
              orderBy("createdAt", "desc")
            );
          } catch (filterError) {
            console.log("Filter error, trying without status filter:", filterError);
            // If filtering fails, try without it
            q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
          }
        }

        // Add urgency filter if needed
        if (filter === "urgent") {
          try {
            // Create a new query with urgency filter
            const baseQuery = userRole === "donor"
              ? query(collection(db, "requests"), where("status", "==", "open"))
              : query(collection(db, "requests"));

            q = query(baseQuery, where("urgency", "==", "emergency"), orderBy("createdAt", "desc"));
          } catch (urgencyError) {
            console.log("Urgency filter error:", urgencyError);
            // If urgency filter fails, fall back to previous query
            q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
          }
        }

        const querySnapshot = await getDocs(q);
        console.log("Found", querySnapshot.size, "requests");

        const requestsData = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          console.log("Request data:", data);
          requestsData.push({
            id: doc.id,
            ...data,
            // Handle different timestamp formats
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : data.createdAt?.seconds
                ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                : 'Unknown date'
          });
        });

        setRequests(requestsData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests. Please try again.");

        // Try a simple query as fallback
        try {
          const simpleQuery = query(collection(db, "requests"));
          const simpleSnapshot = await getDocs(simpleQuery);
          const simpleData = simpleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: 'Unknown date'
          }));
          setRequests(simpleData);
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userRole !== null) {
      fetchRequests();
    }
  }, [filter, userRole]);

  // Listen for conversations if user is a donor
  useEffect(() => {
    if (userRole !== "donor" || !auth.currentUser) return;

    try {
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("donorId", "==", auth.currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const convos = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          convos[data.requestId] = {
            id: doc.id,
            lastMessage: data.lastMessage,
            lastUpdated: data.lastUpdated
          };
        });
        setConversations(convos);
      }, (error) => {
        console.error("Error listening to conversations:", error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up conversations listener:", error);
    }
  }, [userRole]);

  const getUrgencyBadge = (urgency) => {
    if (!urgency) return <Badge bg="secondary">Normal</Badge>;

    switch (urgency.toLowerCase()) {
      case "emergency":
        return <Badge bg="danger">Emergency</Badge>;
      case "urgent":
        return <Badge bg="warning" text="dark">Urgent</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };

  // In your RequestList.jsx, update the handleViewDetails function:
  const handleViewDetails = (requestId) => {
    navigate(`/requests/${requestId}`);
  };


  const handleOpenMessageModal = (request) => {
    setSelectedRequest(request);
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageText("");
    setSelectedRequest(null);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRequest) return;

    try {
      setSendingMessage(true);

      // Check if conversation already exists
      const existingConvoId = conversations[selectedRequest.id]?.id;

      if (existingConvoId) {
        // Add message to existing conversation
        await addDoc(
          collection(db, "conversations", existingConvoId, "messages"),
          {
            text: messageText,
            senderId: auth.currentUser.uid,
            senderRole: userRole,
            createdAt: serverTimestamp()
          }
        );

        // Update conversation last message
        await updateDoc(doc(db, "conversations", existingConvoId), {
          lastMessage: messageText,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Create new conversation
        const convoRef = await addDoc(collection(db, "conversations"), {
          requestId: selectedRequest.id,
          donorId: auth.currentUser.uid,
          requesterId: selectedRequest.userId,
          bloodType: selectedRequest.bloodGroup || selectedRequest.bloodType,
          hospital: selectedRequest.hospital,
          lastMessage: messageText,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });

        // Add first message
        await addDoc(
          collection(db, "conversations", convoRef.id, "messages"),
          {
            text: messageText,
            senderId: auth.currentUser.uid,
            senderRole: userRole,
            createdAt: serverTimestamp()
          }
        );
      }

      handleCloseMessageModal();
      alert("Message sent successfully!");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewConversation = (requestId) => {
    const convoId = conversations[requestId]?.id;
    if (convoId) {
      navigate(`/messages/${convoId}`);
    }
  };

  // Show different content based on authentication status
  if (!auth.currentUser) {
    return (
      <Container className="mt-5">
        <Alert variant="warning" className="text-center">
          <h4>Authentication Required</h4>
          <p>Please log in to view blood requests.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Login
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-danger">
          <Droplet className="me-2" />
          {userRole === "donor" ? "Available Requests" : "Your Blood Requests"}
        </h2>

        {userRole === "donor" && (
          <div>
            <Button
              variant={filter === "all" ? "danger" : "outline-danger"}
              size="sm"
              className="me-2"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "urgent" ? "danger" : "outline-danger"}
              size="sm"
              onClick={() => setFilter("urgent")}
            >
              Emergency Only
            </Button>
          </div>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Alert variant="info" className="text-center">
          No blood requests found. {userRole !== "donor" && (
            <Button variant="link" onClick={() => navigate("/post-request")}>
              Post a request
            </Button>
          )}
          <div className="mt-2">
            <small className="text-muted">
              Debug: Check console for more information about the query results.
            </small>
          </div>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped hover className="align-middle">
            <thead className="table-dark">
              <tr>
                <th><Droplet /> Blood</th>
                <th><GeoAlt /> Location</th>
                <th><Clock /> Urgency</th>
                <th><Person /> Patient</th>
                {userRole === "donor" && <th>Contact</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Badge bg="danger" className="fs-6">
                      {request.bloodGroup || request.bloodType}
                    </Badge>
                    <div className="small text-muted">
                      {request.unitsRequired} unit(s) needed
                    </div>
                  </td>
                  <td>
                    <strong>{request.hospital}</strong>
                    <div className="small text-muted">
                      {request.location}
                    </div>
                  </td>
                  <td>
                    {getUrgencyBadge(request.urgency)}
                    <div className="small text-muted">
                      Posted {request.createdAt}
                    </div>
                  </td>
                  <td>
                    {request.patientName || "Anonymous"}
                  </td>
                  {userRole === "donor" && (
                    <td>
                      {conversations[request.id] ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleViewConversation(request.id)}
                        >
                          <Chat /> View Conversation
                        </Button>
                      ) : (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenMessageModal(request)}
                        >
                          <Telephone /> Contact
                        </Button>
                      )}
                    </td>
                  )}
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleViewDetails(request.id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={handleCloseMessageModal}>
        <Modal.Header closeButton>
          <Modal.Title>Contact Requester</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>
                You're contacting the requester for <Badge bg="danger">{selectedRequest.bloodGroup || selectedRequest.bloodType}</Badge> blood at{" "}
                <strong>{selectedRequest.hospital}</strong>.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Your Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Introduce yourself and let the requester know you're available to help..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseMessageModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageText.trim()}
          >
            {sendingMessage ? "Sending..." : "Send Message"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default RequestList;