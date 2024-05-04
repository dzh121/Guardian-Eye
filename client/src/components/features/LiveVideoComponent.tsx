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
  Pagination,
} from "@nextui-org/react";
import { db } from "../../utils/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useWindowSize } from "../../utils/useWindowSize";

type Device = {
  id: string;
  location: string;
  url: string;
};

const LiveVideoComponent: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isCameraOnline, setIsCameraOnline] = useState<boolean>(true);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(
    moment().format("DD/MM/YYYY, HH:mm:ss")
  );
  const [devices, setDevices] = useState<Device[]>([]);

  const windowSize = useWindowSize();
  const [itemsPerPage, setItemsPerPage] = useState(windowSize.isLarge ? 8 : 4);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
          setTotalPages(Math.ceil(devicesData.length / itemsPerPage));
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
  }, [itemsPerPage]);
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
    checkCameraStatusAndSetUrl();
  }, [selectedDevice]);

  // Handling device selection
  const handleDeviceSelection = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleGoBack = () => {
    setSelectedDevice(null);
    setStreamUrl("");
    setIsCameraOnline(true);
  };

  // Pagination
  const currentItems = devices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="lg" label="Loading..." />
      </div>
    );
  }

  if (!devices.length) {
    return <p className="text-center">No cameras found</p>;
  }

  return (
    <div>
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
        <div className="flex flex-col h-full w-full">
          <div className="flex-grow">
            <h2 className="text-center text-2xl font-bold my-4">
              Live Video Feed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 px-4 mb-4">
              {currentItems.map((device, index) => (
                <Card
                  key={index}
                  className="flex flex-col justify-between rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader className="justify-center text-xl font-bold p-4 rounded-t-lg">
                    {device.id}
                  </CardHeader>
                  <Divider />
                  <CardBody className="flex flex-col items-center justify-center text-center p-4">
                    <h1 className="text-lg font-semibold">{device.location}</h1>
                  </CardBody>
                  <Divider />
                  <CardFooter className="flex items-center justify-center p-4 rounded-b-lg">
                    <Button
                      onClick={() => handleDeviceSelection(device)}
                      color="primary"
                      variant="solid"
                      size="lg"
                    >
                      Show Live Feed
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
          <div className="w-full flex justify-center pb-4">
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
        </div>
      )}
    </div>
  );
};

export default LiveVideoComponent;
