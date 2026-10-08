import pytest
from starlette.websockets import WebSocketDisconnect

from backend.seed import DEFAULT_THEMES


def ws_url(room_code, user=None):
    url = f"/ws/{room_code}"
    return f"{url}?token={user.token}" if user else url


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

    with client.websocket_connect(ws_url(room["code"], owner)) as first:
        first.receive_json()  # roster
        with client.websocket_connect(ws_url(room["code"], create_user())) as second:
            with pytest.raises(WebSocketDisconnect) as exc:
                second.receive_json()

    assert exc.value.code == 4403


def test_joining_player_receives_roster_and_others_are_notified(client, create_user, room_with_owner):
    owner, room = room_with_owner
    guest = create_user("guest")

    with client.websocket_connect(ws_url(room["code"], owner)) as owner_ws:
        assert owner_ws.receive_json() == {
            "type": "EXISTING_PLAYERS",
            "payload": [{"id": owner.id, "username": "owner", "score": 0}],
        }

        with client.websocket_connect(ws_url(room["code"], guest)) as guest_ws:
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

    with client.websocket_connect(ws_url(room["code"], owner)) as owner_ws:
        owner_ws.receive_json()
        with client.websocket_connect(ws_url(room["code"], create_user("guest"))) as guest_ws:
            guest_ws.receive_json()
            owner_ws.receive_json()  # PLAYER_JOIN

            guest_ws.send_json({"type": "CHAT", "payload": {"message": "  hello  "}})

            expected = {"type": "CHAT", "payload": {"user": "guest", "message": "hello"}}
            assert owner_ws.receive_json() == expected
            assert guest_ws.receive_json() == expected


def test_malformed_and_empty_messages_are_ignored(client, room_with_owner):
    owner, room = room_with_owner

    with client.websocket_connect(ws_url(room["code"], owner)) as ws:
        ws.receive_json()
        ws.send_text("not json")
        ws.send_json(["not", "an", "object"])
        ws.send_json({"type": "CHAT", "payload": {"message": "   "}})
        ws.send_json({"type": "CHAT", "payload": {"message": "still alive"}})

        assert ws.receive_json()["payload"]["message"] == "still alive"


def test_strokes_are_relayed_to_other_players_only(client, create_user, room_with_owner):
    owner, room = room_with_owner
    stroke = {"tool": "brush", "from": {"x": 1, "y": 2}, "to": {"x": 3, "y": 4}, "color": "#ff0000", "size": 5}

    with client.websocket_connect(ws_url(room["code"], owner)) as owner_ws:
        owner_ws.receive_json()
        with client.websocket_connect(ws_url(room["code"], create_user("guest"))) as guest_ws:
            guest_ws.receive_json()
            owner_ws.receive_json()

            owner_ws.send_json({"type": "DRAW", "payload": stroke})
            owner_ws.send_json({"type": "CHAT", "payload": {"message": "done"}})

            assert guest_ws.receive_json() == {"type": "DRAW", "payload": stroke}
            # The sender's next message is the chat, proving the stroke wasn't echoed back.
            assert owner_ws.receive_json()["type"] == "CHAT"


def test_leaving_player_is_announced_and_removed(client, create_user, room_with_owner):
    owner, room = room_with_owner
    guest = create_user("guest")

    with client.websocket_connect(ws_url(room["code"], owner)) as owner_ws:
        owner_ws.receive_json()
        with client.websocket_connect(ws_url(room["code"], guest)) as guest_ws:
            guest_ws.receive_json()
            owner_ws.receive_json()

        assert owner_ws.receive_json() == {"type": "PLAYER_LEAVE", "payload": {"id": guest.id}}
        assert client.get(f"/rooms/{room['code']}").json()["player_count"] == 1


def test_room_is_deleted_when_last_player_leaves(client, room_with_owner):
    owner, room = room_with_owner

    with client.websocket_connect(ws_url(room["code"], owner)) as ws:
        ws.receive_json()

    assert client.get(f"/rooms/{room['code']}").status_code == 404


def test_game_runs_every_round_and_ends(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner, max_rounds=2, round_time=1)

    with client.websocket_connect(ws_url(room["code"], owner)) as ws:
        ws.receive_json()
        ws.send_json({"type": "START_GAME"})
        ws.send_json({"type": "START_GAME"})  # a second start must not launch a parallel game

        events = [ws.receive_json() for _ in range(7)]

        assert [e["type"] for e in events] == ["SHOW_THEME", "ROUND_START", "ROUND_END"] * 2 + ["GAME_END"]
        assert events[0]["payload"]["theme"] in DEFAULT_THEMES
        assert events[4]["payload"] == {"duration": 1, "round": 2, "maxRounds": 2}

        ws.send_json({"type": "CHAT", "payload": {"message": "gg"}})
        assert ws.receive_json()["type"] == "CHAT"  # no stray events from a duplicate game
        assert client.get(f"/rooms/{room['code']}").json()["status"] == "open"
