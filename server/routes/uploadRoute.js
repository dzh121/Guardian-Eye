const { admin, db, storage } = require("../config/firebase");

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
  console.log(
    "isVideo: " + isVideo + "\n",
    "isImage: " + isImage + "\n",
    "deviceID: " + deviceID + "\n",
    "deviceLocation: " + deviceLocation + "\n",
    "timeSent: " + timeSent + "\n",
    "eventID: " + eventID + "\n",
    "fileName: " + fileName + "\n"
  );

  const uploadFileToFirebase = async (file, uid, folder, filename) => {
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(`${uid}/clips/${folder}/${filename}`);
    const buffer = file.buffer;
    if (!buffer) {
      throw new Error("File buffer is undefined");
    }
    await fileRef.save(buffer, {
      contentType: file.mimetype,
    });
  };

  try {
    let folder;
    if (isImage) {
      folder = "images";
    } else if (isVideo) {
      folder = "videos";
    } else {
      return res.status(400).send("Unsupported file type");
    }

    if (req.file) {
      await uploadFileToFirebase(req.file, uid, folder, fileName);
    }

    const data = {
      deviceID,
      fileName,
      deviceLocation,
      timeSent: new Date(timeSent),
      eventID: eventID,
    };

    let docRef;
    if (isImage) {
      const userImagesRef = db
        .collection("users")
        .doc(uid)
        .collection("images");
      docRef = await userImagesRef.add(data);
    } else if (isVideo) {
      const userVideosRef = db
        .collection("users")
        .doc(uid)
        .collection("videos");
      docRef = await userVideosRef.add(data);
    }

    res.status(200).send(`File metadata saved with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send("Error saving file metadata: " + error.message);
  }
};
