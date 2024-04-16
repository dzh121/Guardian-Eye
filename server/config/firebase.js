const admin = require("firebase-admin");

const serviceAccount = require("./admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "guardian-eye-de570.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };
