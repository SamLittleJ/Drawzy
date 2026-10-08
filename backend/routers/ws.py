"""Real-time room channel: presence, chat, canvas strokes and the draw-and-guess game."""

import json
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, WebSocketException
from sqlalchemy.orm import Session

from backend import game, models
from backend.connection_manager import Player, manager
from backend.database import get_db
from backend.dependencies import WS_FORBIDDEN, WS_NOT_FOUND, get_current_user_ws
from backend.events import EventType

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


def _roster(room: models.Room, db: Session) -> list[dict]:
    players = (
        db.query(models.RoomPlayer)
        .filter(models.RoomPlayer.room_id == room.id)
        .order_by(models.RoomPlayer.joined_at)
        .all()
    )
    # During a game the live scores are newer than the ones saved after each turn.
    current = game.get_game(room.code)
    return [
        {"id": p.user_id, "username": p.user.username, "score": current.score_of(p.user_id) if current else p.score}
        for p in players
    ]


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
    """Update the room after a socket closed; delete it once nobody is connected. Returns True if deleted."""
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if room is None:
        return True
    if manager.connection_count(code) == 0:
        game.stop_game(code)
        db.delete(room)
        db.commit()
        return True
    # A player with another tab still open stays in the room.
    if not manager.is_connected(code, user.id):
        room_player = db.get(models.RoomPlayer, {"room_id": room.id, "user_id": user.id})
        if room_player is not None:
            db.delete(room_player)
            db.commit()
    return False


async def _handle_event(websocket: WebSocket, code: str, player: Player, room: models.Room, db: Session, data: dict):
    msg_type = data.get("type")
    payload = data.get("payload")
    if not isinstance(payload, dict):
        payload = {}
    current = game.get_game(code)

    if msg_type == EventType.GET_EXISTING_PLAYERS:
        await websocket.send_json({"type": EventType.EXISTING_PLAYERS, "payload": _roster(room, db)})
    elif msg_type == EventType.CHAT:
        text = str(payload.get("message", "")).strip()
        if text and not (current and await current.handle_chat(player, text)):
            await manager.broadcast(
                code, {"type": EventType.CHAT, "payload": {"user": player.username, "message": text}}
            )
    elif msg_type == EventType.DRAW:
        # Only the current drawer may draw. Their own client has already rendered the stroke.
        if current and current.can_draw(player.id):
            current.record_stroke(payload)
            await manager.broadcast(code, {"type": EventType.DRAW, "payload": payload}, exclude=websocket)
    elif msg_type == EventType.START_GAME:
        error = game.start_game(code)
        if error:
            await websocket.send_json({"type": EventType.ERROR, "payload": {"message": error}})
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

    player = Player(id=user.id, username=user.username)
    _join_room(user, room, db)
    manager.connect(code, websocket, player)
    logger.info("%s joined room %s", player.username, code)

    current = game.get_game(code)
    await websocket.send_json({"type": EventType.WELCOME, "payload": player.to_dict()})
    await websocket.send_json({"type": EventType.EXISTING_PLAYERS, "payload": _roster(room, db)})
    await manager.broadcast(
        code,
        {
            "type": EventType.PLAYER_JOIN,
            "payload": {**player.to_dict(), "score": current.score_of(player.id) if current else 0},
        },
        exclude=websocket,
    )
    if current:
        for message in current.catch_up_messages(player.id):
            await websocket.send_json(message)

    try:
        while True:
            try:
                data = json.loads(await websocket.receive_text())
            except ValueError:
                continue
            if isinstance(data, dict):
                await _handle_event(websocket, code, player, room, db, data)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(code, websocket)
        room_deleted = _leave_room(user, code, db)
        if not room_deleted and not manager.is_connected(code, player.id):
            await manager.broadcast(code, {"type": EventType.PLAYER_LEAVE, "payload": {"id": player.id}})
            current = game.get_game(code)
            if current:
                current.player_left(player.id)
        logger.info("%s left room %s", player.username, code)
