from datetime import datetime
import requests
def sendFile(file_name, device_id, device_location, token):
    url = 'http://localhost:3000/upload'

    # Headers with device and file information
    headers = {
        'authorization': f'Bearer {token}',
        'deviceID': device_id,
        'deviceLocation': device_location,
        'timeSent': datetime.now().isoformat(),
        'filename': file_name
    }

    try:
        with open(file_name, 'rb') as f:
            response = requests.post(url, files={'file': f}, headers=headers)

            # Check the response status
            if response.status_code == 200:
                print("File uploaded successfully!")
            else:
                print("Failed to upload file:", response.text)
    except Exception as e:
        print("Failed to upload file:", e)

#sendFile("./videos/output_1710000208.mp4", "device1", "location1")