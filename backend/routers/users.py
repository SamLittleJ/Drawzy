# Importuri FastAPI și gestionare erori
# • Rol: APIRouter pentru rutare, Depends pentru injectarea de dependențe,
#   HTTPException și status pentru tratarea erorilor HTTP.
from fastapi import APIRouter, Depends, HTTPException, status

# Import sesiune DB
# • Rol: Session oferă o conexiune de lucru la baza de date pentru endpoint-uri.
from sqlalchemy.orm import Session

# Context criptare parole
# • Rol: Configurează algoritmul bcrypt pentru hashing-ul parolelor utilizatorilor.
from passlib.context import CryptContext

# Import dependențe autentificare JWT
# • Rol: SECRET_KEY și algoritmul (ALOGRITH) pentru semnarea tokenurilor;
#   oauth2_scheme pentru schema Bearer.
from backend.dependencies import SECRET_KEY, ALOGRITH, oauth2_scheme

# Import JOSE JWT
# • Rol: Permite codificarea și decodificarea tokenurilor JWT.
from jose import jwt

from backend import models, schemas
from backend.database import get_db
from typing import List
from datetime import datetime, timedelta
from backend.schemas import Token

# Inițializare context hashing
# • Rol: Instanțiază contextul pentru hash și verificare parole cu bcrypt.
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Router Users
# • Rol: Grupează endpoint-urile pentru gestionarea utilizatorilor (creare, login, CRUD).
router = APIRouter(prefix="/users", tags=["Users"])

# Endpoint POST /users/
# • Rol: Creează un utilizator nou; verifică duplicarea email și criptează parola pentru securitate.
@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=pwd_ctx.hash(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Endpoint POST /users/login
# • Rol: Autentifică utilizatorul și generează un JWT cu expirare de 4 ore.
@router.post("/login", response_model=Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not pwd_ctx.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Durată expirare JWT
    # • Rol: Specifică timpul de valabilitate al tokenului (4 ore).
    accees_token_expires = timedelta(hours=4)

    # Payload JWT
    # • Rol: Setează subiectul (email) și timpul de expirare pentru token.
    to_encode = {"sub": user.email, "exp": datetime.utcnow() + accees_token_expires}

    # Generare JWT
    # • Rol: Codifică payload-ul într-un token sigur folosind SECRET_KEY și algoritmul HS256.
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALOGRITH)

    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint GET /users/
# • Rol: Returnează lista tuturor utilizatorilor din baza de date.
@router.get("/", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# Endpoint GET /users/{user_id}
# • Rol: Returnează datele unui utilizator specific sau 404 dacă nu există.
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Endpoint PUT /users/{user_id}
# • Rol: Actualizează datele unui utilizator; criptează parola dacă este furnizată.
@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.username = user_in.username
    user.email = user_in.email
    if user_in.password:
        user.hashed_password = pwd_ctx.hash(user_in.password)
    user.avatar = user_in.avatar
    user.role = user_in.role
    db.commit()
    db.refresh(user)
    return user

# Endpoint DELETE /users/{user_id}
# • Rol: Șterge un utilizator din baza de date sau returnează 404 dacă nu este găsit.
@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}