const admin = require("firebase-admin");

const serviceAccount = require("./***REMOVED***");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: ***REMOVED***
});

const db = admin.firestore();

module.exports = { admin, db };
