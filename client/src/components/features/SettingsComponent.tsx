import React, { useState, useEffect } from "react";
import {
  Input,
  Switch,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Spacer,
} from "@nextui-org/react";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../utils/firebase";
import { getAuth } from "firebase/auth";
import { EyeFilledIcon } from "../../utils/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../utils/EyeSlashFilledIcon";
import { collection, getDocs, query, deleteDoc } from "firebase/firestore";

type Camera = {
  id: string;
  docId: string;
  location: string;
};
interface MessageProps {
  message: string;
  type: "error" | "success";
}
const SettingsComponent: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [notifications, setNotifications] = useState<boolean>(true);
  const [recognizeFaces, setRecognizeFaces] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>("light");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isVisibleNew, setIsVisibleNew] = useState<boolean>(false);
  const [isVisibleOld, setIsVisibleOld] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | number>("profile");

  const toggleVisibilityNew = () => setIsVisibleNew(!isVisibleNew);
  const toggleVisibilityOld = () => setIsVisibleOld(!isVisibleOld);

  const user = auth.currentUser;
  const userRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    if (user) {
      if (userRef) {
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Set the states with fetched data or default values
            setEmail(userData.email || "");
            setName(userData.name || "");
            setNotifications(
              userData.notifications !== undefined
                ? userData.notifications
                : false
            );
            console.log(userData.theme);
            console.log(userData.theme || "light");
            setTheme(userData.theme || "light");
            setRecognizeFaces(
              userData.recognizeFaces !== undefined
                ? userData.recognizeFaces
                : false
            );
          }
        });
      }
    }
    const fetchCameras = async () => {
      // Replace this with your API call or Firebase call to fetch cameras
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const uid = currentUser.uid;
        const devicesQuery = query(collection(db, "cameras", uid, "devices"));
        const querySnapshot = await getDocs(devicesQuery);
        const devicesData = querySnapshot.docs.map((doc) => ({
          id: doc.data().deviceId,
          docId: doc.id,
          location: doc.data().location,
        }));

        setCameras(devicesData);
      } else {
        console.log("User not logged in");
      }
    };

    fetchCameras();
  }, []);

  const handleRemoveCamera = async (docId: string) => {
    try {
      const user = getAuth().currentUser;
      if (user) {
        const cameraRef = doc(db, "cameras", user.uid, "devices", docId);
        await deleteDoc(cameraRef);
        setCameras(cameras.filter((c) => c.docId !== docId));
        setSuccess("Camera removed successfully!");
      } else {
        setError("User not logged in");
      }
    } catch (error: any) {
      console.error("Error removing camera:", error);
      setError("Failed to remove camera: " + error.message);
    }
  };

  // const handleChange =
  //   (setState: React.Dispatch<React.SetStateAction<string>>) =>
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setState(event.target.value);
  //     setSuccess("");
  //   };
  const handleChange =
    <T extends string | boolean>(
      setState: React.Dispatch<React.SetStateAction<T>>
    ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setState(value as T);
      setSuccess("");
    };

  const handleEmailChange = handleChange<string>(setEmail);
  const handlePasswordChange = handleChange<string>(setPassword);
  const handleCurrentPasswordChange = handleChange<string>(setCurrentPassword);
  const handleNameChange = handleChange<string>(setName);

  const handleNotifications = handleChange<boolean>(setNotifications);
  const handleRecognizeFaces = handleChange<boolean>(setRecognizeFaces);

  const handleThemeChange = (newTheme: boolean) => {
    setTheme(newTheme ? "dark" : "light");
    if (newTheme) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const handleTabChange = (key: string | number) => {
    setSelected(key);
    setError("");
    setSuccess("");
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("No user logged in.");
      return;
    }

    if (!userRef) {
      setError("User not found");
      return;
    }
    try {
      // Update user's email
      await updateEmail(user, email);

      // Update other user details in the database document
      await updateDoc(userRef, {
        email,
        name,
      });

      // Set success message and clear any previous errors
      setSuccess("Settings updated successfully!");
      setError(""); // Clearing any previous error messages
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setError(error.message || "An error occurred");
      setSuccess(""); // Clearing any previous success messages if the update fails
    }
  };
  const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("No user logged in.");
      return;
    }

    if (!userRef) {
      setError("User not found");
      return;
    }
    try {
      // Re-authenticate user before updating email and password
      if (currentPassword && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      // Update user's password
      if (password && password !== currentPassword) {
        await updatePassword(user, password);
      }

      // Set success message and clear any previous errors
      setSuccess("Settings updated successfully!");
      setError(""); // Clearing any previous error messages
      setPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setError(error.message || "An error occurred");
      setSuccess(""); // Clearing any previous success messages if the update fails
    }
  };
  const handlePreferencesSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!user) {
      setError("No user logged in.");
      return;
    }

    if (!userRef) {
      setError("User not found");
      return;
    }
    try {
      // Update user preferences in the database document
      await updateDoc(userRef, {
        notifications,
        recognizeFaces,
        theme,
      });

      // Set success message and clear any previous errors
      setSuccess("Settings updated successfully!");
      setError(""); // Clearing any previous error messages
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setError(error.message || "An error occurred");
      setSuccess(""); // Clearing any previous success messages if the update fails
    }
  };
  // Ensure user is not null before rendering the form
  if (!user) {
    return <p>Loading user data...</p>;
  }

  const inputStyle = {
    fontSize: "1.2em",
  };
  const Message: React.FC<MessageProps> = ({ message, type }) => (
    <div
      style={{
        backgroundColor: type === "error" ? "#ff4d4f" : "#52c41a",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        textAlign: "center",
        marginBottom: "10px",
      }}
    >
      {message}
    </div>
  );
  return (
    <div className="flex justify-center items-center mt-10">
      <Card className="max-w-full w-[420px] min-h-[500px]">
        <CardHeader className="text-center">
          {/* Titles */}
          <h2 className="text-2xl font-bold">
            {selected === "profile" && "Profile"}
            {selected === "security" && "Security"}
            {selected === "preferences" && "Preferences"}
            {selected === "devices" && "Devices"}
          </h2>
        </CardHeader>
        <CardBody>
          {/* Error and success messages */}
          {error && <Message message={error} type="error" />}
          {success && <Message message={success} type="success" />}

          {/* Tabs */}
          <Tabs
            fullWidth
            size="lg"
            aria-label="Tabs form"
            selectedKey={selected}
            onSelectionChange={handleTabChange}
          >
            <Tab key="profile" title="Profile">
              <Spacer y={2.5} />
              <form
                onSubmit={handleProfileSubmit}
                className="flex flex-col items-center w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4"
              >
                {/* Name Input */}
                <Input
                  isRequired
                  variant="bordered"
                  type="string"
                  size="lg"
                  label="Name"
                  value={name}
                  labelPlacement="outside"
                  placeholder="Enter your name"
                  className="max-w-xs"
                  onChange={handleNameChange}
                  style={inputStyle}
                />

                {/* Email Input */}
                <Input
                  isRequired
                  size="lg"
                  variant="bordered"
                  type="email"
                  label="Email"
                  value={email}
                  labelPlacement="outside"
                  placeholder="Enter your email"
                  className="max-w-xs"
                  onChange={handleEmailChange}
                  style={inputStyle}
                />
                <Button type="submit" className="mt-3" style={inputStyle}>
                  Save Changes
                </Button>
              </form>
            </Tab>
            <Tab key="security" title="Security">
              <Spacer y={2.5} />
              <form
                onSubmit={handleSecuritySubmit}
                className="flex flex-col items-center w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4"
              >
                {/* Current Password Inputs */}
                <Input
                  isRequired
                  size="lg"
                  label="Current Password"
                  variant="bordered"
                  labelPlacement="outside"
                  value={currentPassword}
                  autoComplete="off"
                  onChange={handleCurrentPasswordChange}
                  placeholder="Enter your Current Password"
                  style={inputStyle}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibilityOld}
                    >
                      {isVisibleOld ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisibleOld ? "text" : "password"}
                  className="max-w-xs"
                />

                {/* New Password Inputs */}
                <Input
                  isRequired
                  size="lg"
                  label="New Password"
                  variant="bordered"
                  labelPlacement="outside"
                  value={password}
                  autoComplete="off"
                  onChange={handlePasswordChange}
                  placeholder="Enter your New Password"
                  style={inputStyle}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibilityNew}
                    >
                      {isVisibleNew ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisibleNew ? "text" : "password"}
                  className="max-w-xs"
                />
                <Button type="submit" className="mt-3" style={inputStyle}>
                  Save Changes
                </Button>
              </form>
            </Tab>
            <Tab key="preferences" title="Preferences">
              <Spacer y={2.5} />
              <form
                onSubmit={handlePreferencesSubmit}
                className="flex flex-col items-center w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4"
              >
                {/* Theme Switch */}
                <Switch
                  size="lg"
                  isSelected={theme === "dark"}
                  style={inputStyle}
                  onChange={(e) => handleThemeChange(e.target.checked)}
                >
                  Dark Mode
                </Switch>

                {/* Recognize Faces Input  */}
                <Switch
                  size="lg"
                  isSelected={recognizeFaces}
                  style={inputStyle}
                  onChange={handleRecognizeFaces}
                >
                  Recognize Faces
                </Switch>

                {/* Notifications Input */}
                <Switch
                  size="lg"
                  isSelected={notifications}
                  style={inputStyle}
                  onChange={handleNotifications}
                >
                  Notifications
                </Switch>
                <Button type="submit" className="mt-3" style={inputStyle}>
                  Save Changes
                </Button>
              </form>
            </Tab>
            <Tab key="devices" title="Devices">
              <Spacer y={2.5} />
              <h3 className="text-xl mt-4 mb-3">Connected Cameras</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                  justifyContent: "center",
                  maxWidth: "420px",
                }}
              >
                {cameras.length > 0 ? (
                  cameras.map((camera) => (
                    <div
                      key={camera.id}
                      style={{ width: "calc(50% - 10px)", maxWidth: "100%" }}
                    >
                      <Card>
                        <CardBody>
                          <b>
                            {camera.id} - {camera.location}
                          </b>
                          <Button
                            size="sm"
                            color="danger"
                            className="mt-4"
                            onClick={() => handleRemoveCamera(camera.docId)}
                          >
                            Remove
                          </Button>
                        </CardBody>
                      </Card>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-red-500">
                    No cameras connected
                  </p>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default SettingsComponent;
