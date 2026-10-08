from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """Keeps track of open WebSockets per room and fans messages out to them."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    def connect(self, room_code: str, websocket: WebSocket) -> None:
        self.active_connections[room_code].append(websocket)

    def disconnect(self, room_code: str, websocket: WebSocket) -> None:
        connections = self.active_connections.get(room_code, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(room_code, None)

    def connection_count(self, room_code: str) -> int:
        return len(self.active_connections.get(room_code, []))

    async def broadcast(self, room_code: str, message: dict, exclude: WebSocket | None = None) -> None:
        for ws in list(self.active_connections.get(room_code, [])):
            if ws is exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                # The socket is gone; drop it so we don't keep trying.
                self.disconnect(room_code, ws)


manager = ConnectionManager()
