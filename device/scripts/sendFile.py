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


#
# def sendFile(file_name, device_id, device_location, token):
#     url = "http://localhost:3000/upload"
#     mime_type, _ = mimetypes.guess_type(file_name)
#     if mime_type is None:
#         mime_type = "application/octet-stream"
#     # Headers with device and file information
#     headers = {
#         "Authorization": f"Bearer {token}",
#         "Device-ID": device_id,
#         "Device-Location": device_location,
#     }
#     headers = {
#         "authorization": f"Bearer {token}",
#         "deviceID": device_id,
#         "deviceLocation": device_location,
#         "timeSent": datetime.fromtimestamp(
#             int(file_name.split("_")[1].split(".")[0])
#         ).isoformat(),
#         "filename": file_name,
#     }
#
#     try:
#         with open(file_name, "rb") as f:
#             response = requests.post(
#                 url,
#                 files={"file": (file_name, f, mime_type)},
#                 headers=headers,
#             )
#
#             # Check the response status
#             if response.status_code == 200:
#                 print("File uploaded successfully!")
#             else:
#                 print("Failed to upload file:", response.text)
#     except Exception as e:
#         print("Failed to upload file:", e)

#
# sendFile(
#     "../data/myImage_123.jpg",
#     "device1",
#     "location1",
#     "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc2MDI3MTI2ODJkZjk5Y2ZiODkxYWEwMzdkNzNiY2M2YTM5NzAwODQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZ3VhcmRpYW4tZXllLWRlNTcwIiwiYXVkIjoiZ3VhcmRpYW4tZXllLWRlNTcwIiwiYXV0aF90aW1lIjoxNzE0NTY3NTE1LCJ1c2VyX2lkIjoiODFmcmFIVFFvT1ZLcFJ2Z1RZem1BRnB4ZHFhMiIsInN1YiI6IjgxZnJhSFRRb09WS3BSdmdUWXptQUZweGRxYTIiLCJpYXQiOjE3MTUxNzQ0NjUsImV4cCI6MTcxNTE3ODA2NSwiZW1haWwiOiJkYW5pZWx6aXZoYXJlbEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZGFuaWVseml2aGFyZWxAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.E7Mlgf_Z1Uo57LIYS24_ixobmtkzmp6hUfo_sw_2vC9amQ3xkT7zgyCYo0MF9sQNNM9Qqv2aLDBtCbPX5M3U9ggyIwBKcIf7OktZCPD0veAOqgA6tfRMVS6QrSHF3aeaTXG6ujn_NiWEIIK0jOHl-XU59oyWN4fQ0OLnetb5tPFk1JMl-iV65nbk6fy8qvPPaeBMTHiFO1Peo0-LaRTqVVLQcl84mILGqyyLEsujgnzmZs1WuoVr8S6A1z9hk-CkTJBRE2x3oVn76RQhF3P4Bxn3-26RkFBfPfJCWvP4HHM39lQyMWw1dG9iBTrAy_9K9ZZjHSOErBo1lE-bkvoCdQ",
#     f"{uuid.uuid4().hex}_{int(time.time())}",
# )
