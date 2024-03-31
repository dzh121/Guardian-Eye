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

@app.route('/register', methods=['POST'])
def register_device():
    device_info = request.json
    devices[device_info['id']] = {'url': device_info['url'], 'location': device_info['loc'], 'id': device_info['id']}
    print(f"Registered device {device_info['id']}")
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
    if not verify_token(token):
        return jsonify({"error": "Unauthorized"}), 401
    print(devices)
    return jsonify(list(devices.values()))


@app.route('/remove-device', methods=['POST'])
def remove_device():
    token = request.args.get('token')
    if not verify_token(token):
        return jsonify({"error": "Unauthorized"}), 401

    device_id = request.json.get('id')
    print(request.json)
    if device_id in devices:
        del devices[device_id]
        print(f"Removed device {device_id}")
        return jsonify({"status": "success", "id": device_id})
    else:
        return jsonify({"error": "Device not found"}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)