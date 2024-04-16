import React from "react";
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

const HomeComponent: React.FC = () => {
  return (
    <div className="home-component">
      <h2 className="text-center home-title">
        Welcome to Your Surveillance System
      </h2>

      <div className="d-flex flex-wrap justify-content-center">
        {/* Dashboard Card for Live Feed */}
        <Card
          className="max-w-[330px]"
          style={{
            margin: "10px",
          }}
        >
          <CardHeader className="flex gap-3">
            <Image
              src="live-feed.png"
              className="object-cover rounded-xl opacity-100"
              radius="sm"
              width="100%"
              height={140}
              alt="Live Feed"
            />
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-large">Live Camera Feed</h4>
            <p>Watch real-time video from your cameras</p>
          </CardBody>
          <Divider />
          <CardFooter className="flex items-center justify-center">
            <Button
              href="/LiveFeed"
              as={Link}
              color="primary"
              showAnchorIcon
              variant="solid"
            >
              Go to Live Feed
            </Button>
          </CardFooter>
        </Card>
        {/* Dashboard Card for Camera Detection */}
        <Card
          className="max-w-[330px]"
          style={{
            margin: "10px",
          }}
        >
          <CardHeader className="flex gap-3">
            <Image
              src="security-footage.png"
              className="object-cover rounded-xl opacity-100"
              radius="sm"
              width="100%"
              height={140}
              alt="Security footage"
            />
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-large">Security Footage Clips</h4>
            <p>Review the recordings triggered by camera detection</p>
          </CardBody>
          <Divider />
          <CardFooter className="flex items-center justify-center">
            <Button
              href="/SecurityFootage"
              as={Link}
              color="primary"
              showAnchorIcon
              variant="solid"
            >
              View Clips
            </Button>
          </CardFooter>
        </Card>

        {/* Dashboard Card for familiar faces */}
        <Card
          className="max-w-[330px]"
          style={{
            margin: "10px",
          }}
        >
          <CardHeader className="flex gap-3">
            <Image
              src="familiar-faces.png"
              className="object-cover rounded-xl opacity-100"
              radius="sm"
              width="100%"
              height={140}
              alt="familiar faces"
            />
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-large">Familiar Faces</h4>
            <p>Explore and Manage Your Familiar Faces List</p>
          </CardBody>
          <Divider />
          <CardFooter className="flex items-center justify-center">
            <Button
              href="/familiarFaces"
              as={Link}
              color="primary"
              showAnchorIcon
              variant="solid"
            >
              Manage Familiar Faces
            </Button>
          </CardFooter>
        </Card>

        {/* Dashboard Card for Settings */}
        <Card
          className="max-w-[330px]"
          style={{
            margin: "10px",
          }}
        >
          <CardHeader className="flex gap-3">
            <Image
              src="settings.png"
              className="object-cover rounded-xl opacity-100"
              radius="sm"
              width="100%"
              height={140}
              alt="Settings"
            />
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-large">Settings</h4>
            <p>Adjust your system settings and preferences</p>
          </CardBody>
          <Divider />
          <CardFooter className="flex items-center justify-center">
            <Button
              href="/settings"
              as={Link}
              color="primary"
              showAnchorIcon
              variant="solid"
            >
              Go to Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default HomeComponent;
