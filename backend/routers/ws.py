from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user
from backend.database import get_db
from sqlalchemy.orm import Session
import logging
import json

logger = logging.getLogger("ws")
logging.basicConfig(level=logging.INFO)

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        
    async def connect(self, room_code: str, websocket: WebSocket):
        self.active_connections.setdefault(room_code, []).append(websocket)
        
    def disconnect(self, room_code: str, websocket: WebSocket):
        self.active_connections.get(room_code, []).remove(websocket)
        
    async def broadcast(self, room_code: str, message: dict):
        for ws in self.active_connections.get(room_code, []):
            await ws.send_json(message)
            
manager = ConnectionManager()

@router.websocket("/ws/{room_code}")
async def websocket_chat(
    websocket: WebSocket,
    room_code: str,
    db: Session = Depends(get_db)
):
    print(f"WS connect attemp: room={room_code}, client={websocket.client}")
    token = websocket.query_params.get("token")
    
    await websocket.accept()
    
    user = get_current_user(token, db)
    
    await manager.connect(room_code, websocket)
    
    try:
        print(f"WS handler loop start for room={room_code}")
        while True:
            print("Awaiting message from client")
            raw = await websocket.receive_text()
            print(f"Received message: {raw!r}")
            try:
                data = json.loads(raw)
            except Exception:
                logger.exception("Failed to parse JSON from client")
                await websocket.close(code=1003, reason="Invalid JSON format")
                return
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
    except Exception as e:
        logger.exception(f"Unexpected error in room={room_code}")
        await websocket.close(code=1011)
        