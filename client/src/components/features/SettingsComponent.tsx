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
  Pagination,
  CircularProgress,
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
import { EyeFilledIcon } from "../../utils/icons/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../utils/icons/EyeSlashFilledIcon";
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
  const itemsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const toggleVisibilityNew = () => setIsVisibleNew(!isVisibleNew);
  const toggleVisibilityOld = () => setIsVisibleOld(!isVisibleOld);

  const user = auth.currentUser;
  const userRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        if (!userRef) {
          setError("User not found");
          return;
        }
        const userData = await getDoc(userRef);
        if (userData.exists()) {
          const data = userData.data();
          setEmail(data.email || "");
          setName(data.name || "");
          setNotifications(
            data.notifications !== undefined ? data.notifications : false
          );
          setTheme(data.theme || "light");
          setRecognizeFaces(
            data.recognizeFaces !== undefined ? data.recognizeFaces : false
          );
        }

        // Fetch cameras associated with the user
        const camerasData = await getDocs(
          query(collection(db, "cameras", user.uid, "devices"))
        );
        const fetchedCameras = camerasData.docs.map((doc) => ({
          id: doc.data().deviceId,
          docId: doc.id,
          location: doc.data().location,
        }));
        setCameras(fetchedCameras);
        setTotalPages(Math.ceil(fetchedCameras.length / itemsPerPage));
      } else {
        console.log("User not logged in");
      }
    };
    fetchData();
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

  const handleChange =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setter(value as T);
      setSuccess("");
    };

  const handleEmailChange = handleChange<string>(setEmail);
  const handlePasswordChange = handleChange<string>(setPassword);
  const handleCurrentPasswordChange = handleChange<string>(setCurrentPassword);
  const handleNameChange = handleChange<string>(setName);
  const handleNotificationsChange = handleChange<boolean>(setNotifications);
  const handleRecognizeFacesChange = handleChange<boolean>(setRecognizeFaces);

  const handleThemeChange = (newTheme: boolean) => {
    setTheme(newTheme ? "dark" : "light");
    document.body.classList.toggle("dark", newTheme);
  };

  const handleTabChange = (key: string | number) => {
    setSelected(key);
    setError("");
    setSuccess("");
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userRef) {
      setError("User not logged in or not found.");
      return;
    }

    try {
      await updateEmail(user, email);
      await updateDoc(userRef, { email, name });
      setSuccess("Settings updated successfully!");
      setError("");
    } catch (error: any) {
      console.error("Error updating profile settings:", error);
      setError(error.message);
    }
  };
  const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userRef) {
      setError("User not logged in or not found.");
      return;
    }

    try {
      if (currentPassword && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }
      if (password && password !== currentPassword) {
        await updatePassword(user, password);
        setPassword(""); // Reset password field
        setCurrentPassword(""); // Reset current password field
      }
      setError("");
      setSuccess("Security settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating security settings:", error);
      setError(error.message);
    }
  };
  const handlePreferencesSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!user || !userRef) {
      setError("User not logged in or not found.");
      return;
    }

    try {
      await updateDoc(userRef, { notifications, recognizeFaces, theme });
      setSuccess("Preferences updated successfully!");
      setError("");
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      setError(error.message);
    }
  };

  // Pagination
  const currentItems = cameras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Ensure user is not null before rendering the form
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="lg" label="Loading user data..." />
      </div>
    );
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
                  onChange={handleRecognizeFacesChange}
                >
                  Recognize Faces
                </Switch>

                {/* Notifications Input */}
                <Switch
                  size="lg"
                  isSelected={notifications}
                  style={inputStyle}
                  onChange={handleNotificationsChange}
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
              <div className="flex flex-col justify-center">
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
                    currentItems.map((camera) => (
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
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default SettingsComponent;
