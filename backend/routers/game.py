import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from fastapi import APIRouter, Depends
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

    # Choose a random theme and broadcast
    theme_obj = db.query(models.Theme).order_by(func.random()).first()
    theme = theme_obj.text if theme_obj else "No theme available"
    await manager.broadcast(room_code, {
        "type": "SHOW_THEME",
        "payload": {"theme": theme}
    })

    # Short reveal period before drawing starts
    await asyncio.sleep(5)

    # Broadcast round start with the configured duration
    await manager.broadcast(room_code, {
        "type": "ROUND_START",
        "payload": {"duration": room.round_time}
    })

    # Wait for the drawing phase to complete
    await asyncio.sleep(room.round_time)

    # End of round — notify clients
    await manager.broadcast(room_code, {
        "type": "ROUND_END"
    })

    # End of game sequence
    await manager.broadcast(room_code, {
        "type": "GAME_END"
    })

# WebSocket endpoint to start game explicitly if desired
@router.websocket("/game/{code}/start")
async def game_start(websocket: models.WebSocket, code: str, db: Session = Depends(get_db)):
    # This endpoint is optional — can be used to trigger run_game_loop via WS
    await websocket.accept()
    await manager.connect(code, websocket)
    await run_game_loop(code, db)
