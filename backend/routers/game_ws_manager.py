import json
from collections import defaultdict
from fastapi import WebSocket

# Manager conexiuni WebSocket
# • Rol: Gestionează conexiunile active pe camere și transmite mesaje.
class ConnectionManager:
    # Constructor ConnectionManager
    # • Rol: Inițializează structura de stocare a conexiunilor active.
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        
    # Funcție: connect
    # • Rol: Adaugă un WebSocket activ în lista conexiunilor pentru o cameră dată.
    async def connect(self, room_code: str, websocket: WebSocket):
        self.active_connections.setdefault(room_code, []).append(websocket)

    # Funcție: disconnect
    # • Rol: Elimină un WebSocket din conexiunile unei camere și curăță lista când e goală.
    def disconnect(self, room_code: str, websocket: WebSocket):
        connections = self.active_connections.get(room_code, [])
        if websocket in connections:
            connections.remove(websocket)
            if not connections:
                self.active_connections.pop(room_code, None)

    # Funcție: broadcast
    # • Rol: Trimite un mesaj JSON către toate WebSocket-urile active dintr-o cameră.
    async def broadcast(self, room_code: str, message: dict):
        for ws in list(self.active_connections.get(room_code, [])):
            try:
                await ws.send_json(message)
            except:
                self.disconnect(room_code, ws)

    # Funcție: start_game
    # • Rol: Începe jocul afișând tema și notificând debutul rundelor de desen.
    async def start_game(self, room_code: str, theme: str):
        """
        Begin the game by showing the theme and starting the first round.
        """
        await self.broadcast(room_code, {
            "type": "SHOW_THEME",
            "payload": {"theme": theme}
        })
        await self.broadcast(room_code, {
            "type": "ROUND_START"
        })

    # Funcție: end_round
    # • Rol: Marchează sfârșitul unei runde de desen și notifică participanții.
    async def end_round(self, room_code: str):
        """
        End the current drawing round.
        """
        await self.broadcast(room_code, {
            "type": "ROUND_END"
        })

    # Funcție: send_chat
    # • Rol: Transmite un mesaj de chat de la un utilizator către toți participanții.
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

    # Funcție: send_draw
    # • Rol: Trimite datele desenului către toți jucătorii pentru actualizare în timp real.
    async def send_draw(self, room_code: str, draw_data: dict):
        """
        Broadcast drawing data to all players.
        """
        await self.broadcast(room_code, {
            "type": "DRAW",
            "payload": draw_data
        })

    # Funcție: end_game
    # • Rol: Semnalează sfârșitul jocului și notifică utilizatorii.
    async def end_game(self, room_code: str):
        """
        Signal the end of the game.
        """
        await self.broadcast(room_code, {
            "type": "GAME_END"
        })
                    
manager = ConnectionManager()