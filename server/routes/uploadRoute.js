const { admin, db } = require("../config/firebase");

module.exports = async (req, res) => {
  const {
    deviceid: deviceID,
    devicelocation: deviceLocation,
    timesent: timeSent,
    eventid: eventID,
  } = req.headers;

  if (!req.file && !req.headers.filename) {
    return res.status(400).send("No file or filename provided in the request.");
  }

  const fileName = req.file ? req.file.originalname : req.headers.filename;
  const uid = req.user.uid;
  const isVideo = req.file.mimetype.startsWith("video/");
  const isImage = req.file.mimetype.startsWith("image/");
  //console log req.file:
  console.log("isVideo: " + isVideo + "\n", "isImage: " + isImage);
  // console.log("File: " + req.file.eventID);
  console.log(
    "deviceID: " + deviceID + "\n",
    "deviceLocation: " + deviceLocation + "\n",
    "timeSent: " + timeSent + "\n",
    "eventID: " + eventID + "\n",
    "fileName: " + fileName + "\n"
  );

  try {
    let docRef;
    if (isImage) {
      const userImagesRef = db
        .collection("users")
        .doc(uid)
        .collection("images");
      docRef = await userImagesRef.add({
        deviceID,
        fileName,
        deviceLocation,
        timeSent: new Date(timeSent),
        eventID: eventID,
      });
    } else if (isVideo) {
      const userVideosRef = db
        .collection("users")
        .doc(uid)
        .collection("videos");
      docRef = await userVideosRef.add({
        deviceID,
        fileName,
        deviceLocation,
        timeSent: new Date(timeSent),
        eventID: eventID,
      });
    } else {
      // If not image or video, you might want to handle other types or errors
      return res.status(400).send("Unsupported file type");
    }

    res.status(200).send(`File metadata saved with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send("Error saving file metadata: " + error.message);
  }
};
