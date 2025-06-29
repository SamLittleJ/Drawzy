import json
from enum import Enum
import asyncio
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import random

from backend.database import get_db
from backend.routers.ws import manager
from backend.models import Room, Round, Drawing, DrawingVote, RoomPlayer, Theme
from backend.dependencies import get_current_user

router = APIRouter(tags=["Game"])

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
    
async def wait_for_type(websocket: WebSocket, event_type: EventType) -> Dict[str, Any]:
    while True:
        msg = await websocket.receive_json()
        if msg.get("type") == event_type.value:
            return msg
        
async def run_game_loop(room_code: str, db: Session, websocket: WebSocket):
    
    room: Room = db.query(Room).filter_by(code=room_code).one()
    room.status = "in_progress"
    db.commit()
    
    max_rounds = room.max_rounds
    round_time = room.round_time
    target_score = room.target_score
    
    scoreboard = []
    
    for round_number in range(1, max_rounds + 1):
        themes = db.query(Theme).all()
        if themes:
            theme = random.choice(themes).text
        else:
            theme =f"Draw theme for round {round_number}"
        print(f"Starting round {round_number} with theme: {theme}")
        await manager.broadcast(room_code, {
            "type": EventType.SHOW_THEME.value,
            "payload": {"theme": theme}
        })
        await asyncio.sleep(5)
        
        await manager.broadcast(room_code, {
            "type": EventType.ROUND_START.value,
            "payload": {"duration": round_time}
        })
        await asyncio.sleep(round_time)
        
        drawings = db.query(Drawing).filter_by(room_id=room.id, round_number=round_number).all()
        
        for drawing in drawings:
            await manager.broadcast(room_code, {
                "type": EventType.SHOW_DRAWING.value,
                "payload": {"drawing_id": drawing.id, "url": drawing.url}
            })
            
            votes_needed = db.query(RoomPlayer).filter_by(room_id=room.id).count()
            votes = []
            while len(votes) < votes_needed:
                vote_msg = await wait_for_type(websocket, EventType.VOTE)
                score = vote_msg["payload"]["score"]
                voter_id = vote_msg["payload"]["voter_id"]
                votes.append(score)
                
                dv = DrawingVote(
                    voter_id=voter_id,
                    drawing_id=drawing.id,
                    score=score,
                    voted_at= datetime.now()
                )
                db.add(dv)
                db.commit()
            
            avg_score = sum(votes) / len(votes)
            drawing.score = avg_score
            db.commit()
                
            await manager.broadcast(room_code, {
                "type": EventType.VOTE_RESULT.value,
                "payload": {"drawing_id": drawing.id, "avg_score": avg_score}
            })
            await asyncio.sleep(10)
        
        players = db.query(RoomPlayer).filter_by(room_id=room.id).all()
        scoreboard = [
            {"user": p.user.username, "score": p.score}
            for p in sorted(players, key=lambda p: p.score, reverse=True)
        ]
        await manager.broadcast(room_code, {
            "type": EventType.ROUND_END.value,
            "payload": {"scoreboard": scoreboard}
        })
        
        if any(p.score >= target_score for p in players):
            break
    
    await manager.broadcast(room_code, {
      "type": EventType.GAME_END.value,
      "payload": {"final_scores": scoreboard}  
    })
    
@router.websocket("/game/ws/{room_code}")
async def game_ws(websocket:WebSocket, room_code:str, db: Session = Depends(get_db)):
    await websocket.accept()
    token = websocket.query_params.get("token")
    user = get_current_user(token, db)
    if not user:
        await websocket.close()
        return
    
    await manager.connect(room_code, websocket)
    print(f"connected socket for {room_code}: {len(manager.active_connections.get(room_code, []))}") 
    print(f"game_ws accepted, room_code={room_code}")
    print("Waiting for start game event...")
    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") == EventType.START_GAME.value:
                print(f"Starting game for room {room_code}")
                asyncio.create_task(run_game_loop(room_code, db, websocket))
            elif msg.get("type") == EventType.PLAYER_JOIN.value:
                await manager.broadcast(room_code, msg)
    except WebSocketDisconnect:
        if websocket in manager.active_connections.get(room_code, []):
            manager.disconnect(room_code, websocket)
        print(f"Disconnected ws for room_code {room_code}")