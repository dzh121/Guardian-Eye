// VideoComponent.js
import React from "react";
import { Card } from "react-bootstrap";

const VideoComponent = () => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Live Camera Feed</Card.Title>
        {/* Placeholder video; replace src with your live feed */}
        <video
          width="100%"
          height="auto"
          controls
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        ></video>
      </Card.Body>
    </Card>
  );
};

export default VideoComponent;
