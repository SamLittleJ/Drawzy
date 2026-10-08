"""Names of the events exchanged over the room WebSocket. Every message is `{"type": ..., "payload": ...}`."""

from enum import StrEnum


class EventType(StrEnum):
    # Sent by clients
    GET_EXISTING_PLAYERS = "GET_EXISTING_PLAYERS"
    CHAT = "CHAT"  # also how players submit guesses
    DRAW = "DRAW"  # only accepted from the current drawer
    START_GAME = "START_GAME"

    # Room presence and chat
    WELCOME = "WELCOME"  # tells a client which player it is
    EXISTING_PLAYERS = "EXISTING_PLAYERS"
    PLAYER_JOIN = "PLAYER_JOIN"
    PLAYER_LEAVE = "PLAYER_LEAVE"
    ERROR = "ERROR"  # sent to one client only

    # Game flow
    TURN_START = "TURN_START"  # the drawer's copy includes the secret word
    WORD = "WORD"  # reveals the word to a player who just guessed it
    CORRECT_GUESS = "CORRECT_GUESS"
    CANVAS_STATE = "CANVAS_STATE"  # strokes so far, for players joining mid-turn
    TURN_END = "TURN_END"
    GAME_END = "GAME_END"
