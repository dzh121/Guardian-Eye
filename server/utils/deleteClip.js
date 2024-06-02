const { admin, db } = require("../config/firebase");

module.exports = async (req, res) => {
  const uid = req.user.uid;
  const eventID = req.params.eventID;

  if (!eventID) {
    return res.status(400).send("Event ID is required.");
  }

  try {
    const bucket = admin.storage().bucket();

    // Delete video
    const videosRef = db.collection("users").doc(uid).collection("videos");
    const videoSnapshot = await videosRef.where("eventID", "==", eventID).get();
    if (!videoSnapshot.empty) {
      const videoDoc = videoSnapshot.docs[0];
      const videoData = videoDoc.data();
      const videoFileName = videoData.fileName;

      const videoFile = bucket.file(`${uid}/clips/videos/${videoFileName}`);
      await videoFile.delete();
      await videoDoc.ref.delete();
    }

    // Delete image
    const imagesRef = db.collection("users").doc(uid).collection("images");
    const imageSnapshot = await imagesRef.where("eventID", "==", eventID).get();
    if (!imageSnapshot.empty) {
      const imageDoc = imageSnapshot.docs[0];
      const imageData = imageDoc.data();
      const imageFileName = imageData.fileName;

      const imageFile = bucket.file(`${uid}/clips/images/${imageFileName}`);
      await imageFile.delete();
      await imageDoc.ref.delete();
    }

    res.status(200).send("Clip deleted successfully.");
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};
