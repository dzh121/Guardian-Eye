# This file is responsible for managing the devices that are connected to the server.
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, auth
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
devices = {}

cred = credentials.Certificate('./admin.json')
firebase_admin.initialize_app(cred)

# @app.route('/register', methods=['POST'])
# def register_device():
#     device_info = request.json
#     devices[device_info['id']] = {'url': device_info['url'], 'location': device_info['loc'], 'id': device_info['id']}
#     print(f"Registered device {device_info['id']}")
#     print("devices: ", devices)
#     return jsonify({"status": "success"})

@app.route('/register', methods=['POST'])
def register_device():
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    device_info = request.json
    device_id = device_info['id']
    # Associating device with user ID
    devices[device_id] = {
        'user_id': user_id,
        'url': device_info['url'],
        'location': device_info['loc'],
        'id': device_id
    }

    print(f"Registered device {device_id} for user {user_id}")
    return jsonify({"status": "success"})

def verify_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        return None

@app.route('/devices')
def get_devices():
    token = request.args.get('token')
    decoded_token = verify_token(token)
    if not decoded_token:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = decoded_token.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID not found in token"}), 401

    # Filtering devices for the specific user
    user_devices = [device for device in devices.values() if device['user_id'] == user_id]
    return jsonify(user_devices)

@app.route('/remove-device', methods=['POST'])
def remove_device():
    token = request.args.get('token')
    decoded_token = verify_token(token)
    if not decoded_token:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = decoded_token.get('user_id')
    device_id = request.json.get('id')

    if device_id in devices and devices[device_id]['user_id'] == user_id:
        del devices[device_id]
        print(f"Removed device {device_id}")
        return jsonify({"status": "success", "id": device_id})
    else:
        return jsonify({"error": "Device not found or access denied"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)