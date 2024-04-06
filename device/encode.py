import face_recognition
import pickle
import os
import numpy as np


def save_encodings(encodings, filename="encodings.dat"):
    """Save face encodings to a file."""
    with open(filename, "wb") as file:
        pickle.dump(encodings, file)


def load_encodings(filename="encodings.dat"):
    """Load face encodings from a file."""
    if os.path.exists(filename):
        with open(filename, "rb") as file:
            return pickle.load(file)
    return {}


def add_face(known_faces):
    """Add a new face to the known faces."""
    encodings = load_encodings()
    for name, image_path in known_faces.items():
        image = face_recognition.load_image_file(image_path)
        # Ensure at least one face is found
        if len(face_recognition.face_encodings(image)) > 0:
            encoding = face_recognition.face_encodings(image)[0]
            if name in encodings or any(
                np.array_equal(encoding, existing_encoding)
                for existing_encoding in encodings.values()
            ):
                print(f"Face {name} already exists. Skipping.")
                continue
            encodings[name] = encoding
        else:
            print(f"No faces found in {image_path}. Skipping.")
    return encodings


def remove_face(name):
    """Remove a face from the known faces."""
    encodings = load_encodings()
    print(encodings)
    if name in encodings:
        del encodings[name]
        print(f"Face {name} removed.")
    else:
        print(f"Face {name} not found.")
    return encodings


# Define the known faces and images
known_faces = {
    "Unknown": "my_image.jpg",
    # Add more people and their image paths here
    # "Person2": "path_to_person2_image.jpg",
}
# encodings = remove_face("Daniel")
encodings = add_face(known_faces)
save_encodings(encodings)

print("Face encodings have been generated and saved.")
