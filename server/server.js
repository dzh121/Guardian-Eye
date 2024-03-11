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
app.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  // Extracting metadata from headers
  const deviceID = req.headers["deviceid"];
  const deviceLocation = req.headers["devicelocation"];
  const timeSent = req.headers["timesent"];
  const fileName = req.file ? req.file.originalname : req.headers["filename"]; // Assuming file is sent with key 'video'

  const uid = req.user.uid; // UID from the verified token

  try {
    const db = admin.firestore();
    const userVideosRef = db.collection("users").doc(uid).collection("videos");

    const docRef = await userVideosRef.add({
      deviceID,
      fileName,
      deviceLocation,
      timeSent: new Date(timeSent),
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
  try {
    const uid = req.user.uid;
    const db = admin.firestore();

    const videosCollectionRef = db.collection(`users/${uid}/videos`);
    const videoQuerySnapshot = await videosCollectionRef.limit(1).get();

    if (videoQuerySnapshot.empty) {
      return res.status(404).send("No videos found");
    }

    const firstVideoName = videoQuerySnapshot.docs[0].data().name;
    res.status(200).json({ firstVideoName, uid });
  } catch (error) {
    console.error("Error retrieving videos:", error);
    res.status(500).send("Error retrieving videos");
  }
});

app.use("/video", verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
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
