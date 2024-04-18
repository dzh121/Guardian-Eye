import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import moment from "moment";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Button,
  CircularProgress,
} from "@nextui-org/react";
import { db } from "../../utils/firebase";
import { collection, getDocs, query } from "firebase/firestore";

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
  const [streamUrl, setStreamUrl] = useState<string>("");

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
        const uid = currentUser.uid;
        try {
          const devicesQuery = query(collection(db, "cameras", uid, "devices"));
          const querySnapshot = await getDocs(devicesQuery);
          const devicesData = querySnapshot.docs.map((doc) => ({
            id: doc.data().deviceId,
            location: doc.data().location,
            url: doc.data().videoUrl,
          }));
          setDevices(devicesData);
        } catch (error) {
          console.error("Error fetching devices:", error);
          setDevices([]);
        }
        setIsLoading(false);
      } else {
        console.log("User not logged in");
        setIsLoading(false);
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

            const headers = {
              Authorization: `Bearer ${token}`,
            };

            // Check if the camera server is reachable
            const response = await fetch(selectedDevice.url, { headers });
            if (response.ok) {
              setVideoUrl(selectedDevice.url);
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
  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (selectedDevice) {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          const deviceUrlWithToken = `${selectedDevice.url}?token=${token}`;
          setStreamUrl(deviceUrlWithToken);
        } else {
          console.log("User not logged in");
          setIsCameraOnline(false);
        }
      }
    };

    fetchStreamUrl();
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Loading...</p>
        <CircularProgress size="lg" aria-label="Loading..." />
      </div>
    );
  }

  if (!devices.length) {
    return <p className="text-center">No cameras found</p>;
  }

  return (
    <div className="px-4 py-2">
      {selectedDevice ? (
        <Card className="my-4">
          <CardHeader className="flex justify-between items-center p-4">
            <p className="text-lg font-bold">
              {selectedDevice.location} ({selectedDevice.id})
            </p>
            <p className="text-sm">{currentTime}</p>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center justify-center p-4">
            {isCameraOnline ? (
              <img
                className="max-w-full h-auto"
                src={streamUrl}
                alt="Live Video Feed"
              />
            ) : (
              <p className="text-center text-red-500">Camera not online</p>
            )}
          </CardBody>
          <Divider />
          <CardFooter className="p-4">
            <Button onClick={handleGoBack} color="danger">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <h2 className="text-center text-2xl font-bold my-4">
            Live Video Feed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {devices.map((device, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="text-lg font-bold p-4">
                  {device.location}
                </CardHeader>
                <Divider />
                <CardBody className="p-4">
                  <Button
                    color="primary"
                    size="lg"
                    onClick={() => handleDeviceSelection(device)}
                  >
                    View {device.id}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LiveVideoComponent;
