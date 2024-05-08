const admin = require("firebase-admin");

const serviceAccount = require("./admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.storageBucket,
});
console.log("Firebase initialized");
const db = admin.firestore();

module.exports = { admin, db };
