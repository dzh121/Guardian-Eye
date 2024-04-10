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
import { auth, db } from "../../utils/firebase";
import { getAuth } from "firebase/auth";

type Camera = {
  id: string;
  location: string;
};

const SettingsComponent: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [notifications, setNotifications] = useState<boolean>(true);
  const [recognizeFaces, setRecognizeFaces] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>("light");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [cameras, setCameras] = useState<Camera[]>([]);

  const user = auth.currentUser;
  const userRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    if (user) {
      if (userRef) {
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setEmail(userData.email || "");
            setName(userData.name || "");
            setNotifications(userData.notifications);
            setTheme(userData.theme || "light");
            setRecognizeFaces(userData.recognizeFaces);
          }
        });
      }
    }
    const fetchCameras = async () => {
      // Replace this with your API call or Firebase call to fetch cameras
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();

        const response = await fetch(
          `http://localhost:8080/devices?token=${token}`
        );

        const camerasData = await response.json();
        setCameras(camerasData);
      } else {
        console.log("User not logged in");
      }
    };

    fetchCameras();
  }, []);

  const handleRemoveCamera = async (cameraId: string) => {
    try {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        await fetch(`http://localhost:8080/remove-device?token=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: cameraId }),
        });
        setCameras(cameras.filter((camera) => camera.id !== cameraId));
        setSuccess("Camera removed successfully!");
      } else {
        setError("User not logged in");
      }
    } catch (error) {
      setError("Error removing camera");
    }
  };
  const handleChange =
    (setState: React.Dispatch<React.SetStateAction<string>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setState(event.target.value);
      setSuccess("");
    };

  const handleEmailChange = handleChange(setEmail);
  const handlePasswordChange = handleChange(setPassword);
  const handleCurrentPasswordChange = handleChange(setCurrentPassword);
  const handleNameChange = handleChange(setName);
  const handleNotificationsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotifications(e.target.checked);
    setSuccess("");
  };

  const handleRecognizeFaces = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecognizeFaces(e.target.checked);
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    if (userRef === null) {
      setError("User not found");
      return;
    }

    // Password length validation
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      if (currentPassword && user.email) {
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
      await updateDoc(userRef, {
        email,
        name,
        notifications,
        recognizeFaces,
        theme,
      });

      if (theme === "dark") {
        document.body.classList.add("darkTheme");
      } else {
        document.body.classList.remove("darkTheme");
      }
      setSuccess("Settings updated successfully!");
      setError("");
      setPassword("");
      setCurrentPassword("");
    } catch (error: any) {
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

        <Form.Group controlId="formBasicCheckbox" className="mb-3">
          <Form.Check
            type="checkbox"
            label="Enable Face Recognition"
            checked={recognizeFaces}
            onChange={handleRecognizeFaces}
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
