def test_health_check(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_register_returns_public_profile(client):
    response = client.post("/users/", json={"username": "ana", "email": "ana@example.com", "password": "secret"})

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "ana"
    assert body["role"] == "user"
    assert "password" not in body and "hashed_password" not in body


def test_register_rejects_duplicate_email(client, create_user):
    user = create_user()

    response = client.post("/users/", json={"username": "other", "email": user.email, "password": "secret"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_register_rejects_duplicate_username(client, create_user):
    user = create_user()

    response = client.post("/users/", json={"username": user.username, "email": "new@example.com", "password": "x"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already taken"


def test_register_validates_email(client):
    response = client.post("/users/", json={"username": "ana", "email": "not-an-email", "password": "secret"})

    assert response.status_code == 422


def test_login_and_fetch_current_user(client, create_user):
    user = create_user()

    response = client.get("/users/me", headers=user.headers)

    assert response.status_code == 200
    assert response.json()["email"] == user.email


def test_login_with_wrong_password_is_rejected(client, create_user):
    user = create_user()

    response = client.post("/users/login", json={"email": user.email, "password": "wrong"})

    assert response.status_code == 401


def test_protected_endpoints_require_a_valid_token(client):
    assert client.get("/users/me").status_code == 401
    assert client.get("/users/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_user_can_update_own_profile_and_password(client, create_user):
    user = create_user()

    response = client.put(
        f"/users/{user.id}", json={"username": "renamed", "password": "new-password"}, headers=user.headers
    )

    assert response.status_code == 200
    assert response.json()["username"] == "renamed"
    assert client.post("/users/login", json={"email": user.email, "password": "new-password"}).status_code == 200


def test_role_cannot_be_escalated_through_profile_update(client, create_user):
    user = create_user()

    response = client.put(f"/users/{user.id}", json={"role": "admin"}, headers=user.headers)

    assert response.status_code == 200
    assert response.json()["role"] == "user"


def test_user_cannot_modify_someone_else(client, create_user):
    alice, bob = create_user(), create_user()

    assert client.put(f"/users/{bob.id}", json={"username": "hacked"}, headers=alice.headers).status_code == 403
    assert client.delete(f"/users/{bob.id}", headers=alice.headers).status_code == 403


def test_update_rejects_username_taken_by_someone_else(client, create_user):
    alice, bob = create_user(), create_user()

    response = client.put(f"/users/{alice.id}", json={"username": bob.username}, headers=alice.headers)

    assert response.status_code == 400


def test_user_can_delete_own_account(client, create_user, create_room):
    user = create_user()
    create_room(user)

    assert client.delete(f"/users/{user.id}", headers=user.headers).status_code == 204
    assert client.post("/users/login", json={"email": user.email, "password": user.password}).status_code == 401
    assert client.get("/rooms/").json() == []
