import React, { useState, useEffect } from "react";
import { Card, Button } from "react-bootstrap";

const HomeComponent: React.FC = () => {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    // Listen for theme changes and update the component
    const handleThemeChange = () => {
      const isDarkTheme = document.body.classList.contains("darkTheme");
      setTheme(isDarkTheme ? "dark" : "light");
    };

    handleThemeChange(); // Initial theme setup

    // Assume "themeChange" is a custom event you've defined elsewhere
    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  return (
    <div className="home-component">
      <h2 className="text-center home-title">
        Welcome to Your Surveillance System
      </h2>

      <div className="d-flex flex-wrap justify-content-center">
        {/* Dashboard Card for Live Feed */}
        <Card
          style={{
            width: "18rem",
            backgroundColor: theme === "dark" ? "#444" : "#fff",
          }}
          className="m-2 card-container text-white"
        >
          <Card.Img variant="top" src="live-feed.png" className="card-image" />
          <Card.Body>
            <Card.Title>Live Camera Feed</Card.Title>
            <Card.Text>Watch real-time video from your cameras.</Card.Text>
            <Button variant="primary" href="/LiveFeed">
              Go to Live Feed
            </Button>
          </Card.Body>
        </Card>

        {/* Dashboard Card for Camera Detection */}
        <Card
          style={{
            width: "18rem",
            backgroundColor: theme === "dark" ? "#444" : "#fff",
          }}
          className="m-2 card-container text-white"
        >
          <Card.Img
            variant="top"
            src="security-footage.png"
            className="card-image"
          />
          <Card.Body>
            <Card.Title>Security Footage Clips</Card.Title>
            <Card.Text>
              Review the recordings triggered by camera detection.
            </Card.Text>
            <Button variant="primary" href="/SecurityFootage">
              View Clips
            </Button>
          </Card.Body>
        </Card>
        {/* Dashboard Card for familiar faces */}
        <Card
          style={{
            width: "18rem",
            backgroundColor: theme === "dark" ? "#444" : "#fff",
          }}
          className="m-2 card-container text-white"
        >
          <Card.Img
            variant="top"
            src="familiar-faces.png"
            className="card-image"
          />
          <Card.Body>
            <Card.Title>Familiar Faces</Card.Title>
            <Card.Text> Explore and Manage Your Familiar Faces List</Card.Text>
            <Button variant="primary" href="/familiarFaces">
              Manage Familiar Faces
            </Button>
          </Card.Body>
        </Card>
        {/* Dashboard Card for Settings */}
        <Card
          style={{
            width: "18rem",
            backgroundColor: theme === "dark" ? "#444" : "#fff",
          }}
          className="m-2 card-container text-white"
        >
          <Card.Img variant="top" src="settings.png" className="card-image" />
          {/* Placeholder image */}
          <Card.Body>
            <Card.Title>Settings</Card.Title>
            <Card.Text>Adjust your system settings and preferences.</Card.Text>
            <Button variant="primary" href="/settings">
              Go to Settings
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default HomeComponent;
