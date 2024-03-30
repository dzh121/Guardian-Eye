import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { Card } from "react-bootstrap";
=======
import { Card, Button } from "react-bootstrap";
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
import { getAuth } from "firebase/auth";

const VideoComponent = ({ videoFilename, onGoBack }) => {
  const [videoStream, setVideoStream] = useState(null);
  const [videoDetails, setVideoDetails] = useState({
    location: "",
    timestamp: "",
  });
<<<<<<< HEAD

  useEffect(() => {
=======
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const handleThemeChange = () => {
      const isDarkTheme = document.body.classList.contains("darkTheme");
      setTheme(isDarkTheme ? "dark" : "light");
    };

    handleThemeChange();

    window.addEventListener("themeChange", handleThemeChange);

>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
    let videoObjectUrl;

    const fetchUserToken = async () => {
      const user = getAuth().currentUser;
      if (user) {
        console.log("User is signed in, fetching token...");
<<<<<<< HEAD
        return await user.getIdToken();
      } else {
        console.log("No user is signed in");
=======
        window.removeEventListener("themeChange", handleThemeChange);
        return await user.getIdToken();
      } else {
        console.log("No user is signed in");
        window.removeEventListener("themeChange", handleThemeChange);
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
        return null;
      }
    };

    const fetchVideoStream = async (idToken, filename) => {
      console.log("Fetching video stream for:", filename);
      const response = await fetch(`/video/${filename}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/ json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const blob = await response.blob();
      videoObjectUrl = URL.createObjectURL(blob);
      setVideoStream(videoObjectUrl);
    };

    const fetchIdAndSetVideo = async () => {
      const idToken = await fetchUserToken();
      if (idToken) {
        setVideoDetails({
          location: videoFilename.deviceLocation,
          timestamp: videoFilename.timeSent,
        });
        await fetchVideoStream(idToken, videoFilename.fileName);
      }
    };

    fetchIdAndSetVideo();

    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, [videoFilename]);

  const convertFirestoreTimestampToDate = (timestamp) => {
    if (timestamp && timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    }
    return "";
  };

  return (
    <Card
      style={{
        backgroundColor: theme === "dark" ? "#444" : "#fff",
        marginBottom: "120px",
      }}
    >
      <Card.Body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card.Title>Uploaded Video</Card.Title>
<<<<<<< HEAD
        {videoDetails.location && <p>Location: {videoDetails.location}</p>}
        {videoDetails.timestamp && (
          <p>
            Time Sent: {convertFirestoreTimestampToDate(videoDetails.timestamp)}
          </p>
=======
        {videoDetails.location && (
          <Card.Text>
            <b>Location:</b> {videoDetails.location}
          </Card.Text>
        )}
        {videoDetails.timestamp && (
          <Card.Text>
            <b>Time Sent:</b>{" "}
            {convertFirestoreTimestampToDate(videoDetails.timestamp)}
          </Card.Text>
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
        )}
        <video key={videoStream} width="88%" height="auto" controls>
          {videoStream ? (
            <source src={videoStream} type="video/mp4" />
          ) : (
            "Loading video..."
          )}
        </video>
        <Button
          onClick={onGoBack}
          style={{ marginTop: "10px" }}
          variant="primary"
        >
          Go Back
        </Button>
      </Card.Body>
    </Card>
  );
};

export default VideoComponent;
