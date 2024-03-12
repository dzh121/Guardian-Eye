import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import VideoComponent from "./VideoComponent";
import { Button } from "react-bootstrap";

const CameraDetectComponent = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchUserToken = async () => {
      const user = getAuth().currentUser;
      return user ? await user.getIdToken() : null;
    };

    const fetchVideos = async () => {
      try {
        const idToken = await fetchUserToken();
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
        setVideos(data.videos);
      } catch (error) {
        console.error("Error fetching videos: ", error);
        // Optionally, set an error state and display it in the UI
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleGoBack = () => {
    setSelectedVideo(null);
  };

  const convertTimestamp = (timestamp) => {
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

  if (selectedVideo) {
    return (
      <div>
        <VideoComponent videoFilename={selectedVideo} />
        <Button
          onClick={handleGoBack}
          style={{ marginBottom: "50px" }}
          variant="primary"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="video-wrapper">
      <h2>Camera Detect</h2>
      {videos.map((video, index) => (
        <Button
          key={index}
          onClick={() => handleVideoSelect(video)}
          variant="secondary"
          className="m-2"
        >
          {video.deviceLocation} - {convertTimestamp(video.timeSent)}
        </Button>
      ))}
    </div>
  );
};

export default CameraDetectComponent;
