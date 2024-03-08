import React, { useState } from "react";
import { Form, Button, Card, Container } from "react-bootstrap";
import { fetchWithToken } from "./api";

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to check if the user is authenticated
  const checkAuth = async () => {
    try {
      const data = await fetchWithToken("http://localhost:3000/check-auth");
      console.log("User is authenticated", data);
      return true;
    } catch (error) {
      console.error("Error during auth check:", error);
      return false;
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        console.log("Login successful");

        // Check authentication status after logging in
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          console.log("User is authenticated");
          window.location.href = "/home"; // Redirect to home page
        } else {
          console.log("User is not authenticated");
        }
      } else {
        console.log("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <Card style={{ width: "400px" }} className="p-4">
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
        </Form>
      </Card>
    </Container>
  );
}

export default LoginComponent;
