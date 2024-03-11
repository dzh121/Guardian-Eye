const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const { db, admin } = require("./firebase");

const app = express();
const server = http.createServer(app);

const JWT_SECRET = "tempkey";

const corsOptions = {
  credentials: true,
  origin: "http://localhost:3000",
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "my-app", "build")));

const users = [
  { email: "user1@gmail.com", password: "pass1", houseId: "house1" },
]; // Example user database

app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

app.post("/verify-token", (req, res) => {
  const { idToken } = req.body;

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      // Optionally, fetch more user information or perform other tasks
      res.json({ status: "success", uid });
    })
    .catch((error) => {
      res.status(401).send("Invalid token");
    });
});

function verifyToken(req, res, next) {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).send("No token provided");
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(async (decodedToken) => {
      // Extract user UID from decoded token
      const uid = decodedToken.uid;

      // Assuming you're using Firebase Firestore as your database
      const db = admin.firestore();

      // Retrieve additional user data based on UID from Firestore
      const userDoc = await db.collection("users").doc(uid).get();
      console.log("User document:", userDoc.data());
      console.log("uid :", uid);
      if (!userDoc.exists) {
        throw new Error("User document not found in database");
      }

      // Attach additional user data to req.user
      req.user = {
        uid: decodedToken.uid,
        houseId: userDoc.data().houseId,
        // Add more fields as needed
      };

      next();
    })
    .catch((error) => {
      console.error("Failed to authenticate token:", error);
      res.status(403).send("Failed to authenticate token");
    });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const houseId = req.headers["house-id"];
      const uploadPath = path.join(__dirname, "uploads", houseId);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
}).single("file");

app.post("/upload", verifyToken, async (req, res) => {
  const { firebaseStorageUrl, deviceID } = req.body;
  const houseId = req.user.houseId; // Assuming houseId is part of the token

  try {
    // Save metadata to Firestore
    const docRef = await db.collection("videos").add({
      houseId,
      deviceID,
      url: firebaseStorageUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send(`Video metadata saved with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error saving video metadata:", error);
    res.status(500).send("Error saving video metadata");
  }
});

// app.post("/upload", (req, res) => {
//   upload(req, res, function (err) {
//     if (err instanceof multer.MulterError) {
//       return res.status(500).send("Multer error: " + err.message);
//     } else if (err) {
//       return res.status(500).send("Unknown error: " + err.message);
//     }
//     res.send("File uploaded successfully.");
//   });
//   const houseId = req.headers["house-id"];
//   const deviceID = req.headers["device-id"];
//   updateHouseJson(houseId, req.file.originalname, deviceID);
// });

// app.get("/videos", verifyToken, (req, res) => {
//   const houseId = req.user.houseId;
//   const videoDirectory = path.join(__dirname, "uploads/", houseId);

//   fs.readdir(videoDirectory, (err, files) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Unable to retrieve videos");
//     }

//     const videoFiles = files.filter(
//       (file) => path.extname(file).toLowerCase() === ".mp4"
//     );
//     res.json(videoFiles); // Send the response here
//   });
//   // Removed res.send(decoded) to avoid sending two responses
// });
app.get("/videos", verifyToken, async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).send("No token provided");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const db = admin.firestore();

    // Retrieve the user's document based on the UID
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).send("User document not found in database");
    }

    // Retrieve the videos collection under the user's document
    const videosCollectionRef = db.collection(`users/${uid}/videos`);
    const videoQuerySnapshot = await videosCollectionRef.limit(1).get();

    if (videoQuerySnapshot.empty) {
      return res.status(404).send("No videos found");
    }

    // Get the name of the first video
    const firstVideoName = videoQuerySnapshot.docs[0].data().name;
    console.log("First video name:", videoQuerySnapshot.docs[0].data());
    console.log("First video name:", firstVideoName);
    res.status(200).json({ firstVideoName, uid });
  } catch (error) {
    console.error("Error retrieving videos:", error);
    res.status(500).send("Error retrieving videos");
  }
});

app.use("/video", verifyToken, async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) {
    return res.status(401).send("No token provided");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(uid);
    const videoDirectory = path.join(__dirname, "uploads", uid);
    // Check if directory exists
    if (!fs.existsSync(videoDirectory)) {
      return res.status(404).send("No videos found for this house");
    }

    // Serve the files from the directory
    express.static(videoDirectory)(req, res, next);
  } catch (error) {
    console.error("Error retrieving videos:", error);
    res.status(500).send("Error retrieving videos");
  }
});
// Redirect all non-API requests to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});


//need to work on user dat / show videos and such