const { admin, db } = require("../config/firebase");

module.exports = async (req, res) => {
  const {
    deviceid: deviceID,
    devicelocation: deviceLocation,
    timesent: timeSent,
  } = req.headers;

  const fileName = req.file ? req.file.originalname : req.headers.filename;
  const uid = req.user.uid;

  try {
    const userVideosRef = db.collection("users").doc(uid).collection("videos");

    const docRef = await userVideosRef.add({
      deviceID,
      fileName,
      deviceLocation,
      timeSent: new Date(timeSent),
    });
    res.status(200).send(`Video metadata saved with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send("Error saving video metadata: " + error.message);
  }
};
