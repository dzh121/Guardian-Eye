import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const VideoComponent = ({ videoFilename }) => {
  const [videoStream, setVideoStream] = useState(null);
  const [videoDetails, setVideoDetails] = useState({
    location: "",
    timestamp: "",
  });

  useEffect(() => {
    let videoObjectUrl;

    const fetchUserToken = async () => {
      const user = getAuth().currentUser;
      return user ? await user.getIdToken() : null;
    };

    const fetchLatestVideoFilename = async (idToken) => {
      const response = await fetch("http://localhost:3000/videos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      console.log("data: ", data);
      setVideoDetails({ location: data.location, timestamp: data.timestamp });
      return data.latestVideoName;
    };

    const fetchVideoStream = async (idToken, filename) => {
      const response = await fetch(`/video/${filename}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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

    const fetchAndSetVideo = async () => {
      try {
        const idToken = await fetchUserToken();
        if (idToken) {
          const latestVideoFilename = await fetchLatestVideoFilename(idToken);
          console.log("latestVideoFilename: ", latestVideoFilename);
          await fetchVideoStream(idToken, latestVideoFilename);
        } else {
          console.log("No user is signed in");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchAndSetVideo();

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
    <Card>
      <Card.Body>
        <Card.Title>Uploaded Video</Card.Title>
        {videoDetails.location && <p>Location: {videoDetails.location}</p>}
        {videoDetails.timestamp && (
          <p>
            Time Sent: {convertFirestoreTimestampToDate(videoDetails.timestamp)}
          </p>
        )}
        <video key={videoStream} width="100%" height="auto" controls>
          {videoStream ? (
            <source src={videoStream} type="video/mp4" />
          ) : (
            "Loading video..."
          )}
        </video>
      </Card.Body>
    </Card>
  );
};

export default VideoComponent;
