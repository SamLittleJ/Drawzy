from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user_ws
from backend.database import get_db
from sqlalchemy.orm import Session
from backend.routers.game_ws_manager import manager

router = APIRouter()

@router.websocket("/ws/{code}")
async def websocket(websocket: WebSocket, code: str, db: Session = Depends(get_db), user = Depends(get_current_user_ws)):
    await manager.connect(code, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get('type') == 'PLAYER_JOIN':
                await manager.broadcast(code, {
                    "type": "PLAYER_JOIN",
                    "payload": {
                        "id": user.id,
                        "username": user.username,
                    }
                })
    except WebSocketDisconnect:
        manager.disconnect(code, websocket)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, WebSocketException
from backend.dependencies import get_current_user_ws
from backend.database import get_db
from sqlalchemy.orm import Session
from backend.routers.game_ws_manager import manager
import logging

router = APIRouter()
logger = logging.getLogger("ws")

@router.websocket("/ws/{code}")
async def websocket_chat(websocket: WebSocket, code: str, db: Session = Depends(get_db)):
    # Authenticate user
    try:
        user = await get_current_user_ws(websocket, db)
    except WebSocketException as e:
        logger.error("WebSocket auth failed: %s", e)
        await websocket.close(code=e.code, reason=e.reason)
        return

    # Accept the connection
    await websocket.accept()
    logger.info(f"WebSocket connected: user={user.username}, room={code}")

    # Register connection with manager
    await manager.connect(code, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})
            logger.debug(f"Received WS message type={msg_type}, payload={payload}")
            if msg_type == "PLAYER_JOIN":
                # Broadcast the authenticated user's info, ignoring any client payload
                await manager.broadcast(code, {
                    "type": "PLAYER_JOIN",
                    "payload": {
                        "id": user.id,
                        "username": user.username
                    }
                })
            elif msg_type == "CHAT":
                await manager.broadcast(code, {"type": "CHAT", "payload": payload})
            elif msg_type == "DRAW":
                await manager.broadcast(code, {"type": "DRAW", "payload": payload})
            elif msg_type == "START_GAME":
                await manager.broadcast(code, {"type": "START_GAME"})
            elif msg_type == "SHOW_THEME":
                await manager.broadcast(code, {"type": "SHOW_THEME", "payload": payload})
            elif msg_type == "ROUND_START":
                await manager.broadcast(code, {"type": "ROUND_START"})
            elif msg_type == "ROUND_END":
                await manager.broadcast(code, {"type": "ROUND_END"})
            elif msg_type == "VOTE_RESULT":
                await manager.broadcast(code, {"type": "VOTE_RESULT", "payload": payload})
            elif msg_type == "GAME_END":
                await manager.broadcast(code, {"type": "GAME_END"})
            else:
                logger.warning("Unknown WS type: %s", msg_type)
    except WebSocketDisconnect:
        await manager.disconnect(code, websocket)
        logger.info(f"WebSocket disconnected: user={user.username}, room={code}")