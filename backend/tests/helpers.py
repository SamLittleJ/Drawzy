"""Helpers for driving room WebSockets in tests."""

from contextlib import contextmanager


def ws_url(room_code: str, user=None) -> str:
    return f"/ws/{room_code}?token={user.token}" if user else f"/ws/{room_code}"


def messages_until(ws, event_type: str, limit: int = 50) -> list[dict]:
    """Read messages up to and including the first one of the given type."""
    messages = []
    for _ in range(limit):
        messages.append(ws.receive_json())
        if messages[-1]["type"] == event_type:
            return messages
    raise AssertionError(f"no {event_type} message within {limit} messages: {[m['type'] for m in messages]}")


def receive_until(ws, event_type: str, limit: int = 50) -> dict:
    """Skip unrelated messages (joins, chat...) until one of the given type arrives."""
    return messages_until(ws, event_type, limit)[-1]


@contextmanager
def joined(client, room_code: str, user):
    """Connect a player to a room and consume the greeting (WELCOME + EXISTING_PLAYERS)."""
    with client.websocket_connect(ws_url(room_code, user)) as ws:
        assert ws.receive_json()["type"] == "WELCOME"
        assert ws.receive_json()["type"] == "EXISTING_PLAYERS"
        yield ws
