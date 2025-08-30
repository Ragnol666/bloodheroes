import React, { useState, useEffect } from "react";
import { 
  Form, 
  Button, 
  Container, 
  Alert, 
  Spinner, 
  Row, 
  Col,
  Card  // Added Card import
} from "react-bootstrap";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticating(false);
      if (user) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Redirect handled by auth state listener
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Try again later or reset your password.";
          break;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (isAuthenticating) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card className="shadow-lg border-0">
          <Card.Body>
            <div className="text-center mb-4">
              <img 
                src="/icon.jpg" 
                alt="Blood Donation App" 
                style={{ height: "80px" }} 
                className="mb-3"
              />
              <h2 className="text-danger">Welcome Back</h2>
              <p className="text-muted">Sign in to continue</p>
            </div>

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end mb-3">
                <Link to="/forgot-password" className="text-danger small">
                  Forgot Password?
                </Link>
              </div>

              <Button
                variant="danger"
                type="submit"
                className="w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Signing In...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center mt-3">
                <p className="text-muted">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-danger fw-bold">
                    Sign Up
                  </Link>
                </p>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Row className="mt-3">
          <Col className="text-center">
            <Button variant="outline-danger" className="me-2">
              <i className="bi bi-google"></i>
            </Button>
            <Button variant="outline-primary" className="me-2">
              <i className="bi bi-facebook"></i>
            </Button>
            <Button variant="outline-dark">
              <i className="bi bi-github"></i>
            </Button>
          </Col>
        </Row>
      </div>
    </Container>
  );
}

export default Login;