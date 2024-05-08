import React, { useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  Spacer,
  CardBody,
  Link,
  Tabs,
  Tab,
  CardHeader,
} from "@nextui-org/react";
import { EyeFilledIcon } from "../../utils/icons/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../utils/icons/EyeSlashFilledIcon";

interface MessageProps {
  message: string;
  type: "error" | "success";
}

const LoginOrRegisterComponent: React.FC = () => {
  const [selected, setSelected] = useState<string | number>("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [resetPassword, setResetPassword] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error: any) {
      setError("Failed to log in. Please check your email and password.");
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        notifications: true,
        recognizeFaces: true,
        theme: "light",
      });
      navigate("/home");
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError("");
      setResetPassword(true);
    } catch (error: any) {
      setError("Failed to send password reset email.");
    }
  };
  const handleTabChange = (key: string | number) => {
    setSelected(key);
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setResetPassword(false);
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
          <h2 className="text-center text-2xl font-bold">
            {selected === "login" ? "Login" : "Register"}
          </h2>
        </CardHeader>
        <CardBody className="overflow-hidden">
          <Tabs
            fullWidth
            size="lg"
            aria-label="Tabs form"
            selectedKey={selected}
            onSelectionChange={handleTabChange}
          >
            <Tab key="login" title="Login">
              <Spacer y={2.5} />
              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                {error && <Message message={error} type="error" />}
                {resetPassword && (
                  <Message
                    message="Check your email for password reset instructions."
                    type="success"
                  />
                )}
                <Input
                  isRequired
                  variant="bordered"
                  label="Email address"
                  labelPlacement="outside"
                  size="lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <Spacer y={1.5} />
                <Input
                  isRequired
                  variant="bordered"
                  label="Password"
                  labelPlacement="outside"
                  size="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  fullWidth
                />
                <Spacer y={2.5} />
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button type="submit" size="lg" color="primary">
                    Login
                  </Button>
                </div>
                <Spacer y={2.5} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                  }}
                >
                  <Link showAnchorIcon href="#" onClick={handleForgotPassword}>
                    Forgot Password?
                  </Link>
                  <Spacer y={1} />
                  <Link
                    showAnchorIcon
                    href="#"
                    onClick={() => handleTabChange("register")}
                  >
                    Don't have an account? Register
                  </Link>
                </div>
              </form>
            </Tab>
            <Tab key="register" title="Register">
              <Spacer y={2.5} />
              <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                {error && <Message message={error} type="error" />}
                <Input
                  isRequired
                  variant="bordered"
                  label="Name"
                  labelPlacement="outside"
                  size="lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
                <Spacer y={1.5} />
                <Input
                  isRequired
                  variant="bordered"
                  label="Email address"
                  labelPlacement="outside"
                  autoComplete="off"
                  size="lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <Spacer y={1.5} />
                <Input
                  isRequired
                  label="Password"
                  variant="bordered"
                  labelPlacement="outside"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  placeholder="Enter Password"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  fullWidth
                />
                <Spacer y={2.5} />
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button type="submit" size="lg" color="primary">
                    Register
                  </Button>
                </div>
                <Spacer y={2.5} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                  }}
                >
                  <Link
                    showAnchorIcon
                    href="#"
                    onClick={() => handleTabChange("login")}
                  >
                    Already have an account? Login
                  </Link>
                </div>
              </form>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginOrRegisterComponent;
