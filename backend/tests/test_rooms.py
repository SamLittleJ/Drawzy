import re

ROOM_SETTINGS = {"max_players": 4, "round_time": 60, "max_rounds": 3, "target_score": 100}


def test_creating_a_room_requires_authentication(client):
    assert client.post("/rooms/", json=ROOM_SETTINGS).status_code == 401


def test_create_room(create_user, create_room):
    owner = create_user()

    room = create_room(owner)

    assert re.fullmatch(r"[A-Z0-9]{6}", room["code"])
    assert room["creator_id"] == owner.id
    assert room["status"] == "open"
    assert room["player_count"] == 0


def test_room_settings_must_be_positive(client, create_user):
    owner = create_user()

    response = client.post("/rooms/", json=ROOM_SETTINGS | {"max_players": 0}, headers=owner.headers)

    assert response.status_code == 422


def test_only_public_rooms_are_listed(client, create_user, create_room):
    owner = create_user()
    public = create_room(owner, is_public=True)
    create_room(owner, is_public=False)

    codes = [room["code"] for room in client.get("/rooms/").json()]

    assert codes == [public["code"]]


def test_private_room_is_reachable_by_code(client, create_user, create_room):
    room = create_room(create_user(), is_public=False)

    assert client.get(f"/rooms/{room['code']}").json()["id"] == room["id"]


def test_unknown_room_returns_404(client):
    assert client.get("/rooms/NOPE00").status_code == 404


def test_creator_can_update_room(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner, is_public=True)

    response = client.put(
        f"/rooms/{room['code']}", json=ROOM_SETTINGS | {"max_players": 8, "is_public": False}, headers=owner.headers
    )

    assert response.status_code == 200
    assert response.json()["max_players"] == 8
    assert response.json()["is_public"] is False


def test_only_creator_can_update_or_delete_room(client, create_user, create_room):
    owner, stranger = create_user(), create_user()
    room = create_room(owner)

    assert client.put(f"/rooms/{room['code']}", json=ROOM_SETTINGS, headers=stranger.headers).status_code == 403
    assert client.delete(f"/rooms/{room['code']}", headers=stranger.headers).status_code == 403


def test_deleting_a_room_removes_its_rounds_and_messages(client, create_user, create_room):
    owner = create_user()
    room = create_room(owner)
    client.post("/rounds/", json={"room_id": room["id"], "theme": "cat"}, headers=owner.headers)
    client.post("/chat/", json={"room_id": room["id"], "message": "hi"}, headers=owner.headers)

    assert client.delete(f"/rooms/{room['code']}", headers=owner.headers).status_code == 204
    assert client.get(f"/rooms/{room['code']}").status_code == 404
    assert client.get("/rounds/", params={"room_id": room["id"]}).json() == []
    assert client.get("/chat/", params={"room_id": room["id"]}).json() == []
