const { admin } = require("./firebase"); // Adjust the path as per your project structure

module.exports = async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer Token

  if (!token) {
    return res.status(401).send("Access token is missing or invalid");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid }; // Attach additional user data as needed
    next();
  } catch (error) {
    res.status(403).send("Token verification failed");
  }
};
