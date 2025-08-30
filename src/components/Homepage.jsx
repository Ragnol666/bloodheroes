import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, ListGroup } from "react-bootstrap";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Phone, Envelope, GeoAlt } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import HeroSlider from './HeroSlider';
import { useNavigate } from "react-router-dom";
import { nigerianStates, stateLGAs } from "./nigerian-states-lgas";

function Homepage() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLGA, setSelectedLGA] = useState("");
  const [lgas, setLgas] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Update LGAs when state changes
    if (selectedState && stateLGAs[selectedState]) {
      setLgas(stateLGAs[selectedState]);
      setSelectedLGA(''); // Reset LGA when state changes
    } else {
      setLgas([]);
    }
  }, [selectedState]);

  const searchDonors = async () => {
    if (!bloodGroup) {
      setError("Please select a blood group");
      return;
    }

    setLoading(true);
    setError(null);
    setDonors([]);

    try {
      let locationFilter = "";
      
      // Build location filter based on selected state and LGA
      if (selectedState && selectedLGA) {
        locationFilter = `${selectedLGA}, ${selectedState}`;
      } else if (selectedState) {
        locationFilter = selectedState;
      } else if (location) {
        locationFilter = location; // Fallback to text input
      }

      let q;
      if (locationFilter) {
        q = query(
          collection(db, "users"),
          where("bloodGroup", "==", bloodGroup),
          where("role", "==", "donor"),
          where("location", "==", locationFilter)
        );
      } else {
        q = query(
          collection(db, "users"),
          where("bloodGroup", "==", bloodGroup),
          where("role", "==", "donor")
        );
      }

      const querySnapshot = await getDocs(q);
      const donorList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDonors(donorList);
      setSearchPerformed(true);
    } catch (err) {
      console.error("Error searching donors:", err);
      setError("Failed to search donors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
  };

  const handleLGAChange = (e) => {
    setSelectedLGA(e.target.value);
  };

  return (
    <Container className="my-5">
      <HeroSlider />
      <Row className="justify-content-center mb-5">
        <Col md={8} className="text-center">
          <h1 className="text-danger mb-4">Blood Donation Network</h1>
          <p className="lead">
            Find blood donors in your area and help save lives
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center mb-5">
        <Col md={8}>
          <Card className="shadow-lg">
            <Card.Body>
              <Card.Title className="text-center mb-4">Find Blood Donors</Card.Title>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Blood Group *</Form.Label>
                    <Form.Select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      required
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Select
                      value={selectedState}
                      onChange={handleStateChange}
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  {selectedState && (
                    <Form.Group className="mb-3">
                      <Form.Label>Local Government Area (LGA)</Form.Label>
                      <Form.Select
                        value={selectedLGA}
                        onChange={handleLGAChange}
                      >
                        <option value="">Select LGA</option>
                        {lgas.map((lga) => (
                          <option key={lga} value={lga}>
                            {lga}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Specific Location (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter city, town, or exact location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      e.g., "Garki Area 2", "Surulere Lagos", etc.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <div className="text-center">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={searchDonors}
                  disabled={loading}
                  className="me-3"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Searching...
                    </>
                  ) : (
                    "Search Donors"
                  )}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/requests")}
                >
                  Show Requests
                </Button>
              </div>

              <div className="text-center mt-3">
                <small className="text-muted">
                  * Required field. Search by state/LGA or enter specific location.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {searchPerformed && (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-lg">
              <Card.Body>
                <Card.Title className="mb-4">
                  Available Donors ({donors.length} found)
                </Card.Title>
                
                {donors.length === 0 ? (
                  <Alert variant="info">
                    No donors found matching your criteria. Try broadening your search.
                  </Alert>
                ) : (
                  <ListGroup variant="flush">
                    {donors.map((donor) => (
                      <ListGroup.Item key={donor.id} className="py-3">
                        <Row className="align-items-center">
                          <Col md={4}>
                            <h5>{donor.name}</h5>
                            <div className="text-muted">
                              <GeoAlt className="me-2" />
                              {donor.location}
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="d-flex align-items-center mb-2">
                              <Phone className="me-2" />
                              {donor.phone || "Phone not provided"}
                            </div>
                            <div className="d-flex align-items-center">
                              <Envelope className="me-2" />
                              {donor.email}
                            </div>
                          </Col>
                          <Col md={4} className="text-end">
                            <span className="badge bg-danger fs-6">
                              {donor.bloodGroup}
                            </span>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mt-5 justify-content-center">
        <Col md={8} className="text-center">
          <h3 className="mb-4">How It Works</h3>
          <Row>
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <div className="text-danger fs-1 mb-3">1</div>
                  <Card.Title>Search Donors</Card.Title>
                  <Card.Text>
                    Find compatible blood donors in your area by blood type and location
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <div className="text-danger fs-1 mb-3">2</div>
                  <Card.Title>Contact Donor</Card.Title>
                  <Card.Text>
                    Reach out to available donors through their provided contact information
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <div className="text-danger fs-1 mb-3">3</div>
                  <Card.Title>Save Lives</Card.Title>
                  <Card.Text>
                    Arrange for blood donation at authorized medical centers
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default Homepage;