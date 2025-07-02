import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi import WebSocket, WebSocketException
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import models

# Cheie secretă JWT
# • Rol: Utilizată pentru semnarea și verificarea token-urilor JWT.
# • Configurabilă: Prin variabila de mediu SECRET_KEY.
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change")

# Algoritm de semnare JWT
# • Rol: Definește algoritmul utilizat pentru criptarea JWT (ex: HS256).
# • Configurabil: Prin variabila de mediu ALGORITHM.
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Scheme OAuth2 Password Bearer
# • Rol: Definește fluxul de autentificare prin token Bearer pentru endpoint-ul /users/login.
# • Utilizare: Folosit în dependințe pentru extragerea token-ului din header-ul Authorization.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# Dependință HTTP: get_current_user
# • Rol: Decodează și validează token-ul JWT din header și returnează utilizatorul curent.
# • Eroare: Aruncă HTTPException 401 dacă token-ul lipsește sau este invalid.
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Dependință WebSocket: get_current_user_ws
# • Rol: Preia token-ul JWT din query params, validează și returnează utilizatorul curent.
# • Eroare: Aruncă WebSocketException 4401 dacă autentificarea eșuează.
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user