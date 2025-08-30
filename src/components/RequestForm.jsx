import React, { useState, useEffect } from "react";
import { Form, Button, Container, Alert, Spinner, Row, Col } from "react-bootstrap";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { GeoAlt, Droplet, Clock, CheckCircleFill } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function RequestForm() {
  const navigate = useNavigate();
  const [request, setRequest] = useState({
    bloodGroup: "",
    location: "",
    urgency: "normal",
    hospital: "",
    unitsRequired: 1,
    patientName: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userData, setUserData] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Pre-fill user data if available
  useEffect(() => {
    if (auth.currentUser) {
      // In a real app, you might fetch this from Firestore
      setUserData({
        bloodGroup: auth.currentUser.bloodGroup || "",
        location: auth.currentUser.location || ""
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to post a request");
      }

      await addDoc(collection(db, "requests"), {
        ...request,
        userId: auth.currentUser.uid,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess("Blood request posted successfully!");
      setShowNotification(true);
      
      setRequest({
        bloodGroup: "",
        location: "",
        urgency: "normal",
        hospital: "",
        unitsRequired: 1,
        patientName: ""
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      // Redirect after 3 seconds
      setTimeout(() => navigate("/requests"), 3000);
    } catch (error) {
      console.error("Error posting request:", error);
      setError(error.message || "Failed to post request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Notification Bar */}
      {showNotification && (
        <div 
          className="notification-bar"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1050,
            minWidth: "300px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            animation: "slideIn 0.3s ease-out"
          }}
        >
          <CheckCircleFill 
            className="me-2" 
            style={{ color: "#28a745", fontSize: "1.5rem" }} 
          />
          <div>
            <h6 style={{ margin: 0, color: "#155724" }}>Request Submitted!</h6>
            <p style={{ margin: "4px 0 0 0", color: "#155724", fontSize: "0.9rem" }}>
              Your blood request has been successfully submitted.
            </p>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              marginLeft: "auto",
              color: "#6c757d",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>
      )}

      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="shadow-lg p-4 rounded-3">
              <h2 className="text-center mb-4 text-danger">
                <Droplet className="me-2" />
                Post Blood Request
              </h2>
              
              {error && <Alert variant="danger" className="text-center">{error}</Alert>}
              {success && <Alert variant="success" className="text-center">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Droplet className="me-2" />
                        Blood Group Required
                      </Form.Label>
                      <Form.Select
                        name="bloodGroup"
                        value={request.bloodGroup}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Clock className="me-2" />
                        Urgency Level
                      </Form.Label>
                      <Form.Select
                        name="urgency"
                        value={request.urgency}
                        onChange={handleChange}
                        required
                      >
                        <option value="normal">Normal (Within 48 hours)</option>
                        <option value="urgent">Urgent (Within 24 hours)</option>
                        <option value="emergency">Emergency (Immediate)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <GeoAlt className="me-2" />
                    Hospital/Location
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="hospital"
                    placeholder="Enter hospital name or exact location"
                    value={request.hospital}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Patient Name (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="patientName"
                    placeholder="Enter patient name if different from yours"
                    value={request.patientName}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Units Required</Form.Label>
                  <Form.Control
                    type="number"
                    name="unitsRequired"
                    min="1"
                    max="10"
                    value={request.unitsRequired}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="danger" 
                    type="submit" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />
                        <span className="ms-2">Posting Request...</span>
                      </>
                    ) : (
                      "Post Blood Request"
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .notification-bar {
            animation: slideIn 0.3s ease-out;
          }
        `}
      </style>
    </>
  );
}

export default RequestForm;