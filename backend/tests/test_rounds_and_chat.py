"""REST endpoints for rounds and chat history."""

import pytest


@pytest.fixture
def game_round(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner)
    response = client.post("/rounds/", json={"room_id": room["id"], "theme": "a cat"}, headers=owner.headers)
    assert response.status_code == 201
    return owner, room, response.json()


def test_rounds_are_numbered_sequentially(client, game_round):
    owner, room, first = game_round

    second = client.post("/rounds/", json={"room_id": room["id"], "theme": "a dog"}, headers=owner.headers).json()

    assert (first["round_number"], second["round_number"]) == (1, 2)
    listed = client.get("/rounds/", params={"room_id": room["id"]}).json()
    assert [r["theme"] for r in listed] == ["a cat", "a dog"]


def test_only_room_creator_can_create_rounds(client, create_user, game_round):
    _, room, _ = game_round

    response = client.post("/rounds/", json={"room_id": room["id"], "theme": "x"}, headers=create_user().headers)

    assert response.status_code == 403


def test_chat_history_is_returned_in_order_with_room_code(client, create_user, create_room):
    user = create_user()
    room = create_room(user)
    for text in ("first", "second"):
        response = client.post("/chat/", json={"room_id": room["id"], "message": text}, headers=user.headers)
        assert response.status_code == 201

    messages = client.get("/chat/", params={"room_id": room["id"]}).json()

    assert [m["message"] for m in messages] == ["first", "second"]
    assert {m["room_code"] for m in messages} == {room["code"]}


def test_chat_message_requires_existing_room(client, create_user):
    response = client.post("/chat/", json={"room_id": 999, "message": "hi"}, headers=create_user().headers)

    assert response.status_code == 404
