"""Server-driven game loop: picks a theme, runs a timed drawing phase, repeats for every round."""

import asyncio
import logging

from sqlalchemy import func

from backend import database, models
from backend.connection_manager import manager

logger = logging.getLogger(__name__)

# Pause between revealing the theme and starting the drawing timer.
THEME_REVEAL_SECONDS = 5

_running_games: dict[str, asyncio.Task] = {}


def is_game_running(room_code: str) -> bool:
    return room_code in _running_games


def start_game(room_code: str) -> bool:
    """Start the game loop for a room in the background. Returns False if one is already running."""
    if is_game_running(room_code):
        return False
    task = asyncio.create_task(run_game_loop(room_code))
    _running_games[room_code] = task
    task.add_done_callback(lambda _: _running_games.pop(room_code, None))
    return True


def stop_game(room_code: str) -> None:
    task = _running_games.get(room_code)
    if task is not None:
        task.cancel()


def _set_room_status(db, room_code: str, status: str) -> models.Room | None:
    room = db.query(models.Room).filter(models.Room.code == room_code).first()
    if room is not None:
        room.status = status
        db.commit()
    return room


async def run_game_loop(room_code: str) -> None:
    with database.SessionLocal() as db:
        room = _set_room_status(db, room_code, "in_progress")
        if room is None:
            return
        max_rounds, round_time = room.max_rounds, room.round_time

        try:
            for current_round in range(1, max_rounds + 1):
                theme = db.query(models.Theme).order_by(func.random()).first()
                await manager.broadcast(
                    room_code,
                    {
                        "type": "SHOW_THEME",
                        "payload": {"theme": theme.text if theme else f"Round {current_round}"},
                    },
                )
                await asyncio.sleep(THEME_REVEAL_SECONDS)

                await manager.broadcast(
                    room_code,
                    {
                        "type": "ROUND_START",
                        "payload": {"duration": round_time, "round": current_round, "maxRounds": max_rounds},
                    },
                )
                await asyncio.sleep(round_time)

                await manager.broadcast(room_code, {"type": "ROUND_END", "payload": {"round": current_round}})

            await manager.broadcast(room_code, {"type": "GAME_END"})
        except asyncio.CancelledError:
            logger.info("Game in room %s was cancelled", room_code)
            raise
        finally:
            # The room may already be gone if every player left mid-game.
            _set_room_status(db, room_code, "open")
