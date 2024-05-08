const express = require("express");
const path = require("path");
const fs = require("fs");

module.exports = async (req, res, next) => {
  console.log("Serving videos...");
  const uid = req.user.uid;
  const videoDirectory = path.join(
    __dirname,
    "../uploads",
    "users",
    uid,
    "videos"
  );

  if (!fs.existsSync(videoDirectory)) {
    return res
      .status(404)
      .send("No videos found for this user" + videoDirectory);
  }
  express.static(videoDirectory)(req, res, next);
};
