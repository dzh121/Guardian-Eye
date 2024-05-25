import sys
import json
import face_recognition
import numpy as np
import requests
from io import BytesIO
from PIL import Image
import pickle
from firebase_admin import credentials, storage
import firebase_admin
import os

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("./config/admin.json")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}", file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)

def load_encodings(user_uid):
    """Load encodings from the existing .dat file in Firebase Storage."""
    bucket = storage.bucket()
    blob = bucket.blob(f'{user_uid}/encodings.dat')
    try:
        encodings_data = blob.download_as_text()
        encodings = json.loads(encodings_data)
        return encodings
    except Exception as e:
        print(f"Error loading encodings: {e}", file=sys.stderr)
        sys.stderr.flush()
        return {}
        
def save_encodings(user_uid, encodings):
    """Save encodings to the .dat file in Firebase Storage."""
    bucket = storage.bucket()
    blob = bucket.blob(f'{user_uid}/encodings.dat')
    try:
        encodings_data = json.dumps(encodings)
        blob.upload_from_string(encodings_data)
    except Exception as e:
        print(f"Error saving encodings: {e}", file=sys.stderr)
        sys.stderr.flush()

def download_image(url, token):
    """Download image from URL using Firebase Storage token and return as PIL Image."""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    else:
        print(f"Error downloading image from {url}", file=sys.stderr)
        sys.stderr.flush()
        return None

def add_face(known_faces, token, user_uid):
    """Add a new face to the known faces."""
    encodings = load_encodings(user_uid)
    added_faces = []
    errors = []
    for name, image_url in known_faces.items():
        print(f"Processing {name} from {image_url}", file=sys.stderr)
        sys.stderr.flush()
        image = download_image(image_url, token)
        if image is None:
            errors.append(name)
            continue

        image_np = np.array(image)
        print(f"Image shape: {image_np.shape}", file=sys.stderr)
        sys.stderr.flush()
        
        face_encodings = face_recognition.face_encodings(image_np)
        print(f"Found {len(face_encodings)} face(s) in the image", file=sys.stderr)
        sys.stderr.flush()

        if len(face_encodings) > 0:
            encoding = face_encodings[0].tolist()
            base_name = os.path.splitext(name)[0]  # Extract name without extension
            if base_name in encodings or any(
                np.array_equal(encoding, existing_encoding)
                for existing_encoding in encodings.values()
            ):
                print(f"Face {base_name} already exists. Skipping.", file=sys.stderr)
                sys.stderr.flush()
                continue
            encodings[base_name] = encoding
            added_faces.append(base_name)
            print(f"Encoding for {base_name} added successfully.", file=sys.stderr)
            sys.stderr.flush()
        else:
            print(f"No faces found in {image_url}. Skipping.", file=sys.stderr)
            sys.stderr.flush()
            errors.append(name)
    save_encodings(user_uid, encodings)
    return encodings, added_faces, errors

def remove_face(face_name, user_uid):
    """Remove a face from the known faces."""
    encodings = load_encodings(user_uid)
    base_name = os.path.splitext(face_name)[0]  # Extract name without extension
    if base_name in encodings:
        del encodings[base_name]
        print(f"Encoding for {base_name} removed successfully.", file=sys.stderr)
    else:
        print(f"Face {base_name} not found. Skipping.", file=sys.stderr)
    save_encodings(user_uid, encodings)

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1])
        action = args.get('action')
        faces = args['faces']
        token = args['token']
        storageBucket = args['storageBucket']
        user_uid = args['user_uid']
        firebase_admin.initialize_app(cred, {
          'storageBucket': storageBucket
        })
        if action == 'add':
            known_faces = {face['name']: face['imageUrl'] for face in faces}
            encodings, added_faces, errors = add_face(known_faces, token, user_uid)
            result = {
                "encodings": encodings,
                "added_faces": added_faces,
                "errors": errors
            }
        elif action == 'remove':
            removed_faces = []
            for face in faces:
                remove_face(face['name'], user_uid)
                removed_faces.append(face['name'])
            result = {
                "removed_faces": removed_faces
            }
            
        print(json.dumps(result))
        sys.stdout.flush()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
