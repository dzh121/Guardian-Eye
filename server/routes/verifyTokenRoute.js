const express = require("express");
const router = express.Router();
const { admin } = require("../firebase");

router.post("/", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).send("ID token is required");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

module.exports = router;
