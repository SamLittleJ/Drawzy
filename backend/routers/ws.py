# Importuri FastAPI și dependințe
# • Rol: Definirea router-ului WebSocket și obținerea utilizatorului curent și a sesiunii DB.
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user_ws
from backend.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.routers.game_ws_manager import manager
from backend.models import Room, RoomPlayer

# Instanțiere router WebSocket
# • Rol: Configurare punct de intrare pentru endpoint-urile WS.
router = APIRouter()

# Importuri suplimentare și logging
# • Rol: Adaugă suport pentru WebSocketException și logare evenimente WS.
from fastapi import WebSocketException
import logging
import asyncio
from backend.routers.game import run_game_loop

# Configurare logger
# • Rol: Obține un logger dedicat pentru mesaje și erori WS.
logger = logging.getLogger("ws")

# Instanțiere router cu autentificare
# • Rol: Configurează endpoint-urile WS care fac autentificare inițială.
router = APIRouter()

# Endpoint WS cu autentificare
# • Rol: Acceptă și autorizează conexiuni, apoi redirecționează mesaje prin manager.
@router.websocket("/ws/{code}")
async def websocket_chat(
    websocket: WebSocket,
    code: str,
    db: Session = Depends(get_db)
):
    # Autentificare WebSocket
    # • Rol: Verifică token-ul JWT din query params și închide conexiunea dacă e invalid.
    try:
        user = await get_current_user_ws(websocket, db)
    except WebSocketException as e:
        logger.error("WebSocket auth failed: %s", e)
        await websocket.close(code=e.code, reason=e.reason)
        return

    # Acceptare conexiune
    # • Rol: Confirmă upgrade-ul la protocolul WebSocket.
    await websocket.accept()
    logger.info(f"WebSocket connected: user={user.username}, room={code}")

    # Manager conectare cu autentificare
    # • Rol: Înregistrează conexiunea autentificată în manager.
    await manager.connect(code, websocket)

    room_obj = db.query(Room).filter(Room.code == code).first()
    if room_obj:
        existing_players = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_obj.id).all()
        for rp in existing_players:
            await websocket.send_json({
                "type": "PLAYER_JOIN",
                "payload": {
                    "id": rp.user_id,
                    "username": rp.user.username
                }
            })

    try:
        while True:
            # Citire mesaj
            # • Rol: Primește payload JSON trimis de client.
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})
            logger.debug(f"Received WS message type={msg_type}, payload={payload}")

            if msg_type == "PLAYER_JOIN":
                await manager.broadcast(code, {
                    "type": "PLAYER_JOIN",
                    "payload": {
                        "id": user.id,
                        "username": user.username
                    }
                })
            elif msg_type == "CHAT":
                await manager.broadcast(code, {"type": "CHAT", "payload": {
                    "user": user.username,
                    "message": payload.get("message", "")
                }})
            elif msg_type == "DRAW":
                await manager.broadcast(code, {"type": "DRAW", "payload": payload})
            elif msg_type == "START_GAME":
                # Start the asynchronous game loop
                asyncio.create_task(run_game_loop(code, db))
                
            else:
                logger.warning("Unknown WS type: %s", msg_type)

    except WebSocketDisconnect:
        # Deconectare controlată
        # • Rol: Elimină conexiunea din manager și loghează deconectarea.
        await manager.disconnect(code, websocket)
        # If the room has no more active WebSocket connections, delete it
        if not manager.active_connections.get(code):
            db.query(Room).filter(Room.code == code).delete()
            db.commit()
            logger.info(f"Room {code} deleted as no clients remain")
        logger.info(f"WebSocket disconnected: user={user.username}, room={code}")