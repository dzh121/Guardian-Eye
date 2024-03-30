from datetime import datetime
import requests
<<<<<<< HEAD
import json

def authenticate_user(email, password):
    api_key = "***REMOVED***"  # Replace with your Firebase API Key
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        return response.json()['idToken']
    else:
        raise Exception("Authentication failed")

# Example usage
# token = authenticate_user("***REMOVED***", "***REMOVED***")
token = authenticate_user("***REMOVED***", "***REMOVED***")

def sendFile(file_name, device_id, device_location):
=======
def sendFile(file_name, device_id, device_location, token):
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
    url = 'http://localhost:3000/upload'

    # Headers with device and file information
    headers = {
        'authorization': f'Bearer {token}',
<<<<<<< HEAD
        'deviceid': device_id,
        'devicelocation': device_location,
        'timesent': datetime.now().isoformat(),
=======
        'deviceID': device_id,
        'deviceLocation': device_location,
        'timeSent': datetime.fromtimestamp(int(file_name.split('_')[1].split('.')[0])).isoformat(),
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
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
<<<<<<< HEAD

sendFile("./videos/output_1710000208.mp4", "device1", "location1")
=======
# sendFile("./videos/output_1711798245.mp4", "device1", "location1",token)
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
