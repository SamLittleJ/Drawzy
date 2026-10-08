from datetime import timedelta

import jwt

from backend import security


def test_password_hash_round_trip():
    hashed = security.hash_password("correct horse")

    assert hashed != "correct horse"
    assert security.verify_password("correct horse", hashed)
    assert not security.verify_password("wrong horse", hashed)


def test_passwords_longer_than_bcrypt_limit_are_supported():
    long_password = "x" * 100

    assert security.verify_password(long_password, security.hash_password(long_password))


def test_verify_password_handles_malformed_hash():
    assert not security.verify_password("anything", "not-a-bcrypt-hash")


def test_access_token_round_trip():
    token = security.create_access_token("ana@example.com")

    assert security.decode_access_token(token) == "ana@example.com"


def test_tampered_token_is_rejected():
    forged = jwt.encode({"sub": "ana@example.com"}, "a-completely-different-secret-key-of-32-bytes", algorithm="HS256")

    assert security.decode_access_token(forged) is None


def test_expired_token_is_rejected(monkeypatch):
    monkeypatch.setattr(security, "ACCESS_TOKEN_EXPIRE", timedelta(seconds=-1))

    assert security.decode_access_token(security.create_access_token("ana@example.com")) is None
