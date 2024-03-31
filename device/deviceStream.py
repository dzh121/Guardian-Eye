# Device-side Flask app (for each device)
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

load_dotenv()
DEVICE_LOCATION = os.getenv('LOCATION')
DEVICE_ID = os.getenv('DEVICE_ID')

app = Flask(__name__)
CORS(app)

# Unique ID for each device
CENTRAL_SERVICE_URL = os.environ.get("CENTRAL_SERVICE_URL", "localhost:6000")

# Initialize Firebase Admin SDK
cred = credentials.Certificate('./admin.json')
firebase_admin.initialize_app(cred)

# Initialize the camera
camera = cv2.VideoCapture(0)
camera_lock = threading.Lock()  # Lock for thread-safe access to the camera

def hash_device_id(device_id):
    return int(hashlib.md5(device_id.encode()).hexdigest(), 16)

def get_port_from_hash(hash_number, min_port=5000, max_port=6000):
    # Map the hash number to the port range
    return min_port + hash_number % (max_port - min_port)
PORT = get_port_from_hash(hash_device_id(DEVICE_ID))

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

# Function to generate frames
def gen_frames():
    while True:
        with camera_lock:
            success, frame = camera.read()
            if not success:
                break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    token = request.args.get('token')
    if not verify_token(token):
        abort(401, 'Unauthorized access')
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Register with the central service
def register_device():
    try:
        response = requests.post('http://localhost:8080/register', json={'id': DEVICE_ID, 'loc':DEVICE_LOCATION,'url': f'http://localhost:{PORT}/video_feed'})
        print(f"Registration response: {response.status_code}, {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"HTTP Request failed: {e}")
    except Exception as e:
        print(f"Error registering device: {e}")

if __name__ == '__main__':
    # Start the Flask app in a separate thread
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=PORT, threaded=True))
    flask_thread.start()
    time.sleep(5)
    register_device()
    flask_thread.join()