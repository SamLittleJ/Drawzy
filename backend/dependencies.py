import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi import WebSocket, WebSocketException
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import models

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change")
ALOGRITH = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALOGRITH])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_ws(websocket: WebSocket, db: Session = Depends(get_db)) -> models.User:
    """
    Retrieve and validate JWT token for WebSocket connections.
    Raises WebSocketException with code 4401 if authentication fails.
    """
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketException(code=4401, reason="Missing auth token")
    credentials_exception = WebSocketException(code=4401, reason="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALOGRITH])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user