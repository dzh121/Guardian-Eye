import React from "react";
import VideoComponent from "./VideoComponent";

const CameraDetectComponent = () => {
  return (
    <div className="video-wrapper">
      <h2>Camera Detect</h2>
      {/*<VideoComponent videoFilename={"output_1710000208.mp4"} /*/}
      <VideoComponent />
    </div>
  );
};

export default CameraDetectComponent;
