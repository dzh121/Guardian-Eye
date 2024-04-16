import React, { useState, FormEvent } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  CardHeader,
  Link,
  CardBody,
  Spacer,
} from "@nextui-org/react";
import { EyeFilledIcon } from "../../utils/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../utils/EyeSlashFilledIcon";

interface MessageProps {
  message: string;
  type: "error" | "success";
}
interface LoginComponentProps {
  onLogin: (status: boolean) => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [resetPassword, setResetPassword] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    setResetPassword(false); // Reset password state
    setError(""); // Clear any existing errors

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Logged in successfully
        console.log("Logged in user:", userCredential.user);
      })
      .catch((error) => {
        setError("Failed to log in. Please check your email and password.");
      });
  };

  const handleForgotPassword = () => {
    setResetPassword(false);
    setError(""); // Clear any existing errors
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setError("");
        setResetPassword(true);
      })
      .catch((error) => {
        setError("Failed to send password reset email.");
      });
  };
  const navigateToRegister = () => {
    navigate("/register");
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Card style={{ width: "90%", maxWidth: "500px" }}>
        <CardHeader style={{ display: "flex", justifyContent: "center" }}>
          <h3 className="font-bold text-large">Login</h3>
        </CardHeader>
        <CardBody>
          {error && <Message message={error} type="error" />}
          {resetPassword && (
            <Message
              message="Check your email for password reset instructions."
              type="success"
            />
          )}
          <form onSubmit={handleLogin}>
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
              <Link showAnchorIcon href="#" onClick={navigateToRegister}>
                Don't have an account? Register
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginComponent;
