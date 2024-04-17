from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sockets import Sockets

app = Flask(__name__)
CORS(app)
sockets = Sockets(app)


# A simple example of a WebSocket endpoint for signaling
@sockets.route("/signal/<device_id>")
def signal_socket(ws, device_id):
    while not ws.closed:
        message = ws.receive()
        # Here you would handle signaling messages, e.g., offer, answer, ICE candidates
        print(f"Received message from {device_id}: {message}")


@app.route("/register_device/<device_id>", methods=["POST"])
def register_device(device_id):
    # Device registration logic
    return jsonify(status="registered", device_id=device_id)


def run_server():
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(("0.0.0.0", 8080), app, handler_class=WebSocketHandler)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
