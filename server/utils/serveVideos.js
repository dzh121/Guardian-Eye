const { admin, db } = require("../config/firebase");

module.exports = async (req, res) => {
  const uid = req.user.uid;
  const eventID = req.query.eventID;

  if (!eventID) {
    return res.status(400).send("Event ID is required.");
  }

  try {
    const videosRef = db.collection("users").doc(uid).collection("videos");
    const snapshot = await videosRef.where("eventID", "==", eventID).get();
    if (snapshot.empty) {
      return res.status(404).send("No video found for the provided event ID.");
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const fileName = data.fileName;

    const bucket = admin.storage().bucket();
    const file = bucket.file(`${uid}/clips/videos/${fileName}`);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send("Video file not found");
    }

    const stream = file.createReadStream();
    stream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).send("Error reading video stream");
    });

    stream.pipe(res);
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};
