import React, { useState, useEffect } from "react";

const LiveVideoComponent = () => {
  const streamUrl = "http://localhost:8081";
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStreamUrl = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(streamUrl, { mode: "no-cors" });
        if (response.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStreamUrl();
  }, []);

  return (
    <div className="video-container">
      <h2>Live Video Feed</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : isOnline ? (
        <iframe
          src={streamUrl}
          className="video-frame"
          title="Live Video Feed"
          allowFullScreen
        ></iframe>
      ) : (
        <p>Camera is not online</p>
      )}
    </div>
  );
};

export default LiveVideoComponent;
