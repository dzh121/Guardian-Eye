const admin = require("firebase-admin");

<<<<<<< HEAD
const serviceAccount = require("./***REMOVED***");
=======
const serviceAccount = require("./admin.json");
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "***REMOVED***.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };
