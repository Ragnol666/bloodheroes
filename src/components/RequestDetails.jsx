// RequestDetails.jsx
import React, { useEffect, useState } from "react";
import { Container, Card, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { Droplet, GeoAlt, Clock, Person, ArrowLeft } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function RequestDetails() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError("");

        const docRef = doc(db, "requests", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRequest({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : data.createdAt?.seconds
                ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                : 'Unknown date'
          });
        } else {
          setError("Request not found");
        }
      } catch (err) {
        console.error("Error fetching request:", err);
        setError("Failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

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

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center my-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2">Loading request details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate("/requests")}>
            Back to Requests
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container className="mt-5">
        <Alert variant="warning" className="text-center">
          <h4>Request Not Found</h4>
          <p>The requested blood donation request could not be found.</p>
          <Button variant="primary" onClick={() => navigate("/requests")}>
            Back to Requests
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Button
        variant="outline-secondary"
        onClick={() => navigate("/requests")}
        className="mb-3"
      >
        <ArrowLeft className="me-2" />
        Back to Requests
      </Button>

      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h3 className="mb-0">
            <Droplet className="me-2" />
            Blood Request Details
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <strong>Blood Type:</strong>
                <Badge bg="danger" className="ms-2 fs-6">
                  {request.bloodGroup || request.bloodType}
                </Badge>
              </div>

              <div className="mb-3">
                <strong>Units Needed:</strong>
                <span className="ms-2">{request.unitsRequired} unit(s)</span>
              </div>

              <div className="mb-3">
                <strong>Urgency:</strong>
                <span className="ms-2">{getUrgencyBadge(request.urgency)}</span>
              </div>

              <div className="mb-3">
                <strong>Status:</strong>
                <Badge
                  bg={request.status === 'open' ? 'success' : 'secondary'}
                  className="ms-2"
                >
                  {request.status?.charAt(0)?.toUpperCase() + request.status?.slice(1) || 'Unknown'}
                </Badge>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <strong><Person className="me-2" />Patient:</strong>
                <span className="ms-2">{request.patientName || "Anonymous"}</span>
              </div>

              <div className="mb-3">
                <strong><GeoAlt className="me-2" />Hospital:</strong>
                <span className="ms-2">{request.hospital}</span>
              </div>

              <div className="mb-3">
                <strong>Location:</strong>
                <span className="ms-2">{request.location}</span>
              </div>

              <div className="mb-3">
                <strong><Clock className="me-2" />Posted:</strong>
                <span className="ms-2">{request.createdAt}</span>
              </div>
            </div>
          </div>

          <hr />

          <div className="mt-4">
            <h5>Additional Notes from Requester:</h5>
            {request.notes ? (
              <Card className="bg-light">
                <Card.Body>
                  <p className="mb-0">{request.notes}</p>
                </Card.Body>
              </Card>
            ) : (
              <Alert variant="info">
                No additional notes provided by the requester.
              </Alert>
            )}
          </div>

          {request.contactInfo && (
            <div className="mt-4">
              <h5>Contact Information:</h5>
              <Card className="bg-light">
                <Card.Body>
                  <p className="mb-0">{request.contactInfo}</p>
                </Card.Body>
              </Card>
            </div>
          )}

          {request.additionalDetails && (
            <div className="mt-4">
              <h5>Additional Details:</h5>
              <Card className="bg-light">
                <Card.Body>
                  <p className="mb-0">{request.additionalDetails}</p>
                </Card.Body>
              </Card>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RequestDetails;