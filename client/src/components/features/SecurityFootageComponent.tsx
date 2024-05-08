import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import VideoComponent from "./VideoComponent";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Skeleton,
  Image,
  CircularProgress,
  Button,
} from "@nextui-org/react";

type Video = {
  deviceID: string;
  deviceLocation: string;
  timeSent: { _seconds: number };
  fileName: string;
  eventID: string;
  imageSrc?: string;
};

const SecurityFootageComponent: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [fetchingClips, setFetchingClips] = useState<boolean>(true);

  // useEffect(() => {
  //   const fetchUserToken = async () => {
  //     const user = getAuth().currentUser;
  //     return user ? await user.getIdToken() : null;
  //   };

  //   const fetchVideos = async () => {
  //     try {
  //       const idToken = await fetchUserToken();
  //       const response = await fetch("http://localhost:3000/videos", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${idToken}`,
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error("Network response was not ok.");
  //       }

  //       const data = await response.json();

  //       setVideos(data.videos);
  //       console.log(data.videos);
  //       setFetchingClips(false);
  //     } catch (error) {
  //       console.error("Error fetching videos: ", error);
  //       setFetchingClips(false);
  //     }
  //   };

  //   fetchVideos();
  // }, []);

  const fetchImageForVideo = async (video: Video, idToken: string) => {
    console.log("Fetching image for video with eventID:", video.eventID);
    const response = await fetch(
      `http://localhost:3000/image?eventID=${video.eventID}`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      console.error(
        "Failed to fetch image for video with eventID:",
        video.eventID
      );
      return "";
    }
  };

  useEffect(() => {
    const fetchVideosAndImages = async () => {
      const user = getAuth().currentUser;
      const idToken = user ? await user.getIdToken() : null;
      if (!idToken) {
        console.error("User not logged in.");
        setFetchingClips(false);
        return;
      }
      const response = await fetch("http://localhost:3000/videos", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      const videoPromises = data.videos.map(async (video: Video) => {
        if (!video.eventID) {
          return video;
        }
        const imageSrc = await fetchImageForVideo(video, idToken);
        return { ...video, imageSrc };
      });

      Promise.all(videoPromises).then(setVideos);
      setFetchingClips(false);
    };

    fetchVideosAndImages();
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="lg" label="Fetching clips..." />
      </div>
    );
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
      <h2 className="text-center text-2xl font-bold mb-4">Security Footage</h2>
      {videos.length === 0 ? (
        <p className="text-center">No clips found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map((video, index) => (
            <Card
              key={index}
              className="flex flex-col justify-between"
              style={{ width: "95%" }}
            >
              <CardHeader className="flex justify-center p-2">
                {video.eventID ? (
                  <Image
                    src={video.imageSrc}
                    className="object-cover rounded-lg opacity-100"
                    width="100%"
                    height="100%"
                    alt="Live Feed"
                  />
                ) : (
                  <Skeleton className="rounded-lg">
                    <img
                      src="live-feed.png"
                      className="object-cover rounded-lg opacity-100"
                      width="100%"
                      height={140}
                      alt="Live Feed"
                    />
                  </Skeleton>
                )}
              </CardHeader>
              <Divider />
              <CardBody className="flex flex-col items-center justify-center text-center p-2">
                <h1 className="text-sm font-bold">{video.deviceLocation}</h1>
                <p className="text-xs">{convertTimestamp(video.timeSent)}</p>
                <p className="text-xs">ID: {video.deviceID}</p>
              </CardBody>
              <Divider />
              <CardFooter className="flex items-center justify-center p-2">
                <Button
                  onClick={() => handleVideoSelect(video)}
                  color="primary"
                  variant="solid"
                  size="sm"
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityFootageComponent;
