"""Server-driven draw-and-guess game.

Every round, each connected player takes one turn as the drawer. The drawer sees a secret word and sketches it on
the shared canvas while everyone else types guesses in the chat. A correct guess scores points (more for faster
guesses) and also rewards the drawer. The game ends after the last round, as soon as someone reaches the room's
target score, or when fewer than two players are left.
"""

import asyncio
import logging
import math
import random
import re
from dataclasses import dataclass, field

from backend import database, models
from backend.connection_manager import Player, manager
from backend.events import EventType
from backend.seed import DEFAULT_THEMES

logger = logging.getLogger(__name__)

MIN_PLAYERS = 2
# Pause after every turn so everyone can see the word and the scores.
TURN_END_PAUSE_SECONDS = 4
# Guessers earn 10-20 points depending on how quickly they guess; the drawer earns 5 per correct guess.
GUESS_BASE_POINTS = 10
GUESS_SPEED_BONUS = 10
DRAWER_POINTS_PER_GUESS = 5
# Strokes remembered per turn so that players joining mid-turn see the drawing so far.
MAX_STROKES_PER_TURN = 10_000


def normalize(text: str) -> str:
    """Ignore case, spacing and punctuation, so "Pirate-Ship" matches "pirate ship"."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def word_hint(word: str) -> str:
    """Hide the letters but keep the word's shape: "pirate ship" -> "______ ____"."""
    return re.sub(r"[A-Za-z0-9]", "_", word)


def guess_points(seconds_left: float, duration: float) -> int:
    speed = min(max(seconds_left / duration, 0.0), 1.0) if duration > 0 else 0.0
    return GUESS_BASE_POINTS + round(GUESS_SPEED_BONUS * speed)


@dataclass
class Turn:
    drawer: Player
    word: str
    duration: int
    ends_at: float  # event loop clock
    guessed: set[int] = field(default_factory=set)
    strokes: list[dict] = field(default_factory=list)
    over: asyncio.Event = field(default_factory=asyncio.Event)

    def seconds_left(self) -> float:
        return max(self.ends_at - asyncio.get_running_loop().time(), 0.0)


class Game:
    def __init__(self, room_code: str, max_rounds: int, turn_seconds: int, target_score: int, words: list[str]):
        self.room_code = room_code
        self.max_rounds = max_rounds
        self.turn_seconds = turn_seconds
        self.target_score = target_score
        self.words = words
        self.used_words: set[str] = set()
        self.scores: dict[int, int] = {}
        self.round = 0
        self.turn: Turn | None = None
        self.task: asyncio.Task | None = None

    # --- Called by the WebSocket handler ---

    def score_of(self, player_id: int) -> int:
        return self.scores.get(player_id, 0)

    def can_draw(self, player_id: int) -> bool:
        return self.turn is not None and self.turn.drawer.id == player_id

    def record_stroke(self, action: dict) -> None:
        if self.turn is None:
            return
        if action.get("tool") == "clear":
            self.turn.strokes.clear()
        elif len(self.turn.strokes) < MAX_STROKES_PER_TURN:
            self.turn.strokes.append(action)

    def catch_up_messages(self, player_id: int) -> list[dict]:
        """Everything a player joining mid-turn needs: the turn itself and the drawing so far."""
        if self.turn is None:
            return []
        return [
            self._turn_start_message(player_id),
            {"type": EventType.CANVAS_STATE, "payload": {"actions": list(self.turn.strokes)}},
        ]

    async def handle_chat(self, player: Player, text: str) -> bool:
        """Treat a chat message as a guess. Returns True if the game consumed it, so it must not be broadcast."""
        turn = self.turn
        if turn is None:
            return False

        if player.id == turn.drawer.id or player.id in turn.guessed:
            if normalize(turn.word) in normalize(text):
                await self._send_error(player.id, "No spoilers! You can't write the word in the chat.")
                return True
            return False

        if normalize(text) != normalize(turn.word):
            return False

        points = guess_points(turn.seconds_left(), turn.duration)
        turn.guessed.add(player.id)
        self.scores[player.id] = self.score_of(player.id) + points
        self.scores[turn.drawer.id] = self.score_of(turn.drawer.id) + DRAWER_POINTS_PER_GUESS
        await manager.broadcast(
            self.room_code,
            {
                "type": EventType.CORRECT_GUESS,
                "payload": {"player": player.to_dict(), "points": points, "scores": self._scores_payload()},
            },
        )
        await manager.send_to_player(
            self.room_code, player.id, {"type": EventType.WORD, "payload": {"word": turn.word}}
        )
        if self._everyone_guessed():
            turn.over.set()
        return True

    def player_left(self, player_id: int) -> None:
        turn = self.turn
        if turn is None or manager.is_connected(self.room_code, player_id):
            return
        drawer_left = player_id == turn.drawer.id
        if drawer_left or len(manager.players(self.room_code)) < MIN_PLAYERS or self._everyone_guessed():
            turn.over.set()

    # --- Game loop ---

    async def run(self) -> None:
        self._save(status="in_progress")
        try:
            await self._play_rounds()
            await manager.broadcast(self.room_code, {"type": EventType.GAME_END, "payload": self._results()})
        except asyncio.CancelledError:
            logger.info("Game in room %s was cancelled", self.room_code)
            raise
        finally:
            self.turn = None
            self._save(status="open")

    async def _play_rounds(self) -> None:
        for round_number in range(1, self.max_rounds + 1):
            self.round = round_number
            # Everyone connected when the round starts draws once; late joiners start drawing next round.
            for drawer in manager.players(self.room_code):
                if len(manager.players(self.room_code)) < MIN_PLAYERS:
                    return
                if not manager.is_connected(self.room_code, drawer.id):
                    continue
                await self._play_turn(drawer)
                self._save()
                await asyncio.sleep(TURN_END_PAUSE_SECONDS)
                if max(self.scores.values(), default=0) >= self.target_score:
                    return

    async def _play_turn(self, drawer: Player) -> None:
        ends_at = asyncio.get_running_loop().time() + self.turn_seconds
        self.turn = turn = Turn(drawer=drawer, word=self._pick_word(), duration=self.turn_seconds, ends_at=ends_at)
        for player in manager.players(self.room_code):
            await manager.send_to_player(self.room_code, player.id, self._turn_start_message(player.id))

        try:
            await asyncio.wait_for(turn.over.wait(), timeout=turn.duration)
        except TimeoutError:
            pass

        self.turn = None
        await manager.broadcast(
            self.room_code,
            {"type": EventType.TURN_END, "payload": {"word": turn.word, "scores": self._scores_payload()}},
        )

    # --- Helpers ---

    def _pick_word(self) -> str:
        fresh = [word for word in self.words if word not in self.used_words] or self.words
        word = random.choice(fresh)
        self.used_words.add(word)
        return word

    def _everyone_guessed(self) -> bool:
        turn = self.turn
        guessers = [p.id for p in manager.players(self.room_code) if p.id != turn.drawer.id]
        return bool(guessers) and all(player_id in turn.guessed for player_id in guessers)

    def _turn_start_message(self, player_id: int) -> dict:
        turn = self.turn
        payload = {
            "round": self.round,
            "maxRounds": self.max_rounds,
            "drawer": turn.drawer.to_dict(),
            "duration": turn.duration,
            "timeLeft": math.ceil(turn.seconds_left()),
            "hint": word_hint(turn.word),
            "guessed": sorted(turn.guessed),
            "scores": self._scores_payload(),
        }
        if player_id == turn.drawer.id or player_id in turn.guessed:
            payload["word"] = turn.word
        return {"type": EventType.TURN_START, "payload": payload}

    def _scores_payload(self) -> list[dict]:
        return [{"id": p.id, "score": self.score_of(p.id)} for p in manager.players(self.room_code)]

    def _results(self) -> dict:
        leaderboard = sorted(
            ({**p.to_dict(), "score": self.score_of(p.id)} for p in manager.players(self.room_code)),
            key=lambda entry: entry["score"],
            reverse=True,
        )
        best = leaderboard[0]["score"] if leaderboard else 0
        winners = [entry["id"] for entry in leaderboard if entry["score"] == best] if best > 0 else []
        return {"leaderboard": leaderboard, "winners": winners}

    async def _send_error(self, player_id: int, message: str) -> None:
        await manager.send_to_player(
            self.room_code, player_id, {"type": EventType.ERROR, "payload": {"message": message}}
        )

    def _save(self, status: str | None = None) -> None:
        """Persist the scores, and optionally the room status. The room is gone if everyone left."""
        with database.SessionLocal() as db:
            room = db.query(models.Room).filter(models.Room.code == self.room_code).first()
            if room is None:
                return
            if status is not None:
                room.status = status
            for room_player in room.room_players:
                room_player.score = self.score_of(room_player.user_id)
            db.commit()


_games: dict[str, Game] = {}


def get_game(room_code: str) -> Game | None:
    return _games.get(room_code)


def start_game(room_code: str) -> str | None:
    """Start a game in the background. Returns the reason when it can't be started."""
    if room_code in _games:
        return "A game is already running in this room."
    if len(manager.players(room_code)) < MIN_PLAYERS:
        return f"At least {MIN_PLAYERS} players are needed to start a game."

    with database.SessionLocal() as db:
        room = db.query(models.Room).filter(models.Room.code == room_code).first()
        if room is None:
            return "This room does not exist anymore."
        words = [theme.text for theme in db.query(models.Theme)] or list(DEFAULT_THEMES)
        game = Game(room_code, room.max_rounds, room.round_time, room.target_score, words)

    _games[room_code] = game
    game.task = asyncio.create_task(game.run())
    game.task.add_done_callback(lambda _: _forget(game))
    return None


def stop_game(room_code: str) -> None:
    game = _games.get(room_code)
    if game is not None and game.task is not None:
        game.task.cancel()


def _forget(game: Game) -> None:
    if _games.get(game.room_code) is game:
        del _games[game.room_code]
