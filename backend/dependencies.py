from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend import models
from backend.database import get_db
from backend.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# Application-defined WebSocket close codes (4000-4999 range).
WS_UNAUTHORIZED = 4401
WS_FORBIDDEN = 4403
WS_NOT_FOUND = 4404


def _user_from_token(token: str | None, db: Session) -> models.User | None:
    if not token:
        return None
    email = decode_access_token(token)
    if email is None:
        return None
    return db.query(models.User).filter(models.User.email == email).first()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    user = _user_from_token(token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_ws(websocket: WebSocket, db: Session) -> models.User:
    """Authenticate a WebSocket using the `token` query parameter (browsers can't set headers on WS)."""
    user = _user_from_token(websocket.query_params.get("token"), db)
    if user is None:
        raise WebSocketException(code=WS_UNAUTHORIZED, reason="Could not validate credentials")
    return user
