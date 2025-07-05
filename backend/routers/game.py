import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from fastapi import APIRouter, Depends, WebSocket
from backend.database import get_db
from backend.routers.game_ws_manager import manager
from backend import models

router = APIRouter(tags=["Game"])

async def run_game_loop(room_code: str, db: Session):
    # Fetch room and mark as in-progress
    room = db.query(models.Room).filter(models.Room.code == room_code).first()
    if not room:
        return
    room.status = "in_progress"
    db.commit()
    max_rounds = room.max_rounds
    round_time = room.round_time

    # Loop through each round
    for current_round in range(1, max_rounds + 1):
        # Choose and broadcast theme
        theme_obj = db.query(models.Theme).order_by(func.random()).first()
        theme = theme_obj.text if theme_obj else f"Round {current_round}"
        await manager.broadcast(room_code, {
            "type": "SHOW_THEME",
            "payload": {"theme": theme}
        })

        # Short reveal period before drawing
        await asyncio.sleep(5)

        # Broadcast round start with duration and round info
        await manager.broadcast(room_code, {
            "type": "ROUND_START",
            "payload": {
                "duration": round_time,
                "round": current_round,
                "maxRounds": max_rounds
            }
        })

        # Wait for drawing phase
        await asyncio.sleep(round_time)

        # End of this round
        await manager.broadcast(room_code, {
            "type": "ROUND_END",
            "payload": {"round": current_round}
        })

        # Optionally break if game-end condition met (e.g., target score)

    # After all rounds, broadcast game end
    await manager.broadcast(room_code, {
        "type": "GAME_END"
    })

# WebSocket endpoint to start game explicitly if desired
@router.websocket("/game/{code}/start")
async def game_start(websocket: WebSocket, code: str, db: Session = Depends(get_db)):
    # This endpoint is optional — can be used to trigger run_game_loop via WS
    await websocket.accept()
    await manager.connect(code, websocket)
    await run_game_loop(code, db)
