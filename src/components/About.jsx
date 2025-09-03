import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Heart, Droplet, People, Clock, Shield, Phone } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';


function About() {
  const navigate = useNavigate();

  return (
    <Container className="about-page py-5">
      {/* Hero Section */}
      <Row className="text-center mb-5">
        <Col>
          <div className="text-center mb-4 p-4 rounded border border-danger bg-light">
            <img
              src="/icon.jpg"
              alt="Blood Heroes"
              style={{ height: "100px" }}
              className="mb-3"
            />
            <h1 className="text-danger">About Blood Heroes</h1>
            <p className="lead text-muted">
              Connecting blood donors with those in need - saving lives one donation at a time
            </p>
          </div>
        </Col>
      </Row>

      {/* Mission Section */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-danger mb-4">
                <Heart className="me-2" />
                Our Mission
              </h2>
              <p className="fs-5">
                Blood Heroes is dedicated to creating a seamless connection between voluntary blood donors
                and patients in urgent need. We believe that no one should suffer due to lack of blood availability.
              </p>
              <p>
                Our platform bridges the gap between donors and recipients, making the process of finding
                compatible blood types faster, easier, and more efficient.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Features Section */}
      <Row className="mb-5">
        <Col>
          <h2 className="text-center text-danger mb-4">Why Choose Blood Heroes?</h2>
          <Row>
            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 border-0 text-center">
                <Card.Body>
                  <Droplet size={40} className="text-danger mb-3" />
                  <h5>Quick Matching</h5>
                  <p className="text-muted">
                    Instantly find donors with matching blood types in your area
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 border-0 text-center">
                <Card.Body>
                  <Clock size={40} className="text-danger mb-3" />
                  <h5>24/7 Availability</h5>
                  <p className="text-muted">
                    Emergency requests can be made anytime, anywhere
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 border-0 text-center">
                <Card.Body>
                  <Shield size={40} className="text-danger mb-3" />
                  <h5>Secure Platform</h5>
                  <p className="text-muted">
                    Your data is protected with industry-standard security measures
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 border-0 text-center">
                <Card.Body>
                  <People size={40} className="text-danger mb-3" />
                  <h5>Community Driven</h5>
                  <p className="text-muted">
                    Join a growing community of life-saving heroes
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* How It Works */}
      <Row className="mb-5">
        <Col lg={10} className="mx-auto">
          <h2 className="text-center text-danger mb-4">How It Works</h2>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="step-number">1</div>
              <h5>Create Request</h5>
              <p>Patients or hospitals create blood requests with specific requirements</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-number">2</div>
              <h5>Find Donors</h5>
              <p>Our system matches with compatible donors in the vicinity</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-number">3</div>
              <h5>Save Lives</h5>
              <p>Donors respond and coordinate directly to help those in need</p>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Blood Types Info */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto">
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h4 className="mb-0">Blood Types We Support</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Most Common Types:</h6>
                  <Badge bg="danger" className="me-2 mb-2">A+</Badge>
                  <Badge bg="danger" className="me-2 mb-2">B+</Badge>
                  <Badge bg="danger" className="me-2 mb-2">O+</Badge>
                  <Badge bg="danger" className="me-2 mb-2">AB+</Badge>
                </Col>
                <Col md={6}>
                  <h6>Rare Types:</h6>
                  <Badge bg="warning" text="dark" className="me-2 mb-2">A-</Badge>
                  <Badge bg="warning" text="dark" className="me-2 mb-2">B-</Badge>
                  <Badge bg="warning" text="dark" className="me-2 mb-2">O-</Badge>
                  <Badge bg="warning" text="dark" className="me-2 mb-2">AB-</Badge>
                </Col>
              </Row>
              <p className="mt-3 text-muted small">
                * O- is the universal donor and is always in high demand
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Row className="text-center mb-5">
        <Col>
          <div className="p-4 bg-light rounded">
            <h3 className="text-danger mb-3">Join Our Life-Saving Community</h3>
            <p className="mb-4">
              Whether you're a donor or in need, your participation can save lives
            </p>
            <Button
              variant="danger"
              size="lg"
              className="me-3"
              onClick={() => navigate('/register')}
            >
              Sign Up Now
            </Button>
            <Button
              variant="outline-danger"
              size="lg"
              onClick={() => navigate('/requests')}
            >
              View Requests
            </Button>
          </div>
        </Col>
      </Row>

      {/* Contact/Footer */}
      <Row>
        <Col>
          <Card className="text-center border-0">
            <Card.Body>
              <Phone size={24} className="text-danger mb-2" />
              <h6>Need Immediate Help?</h6>
              <p className="text-muted small">
                For emergency situations, please contact local emergency services first
              </p>
              <p className="text-muted">
                Email: help@bloodheroes.app • Support: 24/7 Available
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default About;