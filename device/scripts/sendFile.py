from datetime import datetime
import requests
import mimetypes
import os
import uuid
import time


def sendFile(file_path, device_id, device_location, token, event_id):
    url = "http://localhost:3000/upload"  # Modify with the actual URL of your server endpoint

    # Guess the MIME type of the file based on its extension
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"  # Default MIME type if unknown

    # Prepare headers with the authentication and additional metadata
    headers = {
        "authorization": f"Bearer {token}",
        "deviceID": device_id,
        "deviceLocation": device_location,
        "timeSent": datetime.fromtimestamp(int(event_id.split("_")[1])).isoformat(),
        "eventID": event_id,
    }

    # Prepare the files dictionary for multipart encoding
    with open(file_path, "rb") as f:
        files = {
            "file": (os.path.basename(file_path), f, mime_type),
        }

        # POST request to upload the file
        response = requests.post(url, files=files, headers=headers)

        # Check the response status and handle accordingly
        if response.status_code == 200:
            print(f"File uploaded successfully! Response: {response.text}")
        else:
            print(
                f"Failed to upload file. Status: {response.status_code}, Response: {response.text}"
            )



# sendFile(
#     "../data/myImage_123.jpg",
#     "device1",
#     "location1",
#     "TOKEN",
#     f"{uuid.uuid4().hex}_{int(time.time())}",
# )
