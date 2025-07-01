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

    async def start_game(self, room_code: str, theme: str):
        """
        Begin the game by showing the theme and starting the first round.
        """
        # Notify all players of the theme
        await self.broadcast(room_code, {
            "type": "SHOW_THEME",
            "payload": {"theme": theme}
        })
        # Signal start of drawing round
        await self.broadcast(room_code, {
            "type": "ROUND_START"
        })

    async def end_round(self, room_code: str):
        """
        End the current drawing round.
        """
        await self.broadcast(room_code, {
            "type": "ROUND_END"
        })

    async def send_chat(self, room_code: str, user: dict, message: str):
        """
        Broadcast a chat message from a user.
        """
        await self.broadcast(room_code, {
            "type": "CHAT",
            "payload": {
                "user": user,
                "message": message
            }
        })

    async def send_draw(self, room_code: str, draw_data: dict):
        """
        Broadcast drawing data to all players.
        """
        await self.broadcast(room_code, {
            "type": "DRAW",
            "payload": draw_data
        })

    async def end_game(self, room_code: str):
        """
        Signal the end of the game.
        """
        await self.broadcast(room_code, {
            "type": "GAME_END"
        })
                    
manager = ConnectionManager()