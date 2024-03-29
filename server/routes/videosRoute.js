const db = require("../firebase").db;

module.exports = async (req, res) => {
  const uid = req.user.uid;

  try {
    const videosCollectionRef = db.collection(`users/${uid}/videos`);
    const getVideos = await videosCollectionRef
      .orderBy("timeSent", "desc")
      .limit(20)
      .get();

    if (getVideos.empty) {
      return res.status(404).send("No videos found");
    }

    res.status(200).json({ videos: getVideos.docs.map((doc) => doc.data()) });
  } catch (error) {
    res.status(500).send("Error retrieving the latest video");
  }
};
