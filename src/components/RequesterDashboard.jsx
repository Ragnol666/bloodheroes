import React, { useEffect, useState } from "react";
import { Table, Container, Spinner, Alert, Button, Badge, Form } from "react-bootstrap";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Droplet, GeoAlt, Clock, Person, Search } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function RequestList() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        // Simple query to get all requests ordered by creation date
        const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const requestsData = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          requestsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : data.createdAt?.seconds
                ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                : 'Unknown date'
          });
        });

        setRequests(requestsData);
        setFilteredRequests(requestsData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter requests based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = requests.filter(request =>
      (request.bloodGroup?.toLowerCase().includes(term)) ||
      (request.bloodType?.toLowerCase().includes(term)) ||
      (request.hospital?.toLowerCase().includes(term)) ||
      (request.location?.toLowerCase().includes(term)) ||
      (request.patientName?.toLowerCase().includes(term)) ||
      (request.urgency?.toLowerCase().includes(term))
    );

    setFilteredRequests(filtered);
  }, [searchTerm, requests]);

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

  const handleViewDetails = (requestId) => {
    navigate(`/requests/${requestId}`);
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
          Blood Requests
        </h2>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <Form.Group>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Search by blood type, hospital, location, patient name, or urgency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-5"
            />
            <Search
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
              size={20}
            />
          </div>
          <Form.Text className="text-muted">
            {filteredRequests.length} request(s) found
          </Form.Text>
        </Form.Group>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Alert variant="info" className="text-center">
          {searchTerm ? 'No requests match your search.' : 'No blood requests found.'}
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped hover className="align-middle">
            <thead className="table-dark">
              <tr>
                <th><Droplet /> Blood Type</th>
                <th><GeoAlt /> Hospital & Location</th>
                <th><Clock /> Urgency</th>
                <th><Person /> Patient</th>
                <th>Units Needed</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Badge bg="danger" className="fs-6">
                      {request.bloodGroup || request.bloodType || 'Unknown'}
                    </Badge>
                  </td>
                  <td>
                    <strong>{request.hospital || 'Unknown Hospital'}</strong>
                    <div className="small text-muted">
                      {request.location || 'No location specified'}
                    </div>
                  </td>
                  <td>
                    {getUrgencyBadge(request.urgency)}
                  </td>
                  <td>
                    {request.patientName || "Anonymous"}
                  </td>
                  <td>
                    {request.unitsRequired || 1}
                  </td>
                  <td className="small text-muted">
                    {request.createdAt}
                  </td>
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
    </Container>
  );
}

export default RequestList;