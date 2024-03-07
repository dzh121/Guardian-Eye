import cv2
import dlib
import numpy as np
import pickle
import os
import time
from collections import deque

def load_encodings(filename="encodings.dat"):
    """Load face encodings from a file."""
    if os.path.exists(filename):
        with open(filename, "rb") as file:
            return pickle.load(file)
    return {}

def process_frame(frame, known_face_encodings, face_detector, shape_predictor, face_recognition_model):
    """Process a single frame for face recognition using 2323."""
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    detections = face_detector(rgb_frame)

    face_locations = []
    face_encodings = []
    for detection in detections:
        shape = shape_predictor(rgb_frame, detection)
        face_encoding = np.array(face_recognition_model.compute_face_descriptor(rgb_frame, shape))
        face_encodings.append(face_encoding)

        face_locations.append((detection.top(), detection.right(), detection.bottom(), detection.left()))

    face_names = []
    for face_encoding in face_encodings:
        distances = np.linalg.norm(list(known_face_encodings.values()) - face_encoding, axis=1)
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
        cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 1.0, color, 1)
def save_buffer_to_file(buffer, filename="output.mp4"):
    """Save the frames in the buffer to a video file."""
    if not buffer:
        return

    # Ensure the directory exists
    directory = "./videos"
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Include the directory in the file path
    filepath = os.path.join(directory, filename)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filepath, fourcc, 20.0, (640, 480))
    for frame in buffer:
        out.write(frame)
    out.release()


def main():
    known_face_encodings = load_encodings()

    face_detector = dlib.get_frontal_face_detector()
    shape_predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
    face_recognition_model = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")
    if dlib.DLIB_USE_CUDA:
        print("Using CUDA for dlib operations")
    else:
        print("CUDA is not being used by dlib (may result in slower performance)")

    video_capture = cv2.VideoCapture(0)
    fps = video_capture.get(cv2.CAP_PROP_FPS)
    pre_detection_buffer = deque(maxlen=int(fps * 15))  # Buffer for 15 seconds before detection
    post_detection_buffer = deque()  # Buffer for 15 seconds after detection

    unknown_face_detected = False
    detection_time = None
    last_recording_time = None  # Track the last recording time
    cooldown_period = 60  # 1 minute cooldown

    while True:
        ret, frame = video_capture.read()
        if not ret:
            continue

        # Process frame
        face_locations, face_names = process_frame(frame, known_face_encodings, face_detector, shape_predictor,
                                                   face_recognition_model)
        draw_results(frame, face_locations, face_names)

        if unknown_face_detected:
            post_detection_buffer.append(frame.copy())
            if time.time() - detection_time >= 15:
                # 15 seconds have passed since detection
                if last_recording_time is None or time.time() - last_recording_time > cooldown_period:
                    # Combine pre and post detection buffers and save the video
                    save_buffer_to_file(list(pre_detection_buffer) + list(post_detection_buffer), "output_{}.mp4".format(int(time.time())))
                    last_recording_time = time.time()
                    unknown_face_detected = False
                    post_detection_buffer.clear()
                pre_detection_buffer.clear()

        elif "Unknown" in face_names:
            unknown_face_detected = True
            detection_time = time.time()
            post_detection_buffer.append(frame.copy())

        else:
            pre_detection_buffer.append(frame.copy())  # Continuously record the last 15 seconds

        cv2.imshow('Video', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()