const admin = require("firebase-admin");

const serviceAccount = require("./admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "face-recognition-system-dbe5e.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };
