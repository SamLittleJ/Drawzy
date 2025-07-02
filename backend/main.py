from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, get_db
from backend import models, schemas
from typing import Dict, List
from passlib.context import CryptContext
from backend.routers.users import router as users_router
from backend.routers.rooms import router as rooms_router
from backend.routers.rounds import router as rounds_router
from backend.routers.drawings import router as drawings_router
from backend.routers.chat import router as chat_router
from backend.routers.votes import router as votes_router
from backend.routers.ws import router as ws_router

# Context criptare parole
# • Rol: Configurează algoritmi de hashing pentru parole (bcrypt).
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Creare tabele DB
# • Rol: Creează automat tabelele definite în modele dacă nu există deja.
models.Base.metadata.create_all(bind=engine)

# Instanțiere aplicație FastAPI
# • Rol: Initializează serverul web ASGI pentru rutare și procesarea cererilor.
app = FastAPI()

# Middleware CORS
# • Rol: Configurează permisiunile Cross-Origin pentru a permite apeluri din frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Aici poți restrânge originile (ex. ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Înregistrare router WebSocket
# • Rol: Adaugă endpoint-urile WebSocket definite în ws_router.
app.include_router(ws_router)
# Înregistrare router API utilizatori
app.include_router(users_router)
# Înregistrare router API camere
app.include_router(rooms_router)
# Înregistrare router API tururi
app.include_router(rounds_router)
# Înregistrare router API desene
app.include_router(drawings_router)
# Înregistrare router API chat
app.include_router(chat_router)
# Înregistrare router API voturi
app.include_router(votes_router)

# Endpoint rădăcină
# • Rol: Verifică că API-ul rulează și răspunde cu un mesaj de bun venit.
@app.get("/")
def read_root(db = Depends(get_db)):
    return {"message": "Welcome to Drawzy! This is changing as i write! Look it changed! And again! Whatever"}

# Endpoint health-check
# • Rol: Returnează starea serviciului pentru monitorizarea uptime-ului.
@app.get("/health")
def health_check():
    return {"status": "ok"}

# (Comentarii adiționale pentru alte endpoint-uri sau WebSocket handlers pot fi puse în fișierele router corespunzătoare.)