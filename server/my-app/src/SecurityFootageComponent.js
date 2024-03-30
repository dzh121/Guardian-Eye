import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import VideoComponent from "./VideoComponent";
import { Button, Container, Row, Col } from "react-bootstrap";

const SecurityFootageComponent = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [fetchingClips, setFetchingClips] = useState(true);

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
        setFetchingClips(false); // Set fetchingClips to false once clips are fetched
      } catch (error) {
        console.error("Error fetching videos: ", error);
        setFetchingClips(false); // Set fetchingClips to false in case of error too
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

  if (fetchingClips) {
    return <p className="text-center">Fetching clips...</p>;
  }

  if (selectedVideo) {
    return (
      <div>
<<<<<<< HEAD
        <VideoComponent videoFilename={selectedVideo} />
        <Button
          onClick={handleGoBack}
          style={{ marginBottom: "50px" }}
          variant="primary"
        >
          Go Back
        </Button>
=======
        <VideoComponent videoFilename={selectedVideo} onGoBack={handleGoBack} />
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
      </div>
    );
  }

  return (
    <Container>
      <h2 className="text-center">Security Footage</h2>
      {videos.length === 0 ? (
        <p className="text-center">No clips found</p>
      ) : (
        <Row>
          {videos.map((video, index) => (
            <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-3">
              <Button
                onClick={() => handleVideoSelect(video)}
                variant="secondary"
                block
              >
                {video.deviceLocation} - {convertTimestamp(video.timeSent)}
              </Button>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default SecurityFootageComponent;
