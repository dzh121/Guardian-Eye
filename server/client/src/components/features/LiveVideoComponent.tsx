import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
// import { Button, Container, Row, Col, Alert } from "react-bootstrap";
import moment from "moment";
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

type Device = {
  id: string;
  location: string;
  url: string;
};

const LiveVideoComponent: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isCameraOnline, setIsCameraOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(
    moment().format("DD/MM/YYYY, HH:mm:ss")
  );

  // Update currentTime every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(moment().format("DD/MM/YYYY, HH:mm:ss"));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        const response = await fetch(
          `http://localhost:8080/devices?token=${token}`
        );
        const data = await response.json();
        setDevices(data);
        setIsLoading(false);
      } else {
        console.log("User not logged in");
      }
    };
    fetchDevices();
  }, []);

  // Fetch video URL
  useEffect(() => {
    const checkCameraStatusAndSetUrl = async () => {
      if (selectedDevice) {
        setIsLoading(true);
        try {
          const currentUser = getAuth().currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();

            const deviceUrlWithToken = `${selectedDevice.url}?token=${token}`;

            // Check if the camera server is reachable
            const response = await fetch(deviceUrlWithToken);
            if (response.ok) {
              setVideoUrl(deviceUrlWithToken);
              setIsCameraOnline(true);
            } else {
              throw new Error("Camera server not reachable");
            }
          } else {
            throw new Error("User not logged in");
          }
        } catch (error) {
          console.error("Error checking camera status:", error);
          setIsCameraOnline(false);
        }
        setIsLoading(false);
      }
    };

    checkCameraStatusAndSetUrl();
  }, [selectedDevice]);

  // Handling device selection
  const handleDeviceSelection = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleGoBack = () => {
    setSelectedDevice(null);
    setVideoUrl("");
    setIsCameraOnline(true);
  };

  if (isLoading) {
    return <p className="text-center">Loading...</p>;
  }

  if (devices.length === 0) {
    return <p className="text-center">No cameras found</p>;
  }
  if (selectedDevice) {
    return (
      <Card>
        <CardHeader className="d-flex justify-content-between">
          <p className="font-bold text-large">
            {selectedDevice.id} - {selectedDevice.location}
          </p>
          <p className="font-bold text-large">{currentTime}</p>
        </CardHeader>

        <CardBody>
          {isCameraOnline ? (
            videoUrl && (
              <iframe
                src={videoUrl}
                title="Live Video Feed"
                style={{ width: "100%", height: "500px" }}
                allowFullScreen
              ></iframe>
            )
          ) : (
            <p className="text-center">Camera not online</p>
          )}
        </CardBody>
        <CardFooter>
          <div className="text-center">
            <Button onClick={handleGoBack}>Go Back</Button>
          </div>
          <Divider />
          <p>{currentTime}</p>
        </CardFooter>
      </Card>
    );
  }
  return (
    <div>
      <h2 className="text-center mb-4ont-bold text-large">Live Video Feed</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {devices.map((device, index) => (
          <div key={index} className="w-1/4 p-2">
            <Button
              onClick={() => handleDeviceSelection(device)}
              color="secondary"
              size="md"
            >
              {device.id} - {device.location}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveVideoComponent;
