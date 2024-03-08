const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

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

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    // Use the original filename provided by the client
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
  // req.file contains information about the uploaded file
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Handle the uploaded file (e.g., save it to disk, process it, etc.)
  console.log("File received:", req.file.originalname);
  console.log("File saved as:", req.file.filename);

  // Send a response indicating success
  res.send("File uploaded successfully.");
});

const videoDirectory = path.join(__dirname, "uploads");

app.get("/video/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(videoDirectory, filename);

  console.log("Video request received for filename:", filename);

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Video file not found at path:", filePath);
      return res.status(404).send("Video not found");
    }

    console.log("Video file found at path:", filePath);

    // Set the appropriate content type for video files
    res.setHeader("Content-Type", "video/mp4");

    // Stream the video file to the client
    const stream = fs.createReadStream(filePath);
    stream.on("open", () => {
      stream.pipe(res);
    });
    stream.on("error", (err) => {
      console.error("Error streaming video file:", err);
      res.status(500).send("Error streaming video");
    });
  });
});
// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
