import asyncio
import cv2
from aiortc import (
    RTCPeerConnection,
    MediaStreamTrack,
    RTCSessionDescription,
    RTCIceCandidate,
)
from aiortc.contrib.media import MediaRelay
import websockets
import json


class CameraStreamTrack(MediaStreamTrack):
    """
    A video stream track that captures video frames from a camera.
    """

    kind = "video"

    def __init__(self, device_id):
        super().__init__()  # Initialize the MediaStreamTrack
        self.cap = cv2.VideoCapture(device_id)
        if not self.cap.isOpened():
            raise Exception("Could not open video source")
        self.relay = MediaRelay()

    async def recv(self):
        """
        A coroutine that yields video frames to the consumer.
        """
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("Error reading video frame")
                break
            # Convert to RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Yield the frame to the WebRTC connection
            yield self.relay.track(self, frame)


async def run(pc, websocket):
    async for message in websocket:
        data = json.loads(message)
        if data["type"] == "offer":
            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=data["sdp"], type=data["type"])
            )
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await websocket.send(
                json.dumps({"type": "answer", "sdp": pc.localDescription.sdp})
            )
        elif data["type"] == "candidate":
            candidate = RTCIceCandidate(**data["candidate"])
            await pc.addIceCandidate(candidate)


async def connect_to_server(device_id, server_url):
    pc = RTCPeerConnection()
    local_video = CameraStreamTrack(device_id=device_id)
    pc.addTrack(local_video)

    async with websockets.connect(server_url) as websocket:
        await run(pc, websocket)


if __name__ == "__main__":
    asyncio.run(connect_to_server(0, "ws://localhost:8080/signal"))
