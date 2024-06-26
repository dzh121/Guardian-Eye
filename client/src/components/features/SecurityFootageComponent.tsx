import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import VideoComponent from "./VideoComponent";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Image,
  CircularProgress,
  Button,
  Pagination,
} from "@nextui-org/react";
import { useWindowSize } from "../../utils/useWindowSize";

type Video = {
  deviceID: string;
  deviceLocation: string;
  timeSent: { _seconds: number };
  eventID: string;
  imageSrc?: string;
};

const SecurityFootageComponent: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [fetchingClips, setFetchingClips] = useState<boolean>(true);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Pagination
  const windowSize = useWindowSize();
  const [itemsPerPage, setItemsPerPage] = useState(windowSize.isLarge ? 8 : 4);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const user = getAuth().currentUser;

  const fetchImageForVideo = async (video: Video, idToken: string) => {
    const response = await fetch(`/image?eventID=${video.eventID}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      return "";
    }
  };

  useEffect(() => {
    const fetchVideosAndImages = async () => {
      const idToken = user ? await user.getIdToken() : null;
      if (!idToken) {
        console.error("User not logged in.");
        setFetchingClips(false);
        return;
      }
      const response = await fetch("/videos", {
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
          return null;
        }
        const imageSrc = await fetchImageForVideo(video, idToken);
        return { ...video, imageSrc };
      });

      const videosWithImages = (await Promise.all(videoPromises)).filter(
        (video) => video !== null
      );
      setVideos(videosWithImages);
      setTotalPages(Math.ceil(videosWithImages.length / itemsPerPage));
      setFetchingClips(false);
    };

    fetchVideosAndImages();
  }, [itemsPerPage]);

  const handleRemoveClip = async (video: Video) => {
    if (deletingVideoId) return;
    setDeletingVideoId(video.eventID);
    try {
      const idToken = user ? await user.getIdToken() : null;
      if (!idToken) {
        console.error("User not logged in.");
        setDeletingVideoId(null);
        return;
      }
      const response = await fetch(`/clips/${video.eventID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete the video.");
      }
      setVideos((prevVideos) =>
        prevVideos.filter((v) => v.eventID !== video.eventID)
      );
    } catch (error) {
      console.error("Error deleting video:", error);
    } finally {
      setDeletingVideoId(null);
    }
  };
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

  const currentItems = videos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
  if (!videos.length) {
    return <p className="text-center">No clips found</p>;
  }
  return (
    <>
      <h2 className="text-center text-2xl font-bold mb-4">Security Footage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {currentItems.map((video, index) => (
          <Card
            key={index}
            className="flex flex-col justify-between"
            style={{ width: "95%" }}
          >
            <CardHeader
              className="flex justify-center p-2"
              style={{ height: "360px" }}
            >
              {video.imageSrc ? (
                <Image
                  src={video.imageSrc}
                  className="object-cover rounded-lg opacity-100"
                  width="100%"
                  height="100%"
                  alt="Image Preview"
                />
              ) : (
                <Image
                  src="no-image-available.png"
                  className="object-cover rounded-lg opacity-100"
                  width="80%"
                  height="80%"
                  alt="No Image Available"
                />
              )}
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col items-center justify-center text-center p-2 gap-2">
              <h1 className="text-base font-bold">{video.deviceLocation}</h1>
              <p className="text-base">{convertTimestamp(video.timeSent)}</p>
              <p className="text-base">ID: {video.deviceID}</p>
            </CardBody>
            <Divider />
            <CardFooter className="flex items-center justify-center p-2 gap-2">
              <Button
                onClick={() => handleVideoSelect(video)}
                color="primary"
                variant="solid"
                size="md"
              >
                View Details
              </Button>
              <Button
                onClick={() => handleRemoveClip(video)}
                color="danger"
                variant="solid"
                size="md"
                disabled={deletingVideoId === video.eventID}
              >
                {deletingVideoId === video.eventID ? "Deleting..." : "Delete"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="w-full flex justify-center p-4">
          <Pagination
            showControls
            total={totalPages}
            initialPage={1}
            page={currentPage}
            onChange={(page) => setCurrentPage(page)}
            size="lg"
            loop
            showShadow
          />
        </div>
      ) : null}
    </>
  );
};

export default SecurityFootageComponent;
