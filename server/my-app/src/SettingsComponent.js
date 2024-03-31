import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getAuth } from "firebase/auth";

const SettingsComponent = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Added for user name
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const user = auth.currentUser;
  const userRef = user ? doc(db, "users", user.uid) : null;
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    if (user) {
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setEmail(userData.email || "");
          setName(userData.name || "");
          setNotifications(userData.notifications || true);
          setTheme(userData.theme || "light");
        }
      });
    }
    const fetchCameras = async () => {
      // Replace this with your API call or Firebase call to fetch cameras
      const token = await getAuth().currentUser.getIdToken();
      const response = await fetch(
        `http://localhost:8080/devices?token=${token}`
      );

      const camerasData = await response.json();
      setCameras(camerasData);
    };

    fetchCameras();
  }, []);

  const handleRemoveCamera = async (cameraId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch(`http://localhost:8080/remove-device?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: cameraId }),
      });
      setCameras(cameras.filter((camera) => camera.id !== cameraId));
      setSuccess("Camera removed successfully!");
    } catch (error) {
      setError("Error removing camera");
    }
  };
  const handleChange = (setState) => (event) => {
    setState(event.target.value);
    setSuccess("");
  };

  const handleEmailChange = handleChange(setEmail);
  const handlePasswordChange = handleChange(setPassword);
  const handleCurrentPasswordChange = handleChange(setCurrentPassword);
  const handleNameChange = handleChange(setName);
  const handleNotificationsChange = (e) => {
    setNotifications(e.target.checked);
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Password length validation
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      if (password && password !== currentPassword) {
        await updatePassword(user, password);
      }
      // Update email in Firebase Auth
      await updateEmail(user, email);

      // Update Firestore data (excluding the password)
      await updateDoc(userRef, { email, name, notifications, theme });

      if (theme === "dark") {
        document.body.classList.add("darkTheme");
      } else {
        document.body.classList.remove("darkTheme");
      }
      setSuccess("Settings updated successfully!");
      setError("");
      setPassword("");
      setCurrentPassword("");
    } catch (error) {
      console.error("Error updating settings:", error);
      setError(error.message || "An error occurred");
      setSuccess("");
    }
  };

  // Ensure user is not null before rendering the form
  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <Container>
      <h2 className="text-center">Settings</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form.Group controlId="formBasicName">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={handleNameChange}
        />
      </Form.Group>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            autoComplete="new-email"
            onChange={handleEmailChange}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="New Password"
            value={password}
            autoComplete="new-password"
            onChange={handlePasswordChange}
          />
        </Form.Group>
        <Form.Group controlId="formBasicCurrentPassword">
          <Form.Label>Current Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={handleCurrentPasswordChange}
            autoComplete="off"
          />
        </Form.Group>
        <Form.Group controlId="formBasicCheckbox" className="mb-3">
          <Form.Check
            type="checkbox"
            label="Enable Notifications"
            checked={notifications}
            onChange={handleNotificationsChange}
            className="d-flex justify-content-center"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Theme</Form.Label>
          <ToggleButtonGroup
            type="radio"
            name="themes"
            value={theme}
            className="d-flex justify-content-center"
          >
            <ToggleButton
              id="tbg-radio-1"
              value="light"
              variant={theme === "light" ? "primary" : "outline-secondary"}
              checked={theme === "light"}
              onChange={(e) => setTheme(e.currentTarget.value)}
            >
              Light
            </ToggleButton>
            <ToggleButton
              id="tbg-radio-2"
              value="dark"
              variant={theme === "dark" ? "primary" : "outline-secondary"}
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.currentTarget.value)}
            >
              Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>
        <h3 className="mt-4">Connected Cameras</h3>
        {cameras.length > 0 ? (
          cameras.map((camera) => (
            <Row key={camera.id} className="align-items-center mb-2">
              <Col md={8} sm={6}>
                <p className="mb-0">
                  {camera.id} - {camera.location}
                </p>
              </Col>
              <Col md={4} sm={6} className="text-md-right text-sm-left">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleRemoveCamera(camera.id)}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          ))
        ) : (
          <p>No cameras connected</p>
        )}
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </Container>
  );
};

export default SettingsComponent;
