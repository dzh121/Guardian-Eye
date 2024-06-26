from flask import Flask, Response, request, abort
from flask_cors import CORS
import cv2
import threading
import firebase_admin
from firebase_admin import credentials, auth

app = Flask(__name__)
CORS(app)
camera = cv2.VideoCapture(0)  # Initialize camera outside of the gen_frames function
camera_lock = threading.Lock()  # A lock to ensure thread-safe access to the camera

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./admin.json")
firebase_admin.initialize_app(cred)


def verify_token(token):
    try:
        if token:
            # Verify the ID token while checking if the token is revoked
            decoded_token = auth.verify_id_token(token, check_revoked=True)
            return decoded_token
        else:
            return None
    except Exception as e:
        print(e)
        return None


def gen_frames():
    while True:
        with camera_lock:
            success, frame = camera.read()
            if not success:
                break

        ret, buffer = cv2.imencode(".jpg", frame)
        frame = buffer.tobytes()
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")


@app.route("/video_feed")
def video_feed():
    # Extract token from request headers or query parameters
    bearer_token = request.headers.get("Authorization")
    if bearer_token and bearer_token.startswith("Bearer "):
        # Extract the token from the Authorization header (Bearer Token)
        token = bearer_token.split(" ")[1]
    else:
        # Fallback to query parameters if Authorization header is not present
        token = request.args.get("token")

    user = verify_token(token)
    if user:
        return Response(
            gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame"
        )
    else:
        abort(401, "Unauthorized access")


if __name__ == "__main__":
    app.run(host="localhost", port=5000, threaded=True)
