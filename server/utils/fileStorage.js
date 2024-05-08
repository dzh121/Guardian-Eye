const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uid = req.user.uid;
    // Determine the type of the file based on its mime type
    const isVideo = file.mimetype.startsWith("video/");
    const isImage = file.mimetype.startsWith("image/");

    let baseUploadPath = path.join(__dirname, "../uploads/users", uid);

    if (isVideo) {
      baseUploadPath = path.join(baseUploadPath, "videos");
    } else if (isImage) {
      baseUploadPath = path.join(baseUploadPath, "images");
    } else {
      baseUploadPath = path.join(baseUploadPath, "others");
    }

    if (!fs.existsSync(baseUploadPath)) {
      fs.mkdirSync(baseUploadPath, { recursive: true });
    }

    cb(null, baseUploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

module.exports = storage;
