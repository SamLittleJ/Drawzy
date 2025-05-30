from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user
from backend.database import get_db
from backend.models import User

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        
    async def connect(self, room_code: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(room_code, []).append(websocket)
        
    def disconnect(self, room_code: str, websocket: WebSocket):
        self.active_connections[room_code].remove(websocket)
        
    async def broadcast(self, room_code: str, message: dict):
        for ws in self.active_connections.get(room_code, []):
            await ws.send_json(message)
            
manager = ConnectionManager()

@router.websocket("/ws/{room_code}")
async def websocket_chat(
    room_code:str,
    websocket: WebSocket,
    token: str,
    db= Depends(get_db)
):
    user = await get_current_user(token, db)
    await manager.connect(room_code, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "CHAT":
                msg = {
                    "type": "CHAT",
                    "payload": {
                        "user": user.username,
                        "message": data["payload"]["message"]
                    }
                }
                await manager.broadcast(room_code, msg)
    except WebSocketDisconnect:
        manager.disconnect(room_code, websocket)