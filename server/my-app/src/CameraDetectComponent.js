import React from "react";
import VideoComponent from "./VideoComponent";

const CameraDetectComponent = () => {
  return (
    <div>
      <h2>Camera Detect</h2>
      {/* 
        Ensure that "output_1709914507.mp4" is a valid filename in the ./uploads directory 
        on the server and that the server is configured to serve files from that directory.
      */}
      <VideoComponent videoFilename={"output_1709914507.wmv"} />
    </div>
  );
};

export default CameraDetectComponent;
