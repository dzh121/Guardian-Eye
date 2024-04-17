from flask import Flask, Response, request, abort
import cv2
import threading
import os
import hashlib
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
from flask_cors import CORS


class DeviceStream:
    def __init__(self, user_id, id_token):
        load_dotenv()
        self.DEVICE_LOCATION = os.getenv("LOCATION")
        self.DEVICE_ID = os.getenv("DEVICE_ID")
        self.EMAIL = os.getenv("EMAIL")
        self.PASSWORD = os.getenv("PASSWORD")
        self.API_KEY = os.getenv("API_KEY")

        self.user_id = user_id
        self.id_token = id_token
        self.camera = self.init_camera()
        self.camera_lock = threading.Lock()
        self.hash = self.hash_device_id(self.DEVICE_ID)

        self.app = Flask(__name__)
        CORS(self.app)
        self.setup_routes()

    def get_hash(self):
        return self.hash

    def setup_routes(self):
        @self.app.route("/video/<hash>")
        def video_feed(hash):
            token = request.args.get("token")
            if not self.verify_token(token):
                abort(401, "Invalid token or token revoked")
            if hash != self.hash:
                abort(403, "Access forbidden: Invalid device hash")
            # return Response(
            #     self.gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame"
            # )
            return f"<p>Video feed {hash} + {self.PASSWORD}</p>"

    def init_camera(self):
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("Error: Camera is not available")
            exit(0)
        return camera

    def hash_device_id(self, device_id):
        return hashlib.md5(device_id.encode()).hexdigest()

    def verify_token(self, token):
        try:
            if token:
                decoded_token = auth.verify_id_token(token, check_revoked=True)
                return decoded_token is not None
            return False
        except Exception as e:
            print("Token verification failed:", e)
            return False

    def gen_frames(self):
        while True:
            with self.camera_lock:
                success, frame = self.camera.read()
                if not success:
                    break
            ret, buffer = cv2.imencode(".jpg", frame)
            frame = buffer.tobytes()
            yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")

    def run_server(self, in_background=False):
        flask_thread = threading.Thread(
            target=lambda: self.app.run(host="0.0.0.0", port=8080, threaded=True)
        )
        flask_thread.start()
        if not in_background:
            flask_thread.join()
