const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = "tempkey"; // This should be a more complex secret in production

// Use CORS with specific options
const corsOptions = {
  credentials: true,
  origin: "http://localhost:3000", // Adjust as needed
  allowedHeaders: ["Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "my-app", "build")));

const users = [{ email: "***REMOVED***", password: "pass1" }]; // Example user database

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
    console.log("Login successful");
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.get("/check-auth", (req, res) => {
  const authHeader = req.headers.authorization;
  //console.log("Auth header", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or invalid format" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Token is valid
    res.json({ message: "Authenticated", user: decoded });
  });
});

// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
