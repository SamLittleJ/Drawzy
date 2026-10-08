import os
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-key-change-me-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE = timedelta(hours=int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "4")))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

# bcrypt only looks at the first 72 bytes and newer releases reject longer input.
_BCRYPT_MAX_BYTES = 72


def _encode(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_encode(password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(UTC) + ACCESS_TOKEN_EXPIRE
    return jwt.encode({"sub": subject, "exp": expires_at}, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Return the token subject (the user's email), or None if the token is invalid or expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")
