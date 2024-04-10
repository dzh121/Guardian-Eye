import React, { useState, useEffect } from "react";
// import { Card, Button } from "react-bootstrap";
import { getAuth } from "firebase/auth";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
  Button,
} from "@nextui-org/react";
// Define types for props and state
type VideoComponentProps = {
  videoFilename: {
    deviceLocation: string;
    timeSent: { _seconds: number };
    fileName: string; // Assuming this is the structure based on usage
  };
  onGoBack: () => void;
};

type VideoDetails = {
  location: string;
  timestamp: { _seconds: number } | "";
};

const VideoComponent: React.FC<VideoComponentProps> = ({
  videoFilename,
  onGoBack,
}) => {
  const [videoStream, setVideoStream] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails>({
    location: "",
    timestamp: "",
  });
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    const handleThemeChange = () => {
      const isDarkTheme = document.body.classList.contains("dark");
      setTheme(isDarkTheme ? "dark" : "light");
    };

    handleThemeChange();

    window.addEventListener("themeChange", handleThemeChange);

    let videoObjectUrl: string | null = null;

    const fetchUserToken = async () => {
      const user = getAuth().currentUser;
      if (user) {
        console.log("User is signed in, fetching token...");
        window.removeEventListener("themeChange", handleThemeChange);
        return await user.getIdToken();
      } else {
        console.log("No user is signed in");
        window.removeEventListener("themeChange", handleThemeChange);
        return null;
      }
    };

    const fetchVideoStream = async (idToken: string, filename: string) => {
      console.log("Fetching video stream for:", filename);
      const response = await fetch(`/video/${filename}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/ json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const blob = await response.blob();
      videoObjectUrl = URL.createObjectURL(blob);
      setVideoStream(videoObjectUrl);
    };

    const fetchIdAndSetVideo = async () => {
      const idToken = await fetchUserToken();
      if (idToken) {
        setVideoDetails({
          location: videoFilename.deviceLocation,
          timestamp: videoFilename.timeSent,
        });
        await fetchVideoStream(idToken, videoFilename.fileName);
      }
    };

    fetchIdAndSetVideo();

    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, [videoFilename]);

  const convertFirestoreTimestampToDate = (
    timestamp: { _seconds: number } | ""
  ): string => {
    if (timestamp && typeof timestamp !== "string") {
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

  return (
    <Card
      style={{
        marginBottom: "120px",
      }}
    >
      <CardHeader className="flex gap-3 text-center">
        <h1 className="font-bold text-large">Uploaded Video</h1>
      </CardHeader>
      <Divider />
      <CardBody
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {videoDetails.location && (
          <p>
            <b>Location:</b> {videoDetails.location}
          </p>
        )}
        {videoDetails.timestamp && (
          <p>
            <b>Time Sent:</b>{" "}
            {convertFirestoreTimestampToDate(videoDetails.timestamp)}
          </p>
        )}
        <Divider />
        <video key={videoStream} width="88%" height="auto" controls>
          {videoStream ? (
            <source src={videoStream} type="video/mp4" />
          ) : (
            "Loading video..."
          )}
        </video>
        <Divider />
        <Button
          onClick={onGoBack}
          style={{ marginTop: "10px" }}
          color="primary"
        >
          Go Back
        </Button>
      </CardBody>
    </Card>
  );
};

export default VideoComponent;
