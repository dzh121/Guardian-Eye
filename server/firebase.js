const admin = require("firebase-admin");

const serviceAccount = require("./face-recognition-system-dbe5e-firebase-adminsdk-h5c6g-36d0b5f1ee.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: ***REMOVED***
});

const db = admin.firestore();

module.exports = { admin, db };
