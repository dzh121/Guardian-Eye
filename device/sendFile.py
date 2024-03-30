from datetime import datetime
import requests
def sendFile(file_name, device_id, device_location, token):
    url = 'http://localhost:3000/upload'

    # Headers with device and file information
    headers = {
        'authorization': f'Bearer {token}',
        'deviceID': device_id,
        'deviceLocation': device_location,
        'timeSent': datetime.fromtimestamp(int(file_name.split('_')[1].split('.')[0])).isoformat(),
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
# sendFile("./videos/output_1711798245.mp4", "device1", "location1",token)