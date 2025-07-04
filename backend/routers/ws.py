# Importuri FastAPI și dependințe
# • Rol: Definirea router-ului WebSocket și obținerea utilizatorului curent și a sesiunii DB.
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user_ws
from backend.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.routers.game_ws_manager import manager
from backend import models

# Instanțiere router WebSocket
# • Rol: Configurare punct de intrare pentru endpoint-urile WS.
router = APIRouter()

# Endpoint WS simplificat
# • Rol: Gestionează evenimente de tip PLAYER_JOIN fără accept explicit și autentificare.
@router.websocket("/ws/{code}")
async def websocket_simple(
    websocket: WebSocket,
    code: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user_ws)
):
    # Manager conectare
    # • Rol: Înregistrează conexiunea clientului în manager pentru broadcast.
    await manager.connect(code, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "PLAYER_JOIN":
                await manager.broadcast(code, {
                    "type": "PLAYER_JOIN",
                    "payload": {
                        "id": user.id,
                        "username": user.username,
                    }
                })
    except WebSocketDisconnect:
        # Tratamente deconectare
        # • Rol: Elimină conexiunea din manager la deconectare.
        manager.disconnect(code, websocket)



# Importuri suplimentare și logging
# • Rol: Adaugă suport pentru WebSocketException și logare evenimente WS.
from fastapi import WebSocketException
import logging

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
                await manager.broadcast(code, {"type": "CHAT", "payload": payload})
            elif msg_type == "DRAW":
                await manager.broadcast(code, {"type": "DRAW", "payload": payload})
            elif msg_type == "START_GAME":
                theme_obj = db.query(models.Theme).order_by(func.random()).first()
                theme = theme_obj.text if theme_obj else "No theme available"
                
                await manager.broadcast(code, {
                    "type": "SHOW_THEME",
                    "payload": {"theme": theme}
                })
                
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
        # Deconectare controlată
        # • Rol: Elimină conexiunea din manager și loghează deconectarea.
        await manager.disconnect(code, websocket)
        logger.info(f"WebSocket disconnected: user={user.username}, room={code}")