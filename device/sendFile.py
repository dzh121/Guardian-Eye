import requests
from datetime import datetime

def sendFile(file_name, device_id, device_location):
    url = 'http://localhost:3000/upload'

    # Headers with device and file information
    headers = {
        'deviceid': device_id,
        'devicelocation': device_location,
        'timesent': datetime.now().isoformat(),  # Current time in ISO format
        'filename': file_name
    }

    # Open the video file in binary mode
    with open(file_name, 'rb') as f:
        # Send a POST request with the file as the request body and headers
        response = requests.post(url, files={'file': f}, headers=headers)

    # Check the response status
    if response.status_code == 200:
        print("File uploaded successfully!")
    else:
        print("Failed to upload file:", response.text)
sendFile("./videos/output_1709914507.mp4", "device1", "location1")