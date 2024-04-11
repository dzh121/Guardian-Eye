import React, { useState, FormEvent } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  Spacer,
  CardHeader,
  CardBody,
  Link,
} from "@nextui-org/react";
import { EyeFilledIcon } from "../../utils/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../utils/EyeSlashFilledIcon";

interface MessageProps {
  message: string;
  type: "error" | "success";
}

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    const db = getFirestore();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save additional user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        notifications: true,
        recognizeFaces: true,
        theme: "light",
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const navigateToLogin = () => {
    navigate("/login");
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
          <h3 className="font-bold text-large">Register</h3>
        </CardHeader>
        <CardBody>
          {error && <Message message={error} type="error" />}
          <form onSubmit={handleSubmit}>
            <Input
              isRequired
              variant="bordered"
              labelPlacement="outside"
              label="Name"
              type="text"
              size="lg"
              autoComplete="off"
              placeholder="Enter name"
              value={name}
              fullWidth
              onChange={(e) => setName(e.target.value)}
            />
            <Spacer y={1.5} />
            <Input
              isRequired
              variant="bordered"
              labelPlacement="outside"
              label="Email address"
              type="email"
              size="lg"
              autoComplete="new-email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <Spacer y={1.5} />
            <Input
              isRequired
              label=" Password"
              variant="bordered"
              labelPlacement="outside"
              value={password}
              size="lg"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
              <Link showAnchorIcon href="#" onClick={navigateToLogin}>
                Already have an account? Login
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default Register;
