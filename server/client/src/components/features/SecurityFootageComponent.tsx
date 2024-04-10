import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import VideoComponent from "./VideoComponent";
import { Button } from "@nextui-org/react";

type Video = {
  deviceLocation: string;
  timeSent: { _seconds: number };
  fileName: string;
};

const SecurityFootageComponent: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [fetchingClips, setFetchingClips] = useState<boolean>(true);

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
        setFetchingClips(false);
      } catch (error) {
        console.error("Error fetching videos: ", error);
        setFetchingClips(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleGoBack = () => {
    setSelectedVideo(null);
  };

  const convertTimestamp = (timestamp: { _seconds: number }): string => {
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
        <VideoComponent videoFilename={selectedVideo} onGoBack={handleGoBack} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center mb-4">Security Footage</h2>
      {videos.length === 0 ? (
        <p className="text-center">No clips found</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {videos.map((video, index) => (
            <Button
              key={index}
              onClick={() => handleVideoSelect(video)}
              color="secondary"
            >
              {video.deviceLocation} - {convertTimestamp(video.timeSent)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityFootageComponent;
