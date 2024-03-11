import React, { useState } from "react";
import { Form, Button, Card, Container } from "react-bootstrap";
import { auth } from "./firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to check if the user is authenticated
  const handleLogin = (event) => {
    event.preventDefault();

    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Get the ID token
        userCredential.user.getIdToken().then((idToken) => {
          // Send this token to your server for verification
          fetch("/verify-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Server response:", data);
              // Handle response from your server
            })
            .catch((error) => {
              console.error("Error posting token to server:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Login error:", error.message);
      });
  };
  return (
    <Container
      className="d-flex al  ign-items-center justify-content-center"
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
