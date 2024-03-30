import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap"; // Import the React Bootstrap card component
import { auth } from "./firebase";

const LiveVideoComponent = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const fetchStreamUrl = async () => {
      try {
        const token = await auth.currentUser.getIdToken(true);
        const urlWithToken = `http://localhost:5000/video_feed?token=${token}`;
        setVideoUrl(urlWithToken);

        setIsLoading(true);
        const response = await fetch(urlWithToken);
        if (response.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        console.error("Error fetching video feed:", error);
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamUrl();
    const handleThemeChange = () => {
      const isDarkTheme = document.body.classList.contains("darkTheme");
      setTheme(isDarkTheme ? "dark" : "light");
    };

    handleThemeChange(); // Initial theme setup

    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  return (
    <Card
      className="text-center mx-auto mt-5 p-3"
      style={{
        maxWidth: "88%",
        backgroundColor: theme === "dark" ? "#444" : "#fff",
      }}
    >
      <Card.Body>
        <Card.Title>Live Video Feed</Card.Title>
        {isLoading ? (
          <Card.Text>Loading...</Card.Text>
        ) : isOnline ? (
          <div className="video-container">
            <iframe
              src={videoUrl}
              className="video-frame"
              title="Live Video Feed"
              allowFullScreen
              style={{
                // If the iframe needs to be centered within the .video-container
                maxHeight: "100%", // This will maintain the aspect ratio
                objectFit: "contain", // This will prevent stretching if the aspect ratio is off
              }}
            ></iframe>
          </div>
        ) : (
          <Card.Text>Camera is not online</Card.Text>
        )}
      </Card.Body>
    </Card>
  );
};

export default LiveVideoComponent;
