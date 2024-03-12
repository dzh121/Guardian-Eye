from datetime import datetime
import requests
import json

def authenticate_user(email, password):
    api_key = "AIzaSyDz8YBJxq8z9o8lfOujbbzJZ49IWrNUSyw"  # Replace with your Firebase API Key
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
token = authenticate_user("user1@gmail.com", "pass12")
def sendFile(file_name, device_id, device_location):
    url = 'http://localhost:3000/upload'

    # Headers with device and file information
    headers = {
        'authorization': f'Bearer {token}',
        'deviceid': device_id,
        'devicelocation': device_location,
        'timesent': datetime.now().isoformat(),
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

sendFile("./videos/output_1710000208.mp4", "device1", "location1")