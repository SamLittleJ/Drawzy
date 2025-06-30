import json
from collections import defaultdict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        

    async def connect(self, room_code: str, websocket: WebSocket):
        self.active_connections.setdefault(room_code, []).append(websocket)

    def disconnect(self, room_code: str, websocket: WebSocket):
        connections = self.active_connections.get(room_code, [])
        if websocket in connections:
            connections.remove(websocket)
            if not connections:
                self.active_connections.pop(room_code, None)

    async def broadcast(self, room_code: str, message: dict):
        for ws in list(self.active_connections.get(room_code, [])):
            try:
                await ws.send_json(message)
            except:
                self.disconnect(room_code, ws)
                    
manager = ConnectionManager()