const express = require("express");
const path = require("path");
const fs = require("fs");
const {db} = require("../config/firebase");
module.exports = async (req, res, next) => {
  console.log("Serving images...");
  const uid = req.user.uid;
  const eventID = req.query.eventID;
  console.log("Event ID: ", eventID);
  if (!eventID) {
    return res.status(400).send("Event ID is required.");
  }
  try {
    const imagesRef = db.collection("users").doc(uid).collection("images");
    const snapshot = await imagesRef.where("eventID", "==", eventID).get();
    if (snapshot.empty) {
      return res.status(404).send("No image found for the provided event ID.");
    }

    let imagePath = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      imagePath = path.join(
        __dirname,
        "../uploads",
        "users",
        uid,
        "images",
        data.fileName
      );
    });
    console.log("Image path: ", imagePath);
    // Serve the image if it exists
    if (fs.existsSync(imagePath)) {

      console.log("Image path not found: ", imagePath);
      res.sendFile(imagePath);
    } else {
      res.status(404).send("Image file not found on server.");
    }
  } catch (error) {
    console.log("Error serving image: ", error.message);
    res.status(500).send("Server error: " + error.message);
  }
};
