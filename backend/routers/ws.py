from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user_ws
from backend.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.websocket("/ws/{code}")
async def websocket(websocket: WebSocket, code: str, db: Session = Depends(get_db)):
    # Authenticate user
    try:
        user = await get_current_user_ws(websocket, db)
    except Exception as e:
        await websocket.close(code=e.code, reason=e.reason)
        return

    # Accept WebSocket connection
    print(f"WebSocket connection attempt for user={user.username}, room={code}")
    await websocket.accept()
    print(f"WebSocket accepted for user={user.username}, room={code}")

    # Keep the connection open by continuously reading client messages
    while True:
        await websocket.receive_text()