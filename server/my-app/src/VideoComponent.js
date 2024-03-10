import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";

const VideoComponent = ({ videoFilename }) => {
  const [videoStream, setVideoStream] = useState(null);

  useEffect(() => {
    // Generate the video URL and clear it on component unmount
    let videoObjectUrl;
    let latestVideo = null;

    const getLatestVideo = async () => {
      try {
        const response = await fetch("http://localhost:3000/videos", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        const videoFiles = await response.json();
        console.log("Video files:", videoFiles);
        latestVideo = videoFiles[videoFiles.length - 1];
        console.log("Latest video:", latestVideo);
        fetchVideo();
      } catch (error) {
        console.error("There was a problem fetching the video files:", error);
      }
    };
    const fetchVideo = async () => {
      console.log("Fetching video URL...");
      console.log(`Latest video: /video/${latestVideo}`);
      try {
        const response = await fetch(`/video/${latestVideo}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Response status: ", response.status);

        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }

        const blob = await response.blob();
        console.log("Blob received:", blob);

        // Generate a URL for the blob
        videoObjectUrl = URL.createObjectURL(blob);
        setVideoStream(videoObjectUrl);
      } catch (error) {
        console.error("There was a problem fetching the video:", error);
      }
    };

    getLatestVideo();

    // Cleanup function to revoke the object URL
    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
        videoObjectUrl = null;
      }
    };
  }, [videoFilename]); // Depend on videoFilename

  console.log("Video URL:", videoStream);

  return (
    <Card>
      <Card.Body>
        <Card.Title>Uploaded Video</Card.Title>
        {/* Add a key to the video element to force it to re-render when videoStream changes */}
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
