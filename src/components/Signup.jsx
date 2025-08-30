import React, { useState, useEffect } from "react";
import { Form, Button, Container, Alert, Row, Col } from "react-bootstrap";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { nigerianStates, stateLGAs } from "./nigerian-states-lgas";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bloodGroup: "",
    location: "",
    state: "",
    lga: "",
    role: "donor"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lgas, setLgas] = useState([]);

  // Update LGAs when state changes
  useEffect(() => {
    if (formData.state && stateLGAs[formData.state]) {
      setLgas(stateLGAs[formData.state]);
      setFormData(prev => ({ ...prev, lga: "" })); // Reset LGA when state changes
    } else {
      setLgas([]);
    }
  }, [formData.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.bloodGroup) {
      setError("Please select a blood group");
      return;
    }

    // Build location string
    let locationString = "";
    if (formData.state && formData.lga) {
      locationString = `${formData.lga}, ${formData.state}`;
    } else if (formData.state) {
      locationString = formData.state;
    } else if (formData.location) {
      locationString = formData.location;
    } else {
      setError("Please provide a location (state/LGA or specific location)");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        bloodGroup: formData.bloodGroup,
        location: locationString,
        state: formData.state,
        lga: formData.lga,
        role: formData.role,
        createdAt: new Date()
      });
      
      setSuccess("Signup successful! You can now log in.");
      setFormData({
        name: "",
        email: "",
        password: "",
        bloodGroup: "",
        location: "",
        state: "",
        lga: "",
        role: "donor"
      });
      setLgas([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4 text-center text-danger">Signup</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSignup}>
        {/* Name and Email */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Password */}
        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>Password *</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </Form.Group>

        {/* Blood Group and Role */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formBloodGroup">
              <Form.Label>Blood Group *</Form.Label>
              <Form.Select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
              >
                <option value="">Select Blood Type</option>
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
            <Form.Group className="mb-3" controlId="formRole">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="donor">Blood Donor</option>
                <option value="recipient">Recipient</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Location Section */}
        <div className="mb-4 p-3 border rounded">
          <h6 className="text-muted mb-3">Location Information</h6>
          
          {/* State Selection */}
          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Select
              name="state"
              value={formData.state}
              onChange={handleChange}
            >
              <option value="">Select State</option>
              {nigerianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* LGA Selection (only shows when state is selected) */}
          {formData.state && (
            <Form.Group className="mb-3">
              <Form.Label>Local Government Area (LGA)</Form.Label>
              <Form.Select
                name="lga"
                value={formData.lga}
                onChange={handleChange}
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

          {/* Specific Location (Optional) */}
          <Form.Group className="mb-3">
            <Form.Label>Specific Location (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="location"
              placeholder="e.g., Garki Area 2, Surulere Lagos, etc."
              value={formData.location}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Enter your exact area or neighborhood if known
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="mt-2">
            <small>
              <strong>Note:</strong> We'll use your state/LGA for better matching. 
              Your exact address will remain private.
            </small>
          </Alert>
        </div>

        <Button variant="danger" type="submit" className="w-100 py-2">
          Create Account
        </Button>
      </Form>

      <div className="text-center mt-3">
        <small className="text-muted">
          Already have an account? <a href="/login">Login here</a>
        </small>
      </div>
    </Container>
  );
}

export default Signup;