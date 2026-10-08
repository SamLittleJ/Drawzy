"""Real-time room channel: player presence, chat, canvas strokes and game control."""

import json
import logging
from enum import StrEnum

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, WebSocketException
from sqlalchemy.orm import Session

from backend import game, models
from backend.connection_manager import manager
from backend.database import get_db
from backend.dependencies import WS_FORBIDDEN, WS_NOT_FOUND, get_current_user_ws

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


class EventType(StrEnum):
    # Sent by clients
    GET_EXISTING_PLAYERS = "GET_EXISTING_PLAYERS"
    CHAT = "CHAT"
    DRAW = "DRAW"
    START_GAME = "START_GAME"
    # Sent by the server
    EXISTING_PLAYERS = "EXISTING_PLAYERS"
    PLAYER_JOIN = "PLAYER_JOIN"
    PLAYER_LEAVE = "PLAYER_LEAVE"


def _roster(room: models.Room, db: Session) -> list[dict]:
    players = (
        db.query(models.RoomPlayer)
        .filter(models.RoomPlayer.room_id == room.id)
        .order_by(models.RoomPlayer.joined_at)
        .all()
    )
    return [{"id": p.user_id, "username": p.user.username, "score": p.score} for p in players]


def _authorize(websocket: WebSocket, code: str, db: Session) -> tuple[models.User, models.Room]:
    user = get_current_user_ws(websocket, db)
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if room is None:
        raise WebSocketException(code=WS_NOT_FOUND, reason="Room not found")
    already_in_room = db.get(models.RoomPlayer, {"room_id": room.id, "user_id": user.id}) is not None
    if not already_in_room and room.player_count >= room.max_players:
        raise WebSocketException(code=WS_FORBIDDEN, reason="Room is full")
    return user, room


def _join_room(user: models.User, room: models.Room, db: Session) -> None:
    if db.get(models.RoomPlayer, {"room_id": room.id, "user_id": user.id}) is None:
        db.add(models.RoomPlayer(room_id=room.id, user_id=user.id))
        db.commit()


def _leave_room(user: models.User, code: str, db: Session) -> bool:
    """Remove the player from the room; delete the room once nobody is connected. Returns True if deleted."""
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if room is None:
        return True
    player = db.get(models.RoomPlayer, {"room_id": room.id, "user_id": user.id})
    if player is not None:
        db.delete(player)

    room_deleted = manager.connection_count(code) == 0
    if room_deleted:
        game.stop_game(code)
        db.delete(room)
    db.commit()
    return room_deleted


async def _handle_event(websocket: WebSocket, code: str, user: models.User, room: models.Room, db: Session, data: dict):
    msg_type = data.get("type")
    payload = data.get("payload") or {}

    if msg_type == EventType.GET_EXISTING_PLAYERS:
        await websocket.send_json({"type": EventType.EXISTING_PLAYERS, "payload": _roster(room, db)})
    elif msg_type == EventType.CHAT:
        text = str(payload.get("message", "")).strip()
        if text:
            await manager.broadcast(code, {"type": EventType.CHAT, "payload": {"user": user.username, "message": text}})
    elif msg_type == EventType.DRAW:
        # The sender has already drawn the stroke locally.
        await manager.broadcast(code, {"type": EventType.DRAW, "payload": payload}, exclude=websocket)
    elif msg_type == EventType.START_GAME:
        if not game.start_game(code):
            logger.info("Ignoring START_GAME for room %s: a game is already running", code)
    else:
        logger.warning("Unknown WebSocket event type: %r", msg_type)


@router.websocket("/ws/{code}")
async def room_socket(websocket: WebSocket, code: str, db: Session = Depends(get_db)):
    # Accept first so that rejections reach the browser as a close code instead of a failed handshake.
    await websocket.accept()
    try:
        user, room = _authorize(websocket, code, db)
    except WebSocketException as exc:
        await websocket.close(code=exc.code, reason=exc.reason)
        return

    _join_room(user, room, db)
    manager.connect(code, websocket)
    logger.info("%s joined room %s", user.username, code)

    await websocket.send_json({"type": EventType.EXISTING_PLAYERS, "payload": _roster(room, db)})
    await manager.broadcast(
        code,
        {"type": EventType.PLAYER_JOIN, "payload": {"id": user.id, "username": user.username, "score": 0}},
        exclude=websocket,
    )

    try:
        while True:
            try:
                data = json.loads(await websocket.receive_text())
            except ValueError:
                continue
            if isinstance(data, dict):
                await _handle_event(websocket, code, user, room, db, data)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(code, websocket)
        if not _leave_room(user, code, db):
            await manager.broadcast(code, {"type": EventType.PLAYER_LEAVE, "payload": {"id": user.id}})
        logger.info("%s left room %s", user.username, code)
