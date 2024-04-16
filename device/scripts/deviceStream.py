from flask import Flask, Response, request, abort, jsonify
import cv2
import threading
import requests
import os
from dotenv import load_dotenv
from firebase_admin import credentials, firestore, auth
import time
from flask_cors import CORS
import hashlib


class DeviceStream:
    def __init__(self, user_id, id_token):
        load_dotenv()
        self.DEVICE_LOCATION = os.getenv("LOCATION")
        self.DEVICE_ID = os.getenv("DEVICE_ID")
        self.EMAIL = os.getenv("EMAIL")
        self.PASSWORD = os.getenv("PASSWORD")
        self.API_KEY = os.getenv("API_KEY")
        self.CENTRAL_SERVICE_URL = os.environ.get(
            "CENTRAL_SERVICE_URL", "http://localhost:8080"
        )

        self.user_id = user_id
        self.id_token = id_token
        self.db = firestore.client()

        self.camera = self.init_camera()
        self.camera_lock = threading.Lock()
        self.HASH = self.hash_device_id(self.DEVICE_ID)
        self.PORT = self.get_port_from_hash(int(self.HASH, 16))

        self.app = Flask(__name__)
        CORS(self.app)
        self.setup_routes()

    def setup_routes(self):
        @self.app.route("/video_feed")
        def video_feed():
            auth_header = request.headers.get("Authorization")
            token = None

            if auth_header:
                try:
                    token = auth_header.split(" ")[1]
                except IndexError:
                    return jsonify({"error": "Bearer token malformed"}), 400

            if not token:
                token = request.args.get("token")

            if token:
                if self.verify_token(token):
                    return Response(
                        self.gen_frames(),
                        mimetype="multipart/x-mixed-replace; boundary=frame",
                    )
                else:
                    return jsonify({"error": "Unauthorized access"}), 401
            else:
                return (
                    jsonify(
                        {"error": "Authorization header or token parameter is missing"}
                    ),
                    401,
                )

    def init_camera(self):
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        if not camera.isOpened():
            print("Error: Camera is not available")
            exit(0)
        return camera

    def hash_device_id(self, device_id):
        return hashlib.md5(device_id.encode()).hexdigest()

    def get_port_from_hash(self, hash_number, min_port=5000, max_port=6000):
        return min_port + hash_number % (max_port - min_port)

    def verify_token(self, token):
        try:
            if token:
                decoded_token = auth.verify_id_token(token, check_revoked=True)
                return decoded_token["uid"] == self.user_id
            else:
                return None
        except Exception as e:
            print(e)
            return None

    def gen_frames(self):
        while True:
            with self.camera_lock:
                success, frame = self.camera.read()
            if not success:
                break

            frame = self.resize_frame(frame)  # Resize outside of lock
            ret, buffer = cv2.imencode(".jpg", frame)
            frame = buffer.tobytes()
            yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")

    def resize_frame(self, frame):
        height, width = frame.shape[:2]
        desired_aspect_ratio = 16 / 9
        actual_aspect_ratio = width / height

        if actual_aspect_ratio > desired_aspect_ratio:
            # Frame is wider than desired aspect ratio
            new_width = int(desired_aspect_ratio * height)
            start_x = width // 2 - new_width // 2
            frame = frame[:, start_x : start_x + new_width]
        elif actual_aspect_ratio < desired_aspect_ratio:
            # Frame is taller than desired aspect ratio
            new_height = int(width / desired_aspect_ratio)
            start_y = height // 2 - new_height // 2
            frame = frame[start_y : start_y + new_height, :]

        return frame

    def register_device(self):
        if self.user_id:
            print(f"Login successful. User ID: {self.user_id}")
        else:
            print("Login failed.")
        try:
            registration_info = {
                "deviceId": self.DEVICE_ID,
                "location": self.DEVICE_LOCATION,
                "videoUrl": f"http://localhost:{self.PORT}/video_feed",
            }
            # Adding data to Firestore collection named 'devices'
            doc_ref = (
                self.db.collection("cameras")
                .document(self.user_id)
                .collection("devices")
                .document(self.HASH)
            )

            doc_ref.set(registration_info)
            print(
                f"Registration information added to Firestore under the devices collection with document ID {self.DEVICE_ID}"
            )
        except Exception as e:
            print(f"Error registering device: {e}")

    def run_server(self, in_background=False):
        if in_background:
            flask_thread = threading.Thread(
                target=lambda: self.app.run(
                    host="0.0.0.0",
                    port=self.PORT,
                    threaded=True,  # This enables multi-threading
                )
            )
            flask_thread.daemon = True
            flask_thread.start()
        else:
            self.app.run(host="0.0.0.0", port=self.PORT, threaded=True)

    def get_port(self):
        return self.PORT


if __name__ == "__main__":
    device_stream = DeviceStream()
    device_stream.run_server()
