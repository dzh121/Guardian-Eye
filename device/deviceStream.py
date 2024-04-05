from flask import Flask, Response, request, abort
import cv2
import threading
import requests
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
import time
from flask_cors import CORS
import hashlib

class DeviceStream:
    def __init__(self):
        load_dotenv()
        self.DEVICE_LOCATION = os.getenv('LOCATION')
        self.DEVICE_ID = os.getenv('DEVICE_ID')
        self.EMAIL = os.getenv('EMAIL')
        self.PASSWORD = os.getenv('PASSWORD')
        self.API_KEY = os.getenv('API_KEY')
        self.CENTRAL_SERVICE_URL = os.environ.get("CENTRAL_SERVICE_URL", "http://localhost:8080")

        cred = credentials.Certificate('./admin.json')
        firebase_admin.initialize_app(cred)

        self.camera = self.init_camera()
        self.camera_lock = threading.Lock()
        self.PORT = self.get_port_from_hash(self.hash_device_id(self.DEVICE_ID))

        self.app = Flask(__name__)
        CORS(self.app)
        self.setup_routes()

    def setup_routes(self):
        @self.app.route('/video_feed')
        def video_feed():
            token = request.args.get('token')
            if not self.verify_token(token):
                abort(401, 'Unauthorized access')
            return Response(self.gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

    def init_camera(self):
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("Error: Camera is not available")
            exit(0)
        return camera

    def hash_device_id(self, device_id):
        return int(hashlib.md5(device_id.encode()).hexdigest(), 16)

    def get_port_from_hash(self, hash_number, min_port=5000, max_port=6000):
        return min_port + hash_number % (max_port - min_port)

    def verify_token(self, token):
        try:
            if token:
                decoded_token = auth.verify_id_token(token, check_revoked=True)
                return decoded_token
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
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    def authenticate_user(self, email, password):
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.API_KEY}"

        data = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }

        response = requests.post(url, json=data)
        if response.status_code == 200:
            user_info = response.json()
            return user_info['localId'], user_info['idToken']
        else:
            return None, None

    def register_device(self):
        user_id, id_token = self.authenticate_user(self.EMAIL, self.PASSWORD)
        if user_id:
            print(f"Login successful. User ID: {user_id}")
        else:
            print("Login failed.")
        try:
            registration_info = {
                'id': self.DEVICE_ID,
                'loc': self.DEVICE_LOCATION,
                'url': f'http://localhost:{self.PORT}/video_feed',
                'user_id': user_id
            }
            response = requests.post(f'{self.CENTRAL_SERVICE_URL}/register', json=registration_info)
            print(f"Registration response: {response.status_code}, {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"HTTP Request failed: {e}")
        except Exception as e:
            print(f"Error registering device: {e}")

    def run_server(self, in_background=False):
        flask_thread = threading.Thread(target=lambda: self.app.run(host='0.0.0.0', port=self.PORT, threaded=True))
        flask_thread.start()
        time.sleep(5)
        self.register_device()
        if not in_background:
            flask_thread.join()

    def get_port(self):
        return self.PORT

if __name__ == '__main__':
    device_stream = DeviceStream()
    device_stream.run_server()
