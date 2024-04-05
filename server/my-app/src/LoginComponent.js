import React, { useState } from "react";
import { Form, Button, Card, Container, Alert } from "react-bootstrap";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();
    setError(""); // Clear any existing errors

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Logged in successfully
        console.log("Logged in user:", userCredential.user);
      })
      .catch((error) => {
        setError("Failed to log in. Please check your email and password.");
      });
  };

  const handleForgotPassword = () => {
    setError(""); // Clear any existing errors
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setError("");
        setResetPassword(true);
      })
      .catch((error) => {
        setError("Failed to send password reset email.");
      });
  };
  const navigateToRegister = () => {
    navigate("/register");
  };
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <Card style={{ width: "400px" }} className="p-4">
        <Card.Body>
          <Card.Title>Login</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          {resetPassword && (
            <Alert variant="success">
              Check your email for password reset instructions.
            </Alert>
          )}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Login
            </Button>
            <Button
              variant="link"
              onClick={handleForgotPassword}
              className="mt-3"
            >
              Forgot Password?
            </Button>
            <Button
              variant="link"
              onClick={navigateToRegister}
              className="mt-3"
            >
              Don't have an account? Register
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginComponent;
