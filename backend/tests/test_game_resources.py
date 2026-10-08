"""Rounds, drawings, votes and chat history."""

import pytest


@pytest.fixture
def game_round(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner)
    response = client.post("/rounds/", json={"room_id": room["id"], "theme": "a cat"}, headers=owner.headers)
    assert response.status_code == 201
    return owner, room, response.json()


def _submit_drawing(client, user, round_id):
    response = client.post(
        "/drawings/", json={"round_id": round_id, "url": "https://cdn.example.com/d.png"}, headers=user.headers
    )
    assert response.status_code == 201, response.text
    return response.json()


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


def test_drawing_requires_existing_round(client, create_user):
    response = client.post(
        "/drawings/", json={"round_id": 999, "url": "https://cdn.example.com/d.png"}, headers=create_user().headers
    )

    assert response.status_code == 404


def test_only_author_can_delete_drawing(client, create_user, game_round):
    owner, _, rnd = game_round
    drawing = _submit_drawing(client, owner, rnd["id"])

    assert client.delete(f"/drawings/{drawing['id']}", headers=create_user().headers).status_code == 403
    assert client.delete(f"/drawings/{drawing['id']}", headers=owner.headers).status_code == 204
    assert client.get(f"/drawings/{drawing['id']}").status_code == 404


def test_vote_is_stored_with_its_score(client, create_user, game_round):
    owner, _, rnd = game_round
    drawing = _submit_drawing(client, owner, rnd["id"])
    voter = create_user()

    response = client.post("/votes/", json={"drawing_id": drawing["id"], "score": 4}, headers=voter.headers)

    assert response.status_code == 201
    assert response.json() == {"voter_id": voter.id, "drawing_id": drawing["id"], "score": 4}


def test_single_vote_lookup_uses_drawing_then_voter(client, create_user, game_round):
    owner, _, rnd = game_round
    drawing = _submit_drawing(client, owner, rnd["id"])
    voter = create_user()
    client.post("/votes/", json={"drawing_id": drawing["id"], "score": 5}, headers=voter.headers)

    response = client.get(f"/votes/{drawing['id']}/{voter.id}")

    assert response.status_code == 200
    assert response.json()["score"] == 5


def test_cannot_vote_for_own_drawing(client, game_round):
    owner, _, rnd = game_round
    drawing = _submit_drawing(client, owner, rnd["id"])

    response = client.post("/votes/", json={"drawing_id": drawing["id"], "score": 5}, headers=owner.headers)

    assert response.status_code == 400


def test_cannot_vote_twice(client, create_user, game_round):
    owner, _, rnd = game_round
    drawing = _submit_drawing(client, owner, rnd["id"])
    voter = create_user()
    client.post("/votes/", json={"drawing_id": drawing["id"], "score": 3}, headers=voter.headers)

    response = client.post("/votes/", json={"drawing_id": drawing["id"], "score": 5}, headers=voter.headers)

    assert response.status_code == 400
    assert [v["score"] for v in client.get("/votes/", params={"drawing_id": drawing["id"]}).json()] == [3]


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
