import React from "react";

const LiveVideoComponent = () => {
  const streamUrl = "http://localhost:8081";

  return (
    <div className="video-container">
      <h2>Live Video Feed</h2>
      <iframe
        src={streamUrl}
        className="video-frame"
        title="Live Video Feed"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default LiveVideoComponent;
