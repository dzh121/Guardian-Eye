const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { admin } = require("./firebase");

const app = express();
const server = http.createServer(app);
const db = admin.firestore(); // Moved firestore initialization to a central place

const corsOptions = {
  credentials: true,
  origin: "http://localhost:3000",
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "my-app", "build")));

// Token verification middleware
const verifyToken = require("./verifyToken");

// Routes
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

// Verify token route
app.use("/verify-token", require("./routes/verifyTokenRoute"));
// File upload setup
const upload = multer({ storage: require("./fileStorage") });

// File upload route
app.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  require("./routes/uploadRoute")
);

// Video retrieval route
app.get("/videos", verifyToken, require("./routes/videosRoute"));

// Video serving middleware
app.use("/video", verifyToken, require("./serveVideos"));

// Default route for React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
