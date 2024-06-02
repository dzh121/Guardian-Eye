const { admin, db } = require("../config/firebase");

module.exports = async (req, res) => {
  const uid = req.user.uid;
  const eventID = req.query.eventID;

  if (!eventID) {
    return res.status(400).send("Event ID is required.");
  }

  try {
    const imagesRef = db.collection("users").doc(uid).collection("images");
    const snapshot = await imagesRef.where("eventID", "==", eventID).get();
    if (snapshot.empty) {
      return res.status(404).send("No image found for the provided event ID.");
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const fileName = data.fileName;

    const bucket = admin.storage().bucket();
    const file = bucket.file(`${uid}/clips/images/${fileName}`);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send("Image file not found");
    }

    const stream = file.createReadStream();
    stream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).send("Error reading image stream");
    });

    stream.pipe(res);
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};
