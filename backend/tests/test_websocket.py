"""Room presence and chat over the WebSocket, outside of a game."""

import pytest
from starlette.websockets import WebSocketDisconnect

from backend.tests.helpers import joined, messages_until, receive_until, ws_url


@pytest.fixture
def room_with_owner(create_user, create_room):
    owner = create_user("owner")
    return owner, create_room(owner)


def test_connection_without_token_is_rejected(client, room_with_owner):
    _, room = room_with_owner

    with client.websocket_connect(ws_url(room["code"])) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_json()

    assert exc.value.code == 4401


def test_connection_to_unknown_room_is_rejected(client, create_user):
    with client.websocket_connect(ws_url("NOPE00", create_user())) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_json()

    assert exc.value.code == 4404


def test_full_room_rejects_new_players(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner, max_players=1)

    with joined(client, room["code"], owner):
        with client.websocket_connect(ws_url(room["code"], create_user())) as second:
            with pytest.raises(WebSocketDisconnect) as exc:
                second.receive_json()

    assert exc.value.code == 4403


def test_joining_player_is_greeted_and_others_are_notified(client, create_user, room_with_owner):
    owner, room = room_with_owner
    guest = create_user("guest")

    with client.websocket_connect(ws_url(room["code"], owner)) as owner_ws:
        assert owner_ws.receive_json() == {"type": "WELCOME", "payload": {"id": owner.id, "username": "owner"}}
        assert owner_ws.receive_json() == {
            "type": "EXISTING_PLAYERS",
            "payload": [{"id": owner.id, "username": "owner", "score": 0}],
        }

        with client.websocket_connect(ws_url(room["code"], guest)) as guest_ws:
            assert guest_ws.receive_json()["type"] == "WELCOME"
            roster = guest_ws.receive_json()
            assert roster["type"] == "EXISTING_PLAYERS"
            assert [p["username"] for p in roster["payload"]] == ["owner", "guest"]

            assert owner_ws.receive_json() == {
                "type": "PLAYER_JOIN",
                "payload": {"id": guest.id, "username": "guest", "score": 0},
            }
            assert client.get(f"/rooms/{room['code']}").json()["player_count"] == 2


def test_chat_is_broadcast_to_everyone(client, create_user, room_with_owner):
    owner, room = room_with_owner

    with (
        joined(client, room["code"], owner) as owner_ws,
        joined(client, room["code"], create_user("guest")) as guest_ws,
    ):
        guest_ws.send_json({"type": "CHAT", "payload": {"message": "  hello  "}})

        expected = {"type": "CHAT", "payload": {"user": "guest", "message": "hello"}}
        assert receive_until(owner_ws, "CHAT") == expected
        assert receive_until(guest_ws, "CHAT") == expected


def test_malformed_and_empty_messages_are_ignored(client, room_with_owner):
    owner, room = room_with_owner

    with joined(client, room["code"], owner) as ws:
        ws.send_text("not json")
        ws.send_json(["not", "an", "object"])
        ws.send_json({"type": "CHAT", "payload": ["not", "an", "object"]})
        ws.send_json({"type": "CHAT", "payload": {"message": "   "}})
        ws.send_json({"type": "CHAT", "payload": {"message": "still alive"}})

        assert ws.receive_json()["payload"]["message"] == "still alive"


def test_strokes_are_ignored_outside_a_game(client, create_user, room_with_owner):
    owner, room = room_with_owner
    stroke = {"tool": "brush", "from": {"x": 1, "y": 2}, "to": {"x": 3, "y": 4}, "color": "#ff0000", "size": 5}

    with (
        joined(client, room["code"], owner) as owner_ws,
        joined(client, room["code"], create_user("guest")) as guest_ws,
    ):
        owner_ws.send_json({"type": "DRAW", "payload": stroke})
        owner_ws.send_json({"type": "CHAT", "payload": {"message": "done"}})

        assert [m["type"] for m in messages_until(guest_ws, "CHAT")] == ["CHAT"]


def test_leaving_player_is_announced_and_removed(client, create_user, room_with_owner):
    owner, room = room_with_owner
    guest = create_user("guest")

    with joined(client, room["code"], owner) as owner_ws:
        with joined(client, room["code"], guest):
            receive_until(owner_ws, "PLAYER_JOIN")

        assert owner_ws.receive_json() == {"type": "PLAYER_LEAVE", "payload": {"id": guest.id}}
        assert client.get(f"/rooms/{room['code']}").json()["player_count"] == 1


def test_closing_one_of_two_tabs_keeps_the_player_in_the_room(client, create_user, room_with_owner):
    owner, room = room_with_owner
    guest = create_user("guest")

    with joined(client, room["code"], owner) as owner_ws, joined(client, room["code"], guest):
        with joined(client, room["code"], guest):
            pass

        owner_ws.send_json({"type": "CHAT", "payload": {"message": "still here?"}})
        assert "PLAYER_LEAVE" not in [m["type"] for m in messages_until(owner_ws, "CHAT")]
        assert client.get(f"/rooms/{room['code']}").json()["player_count"] == 2


def test_room_is_deleted_when_last_player_leaves(client, room_with_owner):
    owner, room = room_with_owner

    with joined(client, room["code"], owner):
        pass

    assert client.get(f"/rooms/{room['code']}").status_code == 404
