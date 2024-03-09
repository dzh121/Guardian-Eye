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
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "my-app", "build")));

const users = [
  { email: "***REMOVED***", password: "pass1", houseId: "house1" },
]; // Example user database

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

const getUserFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error(error);
    return null;
  }
};
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const houseId = req.headers["house-id"];
      const uploadPath = path.join(__dirname, "uploads", houseId);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
}).single("file");

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).send("Multer error: " + err.message);
    } else if (err) {
      return res.status(500).send("Unknown error: " + err.message);
    }
    res.send("File uploaded successfully.");
  });
  const houseId = req.headers["house-id"];
  const deviceID = req.headers["device-id"];
  updateHouseJson(houseId, req.file.originalname, deviceID);
});
app.get("/videos", (req, res) => {
  const houseId = getHouseIdFromUser(req.user); // Assuming you have a way to get houseId from user info
  const videos = getVideosFromHouseJson(houseId); // A function to read from JSON and return video list
  res.json(videos);
});
//Todo: define functions

const videoDirectory = path.join(__dirname, "uploads");
app.use("/video", express.static(videoDirectory));

// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
