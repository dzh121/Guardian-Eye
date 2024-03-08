const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cors = require("cors");
app.use(cors());

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("received: %s", message);
    // Handle incoming video stream or messages
  });

  ws.on("close", () => {
    console.log("Connection closed");
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "my-app/build")));

// Handles any requests that don't match the ones above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app/build", "index.html"));
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
