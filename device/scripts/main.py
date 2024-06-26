import cv2
import dlib
import numpy as np
import pickle
import os
import time
from collections import deque
import threading
import subprocess
import sendFile as sf
import uuid
from dotenv import load_dotenv
import deviceStream
import requests
import firebase_admin
from firebase_admin import credentials, firestore, storage
import json


# Configuration and constants
ENCODINGS_FILE = "../data/encodings.dat"
SHAPE_PREDICTOR_FILE = "../models/shape_predictor_68_face_landmarks.dat"
FACE_RECOGNITION_MODEL_FILE = "../models/dlib_face_recognition_resnet_model_v1.dat"
VIDEO_DIRECTORY = "../videos"
IMAGE_DIRECTORY = "../images"
MIN_WAIT_DURATION = 2 * 60  # 2 minutes
MIN_TIME_DETECT_DURATION = 2  # 2 seconds for detection to be considered valid

# Load environment variables
load_dotenv()
EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")
DEVICE_LOCATION = os.getenv("LOCATION")
DEVICE_ID = os.getenv("DEVICE_ID")
API_KEY = os.getenv("API_KEY")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET")
PORT = None
RECOGNIZE_FACES = False
recognition_started = False

# Thread control variables
capture_thread = None
detection_thread = None
stop_capture_thread = False
stop_detection_thread = False

# Firebase Initialization
if not firebase_admin._apps:
    cred = credentials.Certificate("../data/admin.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Condition variable for face recognition
condition = threading.Condition()


# Firestore listeners
def on_snapshot(doc_snapshot, changes, read_time):
    global RECOGNIZE_FACES
    for change in changes:
        if change.type.name == "MODIFIED":
            doc = change.document
            if "recognizeFaces" in doc.to_dict():
                new_value = doc.get("recognizeFaces")
                print(f"Recognize Faces changed to: {new_value}")
                with condition:
                    RECOGNIZE_FACES = new_value
                    condition.notify()


def get_initial_recognize_faces_value():
    global RECOGNIZE_FACES

    doc_ref = db.collection("users").document(user_id)
    try:
        doc = doc_ref.get()
        if doc.exists:
            RECOGNIZE_FACES = doc.get("recognizeFaces")
            print(f"Initial Recognize Faces value: {RECOGNIZE_FACES}")
        else:
            print("Document does not exist.")
    except Exception as e:
        print(f"Error getting document: {e}")


def setup_firestore_listener(user_id):
    print(f"Listening for changes to user document: {user_id}")
    doc_ref = db.collection("users").document(user_id)
    doc_watch = doc_ref.on_snapshot(on_snapshot)


def check_for_encodings_update(interval=1800):
    """Check for updates to the encodings.dat file periodically. 30 minutes by default."""
    while True:
        download_encodings()
        time.sleep(interval)


# Helper functions
def authenticate_user(email, password):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"

    data = {"email": email, "password": password, "returnSecureToken": True}

    response = requests.post(url, json=data)
    if response.status_code == 200:
        user_info = response.json()
        return user_info["localId"], user_info["idToken"]
    else:
        return None, None


def download_encodings():
    """Download the encodings.dat file from Firebase Storage."""
    bucket = storage.bucket(STORAGE_BUCKET)
    blob = bucket.blob(f"{user_id}/encodings.dat")
    local_path = ENCODINGS_FILE

    if blob.exists():
        blob.download_to_filename(local_path)
        print("Encodings file downloaded successfully.")
    else:
        print("Encodings file not found in Firebase Storage.")


def load_encodings(filename=ENCODINGS_FILE):
    """Load face encodings from a JSON file."""
    download_encodings()
    if os.path.exists(filename):
        with open(filename, "r") as file:
            return json.load(file)
    return {}


# Face recognition functions


def process_frame(
    frame, known_face_encodings, face_detector, shape_predictor, face_recognition_model
):
    """Process a single frame for face recognition using dlib."""
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    detections = face_detector(rgb_frame)

    face_locations = []
    face_encodings = []
    for detection in detections:
        shape = shape_predictor(rgb_frame, detection)
        face_encoding = np.array(
            face_recognition_model.compute_face_descriptor(rgb_frame, shape)
        )
        face_encodings.append(face_encoding)

        face_locations.append(
            (detection.top(), detection.right(), detection.bottom(), detection.left())
        )

    face_names = []
    for face_encoding in face_encodings:
        distances = np.linalg.norm(
            list(known_face_encodings.values()) - face_encoding, axis=1
        )
        best_match_index = np.argmin(distances)
        if distances[best_match_index] < 0.6:  # adjust threshold as needed
            name = list(known_face_encodings.keys())[best_match_index]
        else:
            name = "Unknown"
        face_names.append(name)

    return face_locations, face_names


def draw_results(frame, face_locations, face_names):
    """Draw rectangles and names on the frame."""
    for (top, right, bottom, left), name in zip(face_locations, face_names):
        color = (0, 255, 255) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(
            frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 1.0, color, 1
        )


def save_buffer_to_file(buffer, filename, save_first_image, event_id, face_frame=0):
    if not buffer:
        print("No data in buffer to save")
        return

    print(f"Number of frames in buffer: {len(buffer)}")
    frame_height, frame_width = buffer[0].shape[:2]
    print(f"Frame dimensions: {frame_width}x{frame_height}")

    os.makedirs(VIDEO_DIRECTORY, exist_ok=True)
    os.makedirs(IMAGE_DIRECTORY, exist_ok=True)
    video_path = os.path.join(VIDEO_DIRECTORY, filename)

    fourcc = cv2.VideoWriter_fourcc(*"XVID")
    out = cv2.VideoWriter(video_path, fourcc, 30.0, (frame_width, frame_height))

    for i, frame in enumerate(buffer):
        if i == face_frame and save_first_image:
            image_path = os.path.join(IMAGE_DIRECTORY, f"{event_id}.jpg")
            cv2.imwrite(image_path, frame)
            sf.sendFile(image_path, DEVICE_ID, DEVICE_LOCATION, id_token, event_id)
            print(f"Saved image to {image_path}")

        out.write(frame)

    out.release()
    re_encode_video(video_path)
    return video_path


def re_encode_video(filepath, bitrate="1860k"):
    # Create a temporary output file name
    tmp_filepath = filepath + ".tmp.mp4"

    command = [
        "../ffmpeg",
        "-y",
        "-i",
        filepath,
        "-b:v",
        bitrate,
        "-bufsize",
        bitrate,
        tmp_filepath,
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Replace the original file with the new re-encoded file
    os.replace(tmp_filepath, filepath)


class BufferManager:
    def __init__(self, fps):
        self.fps = fps
        self.pre_detection_buffer_size = int(self.fps * 15)  # 15 seconds of frames
        self.total_buffer_size = int(self.fps * 30)  # 30 seconds of frames
        self.buffer = deque(maxlen=self.total_buffer_size)
        self.face_detected = False
        self.lock = threading.Lock()
        self.event_id = None
        self.MIN_DETECTION_DURATION = MIN_WAIT_DURATION
        self.lastDetectionTime = time.time() - self.MIN_DETECTION_DURATION

    def add_frame(self, frame):
        should_save = False
        with self.lock:
            self.buffer.append(frame)
            # print(f"Buffer length: {len(self.buffer)}")

            # If face was detected, check if the buffer size reaches 30 seconds after detection
            if self.face_detected and len(self.buffer) >= self.total_buffer_size:
                should_save = True
                self.face_detected = False
        if should_save:
            self.save_video()

    def process_detection(self, face_detected):
        if (
            face_detected
            and not self.face_detected
            and abs(self.lastDetectionTime - time.time()) >= self.MIN_DETECTION_DURATION
        ):
            self.lastDetectionTime = time.time()
            self.event_id = f"{uuid.uuid4().hex}_{int(time.time())}"
            self.face_detected = True
            # Adjust the buffer size to keep additional frames post-detection
            self.buffer = deque(
                list(self.buffer)[-self.pre_detection_buffer_size :],
                maxlen=self.total_buffer_size,
            )

    def save_video(self):
        buffer_copy = None

        with self.lock:
            buffer_copy = list(self.buffer)

        if buffer_copy is None:
            return

        print(f"Frames to save: {len(buffer_copy)}")
        if buffer_copy:
            filename = f"{self.event_id}.mp4"
            video_path = save_buffer_to_file(
                buffer_copy,
                filename,
                True,
                self.event_id,
                int(self.fps * 15),
            )
            print(f"Saved video to {filename}")
            sf.sendFile(
                video_path, DEVICE_ID, DEVICE_LOCATION, id_token, filename.split(".")[0]
            )
            print(f"Sent video to server")

            self.clear_buffer()

    def get_next_frame_for_processing(self):
        with self.lock:
            if self.buffer:
                return self.buffer[-1]  # get the most recent frame
            return None

    def clear_buffer(self):
        self.buffer.clear()
        self.event_id = None


# Thread functions


def frame_capture_thread(video_url, buffer_manager):
    global stop_capture_thread
    while not stop_capture_thread:
        video_url += f"?token={id_token}"
        with requests.get(video_url, stream=True) as r:
            if stop_capture_thread:
                break
            if r.status_code != 200:
                print(f"Failed to connect to {video_url}, Status code: {r.status_code}")
                return

            bytes_buffer = bytes()
            for chunk in r.iter_content(chunk_size=1024):
                bytes_buffer += chunk
                a = bytes_buffer.find(b"\xff\xd8")  # JPEG start
                b = bytes_buffer.find(b"\xff\xd9")  # JPEG end
                if a != -1 and b != -1:
                    jpg = bytes_buffer[a : b + 2]
                    bytes_buffer = bytes_buffer[b + 2 :]
                    frame = cv2.imdecode(
                        np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR
                    )
                    if frame is not None:
                        if stop_capture_thread:
                            break
                        buffer_manager.add_frame(frame)


def face_detection_thread(
    buffer_manager,
    known_face_encodings,
    face_detector,
    shape_predictor,
    face_recognition_model,
    n,
):
    global stop_detection_thread
    detection_start_time = None
    while not stop_detection_thread:
        frame_counter = 0
        if frame_counter % n == 0 and (not buffer_manager.face_detected):
            frame = buffer_manager.get_next_frame_for_processing()
            if frame is not None:
                face_locations, face_names = process_frame(
                    frame,
                    known_face_encodings,
                    face_detector,
                    shape_predictor,
                    face_recognition_model,
                )
                face_detected = "Unknown" in face_names
                if face_detected:
                    if detection_start_time is None:
                        detection_start_time = time.time()
                    elif time.time() - detection_start_time >= MIN_TIME_DETECT_DURATION:
                        buffer_manager.process_detection(True)
                        detection_start_time = None
                else:
                    detection_start_time = None
        frame_counter += 1
        time.sleep(0.01)


# Main control functions


def main():
    global recognition_started, known_face_encodings
    known_face_encodings = load_encodings()
    face_detector = dlib.get_frontal_face_detector()
    shape_predictor = dlib.shape_predictor(SHAPE_PREDICTOR_FILE)
    face_recognition_model = dlib.face_recognition_model_v1(FACE_RECOGNITION_MODEL_FILE)

    if dlib.DLIB_USE_CUDA:
        print("Using CUDA for dlib operations")
    else:
        print("CUDA is not being used by dlib (may result in slower performance)")

    # Set FPS to a fixed value or determine it dynamically
    fps = 30  # This is an example; adjust based on your camera's capability or streaming configuration
    n = 10  # Process every 10th frame for face detection

    video_url = f"http://localhost:{PORT}/video_feed"

    # chck ofr initial value of RECOGNIZE_FACES and start threads accordingly
    if RECOGNIZE_FACES and not recognition_started:
        print("Starting face recognition")
        buffer_manager = BufferManager(fps)
        start_threads(
            video_url,
            buffer_manager,
            known_face_encodings,
            face_detector,
            shape_predictor,
            face_recognition_model,
            n,
        )
        recognition_started = True

    while True:
        with condition:
            condition.wait()  # Wait for notification
            if RECOGNIZE_FACES and not recognition_started:
                print("Starting face recognition")
                buffer_manager = BufferManager(fps)
                start_threads(
                    video_url,
                    buffer_manager,
                    known_face_encodings,
                    face_detector,
                    shape_predictor,
                    face_recognition_model,
                    n,
                )
                recognition_started = True
            elif not RECOGNIZE_FACES and recognition_started:
                print("Stopping face recognition")
                stop_threads()  # Logic to stop threads
                recognition_started = False

    # capture_thread = threading.Thread(
    #     target=frame_capture_thread, args=(video_url, buffer_manager)
    # )
    # detection_thread = threading.Thread(
    #     target=face_detection_thread,
    #     args=(
    #         buffer_manager,
    #         known_face_encodings,
    #         face_detector,
    #         shape_predictor,
    #         face_recognition_model,
    #         n,
    #     ),
    # )
    #
    # capture_thread.start()
    # detection_thread.start()
    #
    # capture_thread.join()
    # detection_thread.join()


def start_threads(
    video_url,
    buffer_manager,
    known_face_encodings,
    face_detector,
    shape_predictor,
    face_recognition_model,
    n,
):
    global capture_thread, detection_thread, stop_capture_thread, stop_detection_thread

    stop_capture_thread = False
    stop_detection_thread = False

    if capture_thread is None or not capture_thread.is_alive():
        capture_thread = threading.Thread(
            target=frame_capture_thread, args=(video_url, buffer_manager)
        )
        capture_thread.daemon = True
        capture_thread.start()

    if detection_thread is None or not detection_thread.is_alive():
        detection_thread = threading.Thread(
            target=face_detection_thread,
            args=(
                buffer_manager,
                known_face_encodings,
                face_detector,
                shape_predictor,
                face_recognition_model,
                n,
            ),
        )
        detection_thread.daemon = True
        detection_thread.start()


def stop_threads():
    global capture_thread, detection_thread, stop_capture_thread, stop_detection_thread

    print("Stopping threads...")  # Diagnostic print
    stop_capture_thread = True
    stop_detection_thread = True

    if capture_thread and capture_thread.is_alive():
        capture_thread.join(timeout=5)
        capture_thread = None

    if detection_thread and detection_thread.is_alive():
        detection_thread.join(timeout=5)
        detection_thread = None

    print("Threads have been stopped.")


if __name__ == "__main__":
    global user_id, id_token
    try:
        user_id, id_token = authenticate_user(EMAIL, PASSWORD)
        if user_id is None or id_token is None:
            raise Exception("Authentication failed")

        get_initial_recognize_faces_value()
        setup_firestore_listener(user_id)

        device_stream = deviceStream.DeviceStream(user_id, id_token)
        PORT = device_stream.get_port()
        device_stream.run_server(in_background=True)

        encodings_update_thread = threading.Thread(target=check_for_encodings_update)
        encodings_update_thread.daemon = True
        encodings_update_thread.start()
    except Exception as e:
        print(f"An error occurred: {e}")
    try:
        main_thread = threading.Thread(target=main)
        main_thread.daemon = True
        main_thread.start()
        main_thread.join()
    except KeyboardInterrupt:
        # Handle Ctrl-C and ensure threads are stopped
        stop_threads()
        print("Exiting program.")
    except Exception as e:
        stop_threads()  # Ensure threads are stopped on exception
        print(f"An error occurred: {e}")
