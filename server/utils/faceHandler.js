// utils/faceHandler.js
const { spawn } = require("child_process");

function handleFaceOperation(
  action,
  faces,
  token,
  storageBucket,
  user_uid,
  callback
) {
  const pythonProcess = spawn("python", [
    "./utils/encode.py",
    JSON.stringify({
      faces,
      token,
      storageBucket,
      user_uid,
      action,
    }),
  ]);

  let data = "";
  let error = "";

  pythonProcess.stdout.on("data", (chunk) => {
    data += chunk;
  });

  pythonProcess.stderr.on("data", (chunk) => {
    error += chunk;
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      callback(`Error during face ${action}: ${error}`, null);
    } else {
      try {
        const result = JSON.parse(data);
        callback(null, result);
      } catch (parseError) {
        callback(`Error parsing JSON output: ${parseError}`, null);
      }
    }
  });
}

module.exports = handleFaceOperation;
