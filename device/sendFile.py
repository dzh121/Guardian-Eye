import requests

def sendFile(file_name):
    # URL of your Express server endpoint
    url = 'http://localhost:3000/upload'

    # Path to the video file you want to upload
    #file_path = f'C:/Users/danie/PycharmProjects/Face Recognition System/device/videos/{file_name}'

    # Open the video file in binary mode
    with open(file_name, 'rb') as f:
        # Send a POST request with the file as the request body
        response = requests.post(url, files={'file': f})

    # Check the response status
    if response.status_code == 200:
        print("File uploaded successfully!")
    else:
        print("Failed to upload file:", response.text)

