from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.dependencies import get_current_user
from backend.database import get_db
from sqlalchemy.orm import Session
import logging
from backend.models import Room

import json, asyncio, random
from datetime import datetime
from enum import Enum
from typing import Dict, Any
from sqlalchemy.orm  import Session
from sqlalchemy import func
from backend.models import Room, Round, Drawing, DrawingVote, RoomPlayer, Theme
from backend.database import get_db 
from backend.routers.game_ws_manager import manager

logger = logging.getLogger("ws")
logging.basicConfig(level=logging.INFO)

router = APIRouter(tags=["WebSocket"])
class EventType(str, Enum):
    PLAYER_JOIN = "PLAYER_JOIN"
    START_GAME = "START_GAME"
    SHOW_THEME = "SHOW_THEME"
    ROUND_START = "ROUND_START"
    SHOW_DRAWING = "SHOW_DRAWING"
    VOTE = "VOTE"
    VOTE_RESULT = "VOTE_RESULT"
    ROUND_END = "ROUND_END"
    GAME_END = "GAME_END"
    
        
async def run_game_loop(room_code: str, db: Session, vote_queue: asyncio.Queue):
    logger.info(f"Starting game loop for room={room_code}")
    room = db.query(Room).filter(Room.code == room_code).first()
    if not room:
        logger.warning(f"Room {room_code} not found during game loop start")
        return
    
    players = db.query(RoomPlayer).filter(RoomPlayer.room_id == room.id).all()
    player_ids = [p.user_id for p in players]
    player_usernames = [p.username for p in players]
    num_players = len(player_ids)
    if num_players == 0:
        logger.warning(f"No players found for room={room_code}, cannot start game")
        return
    
    themes = db.query(Theme).order_by(func.random()).all()
    if not themes:
        logger.warning(f"No themes available for room={room_code}, cannot start game")
        return
    theme_texts = [theme.text for theme in themes]
    
    for round_num, (player_id, username, theme_text) in enumerate(zip(player_ids, player_usernames, theme_texts), start=1):
        logger.info(f"Starting round {round_num} for player={username} in room={room_code}, theme={theme_text}")
        new_round = Round(
            room_id=room.id,
            round_number=round_num,
            theme=theme_text,
            drawer_id=player_id,
            started_at=datetime.now(),
        )
        db.add(new_round)
        db.commit()
        db.refresh(new_round)
        
        await manager.broadcast(room_code, {
          "type": EventType.ROUND_START.value,
          "payload": {
              "round": round_num,
              "drawer": username,
              "theme_for_drawing": theme_text,
          }  
        })
        
        await asyncio.sleep(room.round_time)
        
        drawing = Drawing(
            round_id=new_round.id,
            user_id=player_id,
            url=f"https://example.com/drawings/{round_num}.png"  # Placeholder URL
        )
        db.add(drawing)
        db.commit()
        db.refresh(drawing)
        
        await manager.broadcast(room_code, {
            "type": EventType.SHOW_DRAWING.value,
            "payload": {
                "round": round_num,
                "drawer": username,
                "url": drawing.url
            }
        })
        
        await asyncio.sleep(15)
        
        votes = []
        votes_needed = num_players - 1
        
        while len(votes) < votes_needed:
            vote_payload = await vote_queue.get()
            score = vote_payload["score"]
            voter_id = vote_payload["voter_id"]
            if voter_id != player_id:  # Ensure drawer doesn't vote for their own drawing
                vote = DrawingVote(
                    drawing_id=drawing.id,
                    user_id=voter_id,
                    vote=score
                )
                db.add(vote)
                votes.append(vote)
        db.commit()
        
        await manager.broadcast(room_code, {
            "type": EventType.VOTE_RESULT.value,
            "payload": {
                "votes": len(votes),
                "drawer": username,
                }
        })
        
        await manager.broadcast(room_code, {
            "type": EventType.ROUND_END.value,
            "payload": {
                "round": round_num,
            }
        })
        
    await manager.broadcast(room_code, {
        "type": EventType.GAME_END.value,
        "payload": {
            "message": "Game OVER!"
        }
    })
        
@router.websocket("/ws/{code}")
async def websocket_chat(
    websocket: WebSocket,
    code: str,
    db: Session = Depends(get_db)
):
    print(f"WS connect attemp: room={code}, client={websocket.client}")
    token = websocket.query_params.get("token")
    
    await websocket.accept()
    
    try:
        user = get_current_user(token, db)
        print(f"WS user={user.username} authenticated for room={code}")
    except Exception as e:
        logger.error(f"WS connection failed for room={code}: {e}")
        await websocket.close(code=1008, reason="auth error")
        return
    print(f"WS user={user.username} connected to room={code}")
    await manager.connect(code, websocket)
    print(f"WS manager connected for room={code}, user={user.username}")
    vote_queue: asyncio.Queue = asyncio.Queue()
    logger.info(f"Unified WS connected for room={code}, user={user.username}")
    
    try:
        print(f"WS handler loop start for room={code}")
        while True:
            print(f"WS waiting for message in room={code}, user={user.username}")
            try:
                print(f"WS receiving JSON for room={code}, user={user.username}")
                data = await websocket.receive_json()
                print(f"WS received data: {data} for room={code}, user={user.username}")
            except WebSocketDisconnect:
                manager.disconnect(code, websocket)
                logger.info(f"WS disconnected for room={code}, user={user.username}")
                if not manager.active_connections.get(code):
                    db.query(Room).filter(Room.code == code).delete()
                    db.commit()
                break
            except Exception as e:
                logger.warning(f"Ignoring non-JSON message or parsing error: {e}")
                continue
            
            msg_type = data.get("type")
            payload = data.get("payload", {})

            if msg_type == EventType.PLAYER_JOIN.value:
                # Server-side player join: broadcast user info
                await manager.broadcast(code, {
                    "type": EventType.PLAYER_JOIN.value,
                    "payload": {
                        "id": user.id,
                        "username": user.username,
                        "avatarUrl": getattr(user, "avatar_url", None)
                    }
                })
            elif msg_type == "CHAT":
                await manager.broadcast(code, {"type":"CHAT", "payload":{"user":user.username, "message":payload.get("message","")}})
            elif msg_type == "DRAW":
                await manager.broadcast(code, {"type":"DRAW", "payload":payload})
            elif msg_type == EventType.START_GAME.value:
                # STUB: broadcast a SHOW_THEME event for testing instead of full game loop
                await manager.broadcast(code, {
                    "type": EventType.SHOW_THEME.value,
                    "payload": { "theme": "Stub Theme: Test Round" }
                })
            elif msg_type == EventType.VOTE.value:
                # enqueue votes for game loop
                await vote_queue.put(payload)
            else:
                logger.warning(f"Unknown message type {msg_type} in chat WS")
    except Exception as e:
        logger.exception(f"Unexpected error in room={code}")
        await websocket.close(code=1011)