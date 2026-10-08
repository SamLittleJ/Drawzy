from collections import defaultdict
from dataclasses import dataclass

from fastapi import WebSocket


@dataclass(frozen=True)
class Player:
    id: int
    username: str

    def to_dict(self) -> dict:
        return {"id": self.id, "username": self.username}


class ConnectionManager:
    """Keeps track of open WebSockets per room, and which player owns each one, and fans messages out to them."""

    def __init__(self):
        # Dicts keep insertion order, so players are listed in the order they joined.
        self.active_connections: dict[str, dict[WebSocket, Player]] = defaultdict(dict)

    def connect(self, room_code: str, websocket: WebSocket, player: Player) -> None:
        self.active_connections[room_code][websocket] = player

    def disconnect(self, room_code: str, websocket: WebSocket) -> None:
        connections = self.active_connections.get(room_code)
        if connections is None:
            return
        connections.pop(websocket, None)
        if not connections:
            self.active_connections.pop(room_code, None)

    def connection_count(self, room_code: str) -> int:
        return len(self.active_connections.get(room_code, {}))

    def players(self, room_code: str) -> list[Player]:
        """Connected players in join order, once each even if they have several tabs open."""
        unique: dict[int, Player] = {}
        for player in self.active_connections.get(room_code, {}).values():
            unique.setdefault(player.id, player)
        return list(unique.values())

    def is_connected(self, room_code: str, player_id: int) -> bool:
        return any(p.id == player_id for p in self.active_connections.get(room_code, {}).values())

    async def broadcast(self, room_code: str, message: dict, exclude: WebSocket | None = None) -> None:
        for ws in list(self.active_connections.get(room_code, {})):
            if ws is not exclude:
                await self._send(room_code, ws, message)

    async def send_to_player(self, room_code: str, player_id: int, message: dict) -> None:
        for ws, player in list(self.active_connections.get(room_code, {}).items()):
            if player.id == player_id:
                await self._send(room_code, ws, message)

    async def _send(self, room_code: str, websocket: WebSocket, message: dict) -> None:
        try:
            await websocket.send_json(message)
        except Exception:
            # The socket is gone; drop it so we don't keep trying.
            self.disconnect(room_code, websocket)


manager = ConnectionManager()
