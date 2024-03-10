const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const JWT_SECRET = "tempkey";

const corsOptions = {
  credentials: true,
  origin: "http://localhost:3000",
  allowedHeaders: ["Content-Type", "Authorization"],
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
    // Create a token
    const token = jwt.sign(
      { userId: user.id, houseId: user.houseId, userEmail: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

app.get("/check-auth", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.send(decoded);
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
});

app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;

  if (!bearerHeader) {
    return res.status(401).send("No token provided");
  }

  const token = bearerHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send("Failed to authenticate token");
    }

    // Token is valid, add decoded token to request object
    req.user = decoded;
    next();
  });
}

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

app.get("/videos", verifyToken, (req, res) => {
  const houseId = req.user.houseId;
  const videoDirectory = path.join(__dirname, "uploads/", houseId);

  fs.readdir(videoDirectory, (err, files) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Unable to retrieve videos");
    }

    const videoFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".mp4"
    );
    res.json(videoFiles); // Send the response here
  });
  // Removed res.send(decoded) to avoid sending two responses
});

app.use("/video", verifyToken, (req, res, next) => {
  const houseId = req.user.houseId;
  console.log("House ID:", houseId);

  const videoDirectory = path.join(__dirname, "uploads", houseId);

  // Check if directory exists
  if (!fs.existsSync(videoDirectory)) {
    return res.status(404).send("No videos found for this house");
  }

  // Serve the files from the directory
  express.static(videoDirectory)(req, res, next);
});
// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
s;
