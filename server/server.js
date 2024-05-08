const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { admin } = require("./config/firebase");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const db = admin.firestore();

// Environment-specific settings
const PORT = process.env.PORT || 3000;
const CLIENT_BUILD_PATH = path.join(__dirname, "../client", "build");

const corsOptions = {
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
if (process.env.NODE_ENV === "development") {
  app.set("trust proxy", "127.0.0.1");
  corsOptions.origin = "http://localhost:3001";
} else {
  corsOptions.origin = "http://localhost:3000";
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => {
    return req.ip;
  },
  max: 100,
});

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(CLIENT_BUILD_PATH));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});
app.use(limiter);

// Token verification middleware
const verifyToken = require("./utils/verifyToken");

// Load routes
const verifyTokenRoute = require("./routes/verifyTokenRoute");
const uploadRoute = require("./routes/uploadRoute");
const videosRoute = require("./routes/videosRoute");
const serveVideos = require("./utils/serveVideos");
const serveImages = require("./utils/serveImages");

// Routes
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

// Verify token route
app.use("/verify-token", verifyTokenRoute);

// File upload setup
const upload = multer({ storage: require("./utils/fileStorage") });

// File upload route
app.post("/upload", verifyToken, upload.single("file"), uploadRoute);

// Video retrieval route
app.use("/videos", verifyToken, videosRoute);

// Video and Images serving middleware
app.use("/video", verifyToken, serveVideos);

app.use("/image", verifyToken, serveImages);

// Serve React App - handle any other requests to index.html
if (process.env.NODE_ENV === "production") {
  console.log("Production mode");
  app.use(express.static(CLIENT_BUILD_PATH));
  app.get("*", (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(PORT, () => {
  console.log(process.env.PORT);
  console.log(`Server running on port ${PORT}`);
});
