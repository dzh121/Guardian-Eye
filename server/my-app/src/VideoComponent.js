import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";

const VideoComponent = ({ videoFilename }) => {
  const [videoStream, setVideoStream] = useState(null);

  useEffect(() => {
    console.log("Fetching video URL...");
    // Fetch video URL from the server
    fetch(`/video/${videoFilename}`)
      .then((response) => {
        console.log("Response status: ", response.status);
        if (response.ok) {
          return response.blob();
        }
        throw new Error("Network response was not ok.");
      })
      .then((blob) => {
        console.log("Blob received:", blob);
        const stream = URL.createObjectURL(blob);
        setVideoStream(stream);
      })
      .catch((error) => {
        console.error("There was a problem fetching the video:", error);
      });
  }, [videoFilename]); // Include videoFilename in dependencies

  console.log("Video URL:", videoStream);

  return (
    <Card>
      <Card.Body>
        <Card.Title>Uploaded Video</Card.Title>
        <video width="100%" height="auto" controls>
          {videoStream && <source src={videoStream} type="video/mp4" />}
          Your browser does not support the video tag.
        </video>
      </Card.Body>
    </Card>
  );
};

export default VideoComponent;
