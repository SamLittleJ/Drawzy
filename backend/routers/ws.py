from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user
from backend.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        
    async def connect(self, room_code: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(room_code, []).append(websocket)
        
    def disconnect(self, room_code: str, websocket: WebSocket):
        self.active_connections.get(room_code, []).remove(websocket)
        
    async def broadcast(self, room_code: str, message: dict):
        for ws in self.active_connections.get(room_code, []):
            await ws.send_json(message)
            
manager = ConnectionManager()

@router.websocket("/ws/{room_code}")
async def websocket_chat(
    room_code:str,
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    await websocket.accept()
    token = websocket.query_params.get("token")
    user = await get_current_user(token, db)
    
    await manager.connect(room_code, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})
            
            if msg_type =="CHAT":
                broadcast_msg = {
                    "type": "CHAT",
                    "payload": {
                        "user": user.username,
                        "message": payload.get("message", "")
                    }
                }
                await manager.broadcast(room_code, broadcast_msg)
                
            elif msg_type == "DRAW":
                broadcast_msg = {"type": "DRAW", "payload": payload}
                await manager.broadcast(room_code, broadcast_msg)
    except WebSocketDisconnect:
        manager.disconnect(room_code, websocket)    