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
  { email: "user1@gmail.com", password: "pass1", houseId: "house1" },
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

const upload = multer({ storage: storage });

const getUserFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error(error);
    return null;
  }
};

app.post("/upload", upload.single("file"), (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const userId = getUserFromToken(token);

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(403).send("User not authorized or not found.");
  }

  const userUploadsPath = path.join(__dirname, "uploads", user.houseId);
  fs.mkdirSync(userUploadsPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: userUploadsPath,
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const userUpload = multer({ storage }).single("file");
  userUpload(req, res, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }

    // Save video details in user's JSON record here (if needed)
    res.send("File uploaded successfully.");
  });
});

const videoDirectory = path.join(__dirname, "uploads");
app.use("/video", express.static(videoDirectory));

app.get("/videos", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const userId = getUserFromToken(token);

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(403).send("User not authorized or not found.");
  }

  const userUploadsPath = path.join(__dirname, "uploads", user.houseId);
  fs.readdir(userUploadsPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Unable to retrieve videos");
    }

    const videoFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".mp4"
    );
    res.json(videoFiles);
  });
});

// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
