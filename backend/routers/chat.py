# Importuri FastAPI și SQLAlchemy
# • Rol: APIRouter pentru definirea rutelor de chat; HTTPException și status pentru tratamentul erorilor HTTP; Depends pentru injectarea dependențelor.
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

# Import modele și scheme
# • Rol: Modelele SQLAlchemy și schemele Pydantic pentru validare și serializare.
from backend import models, schemas

# Import funcție sesiune DB
# • Rol: Furnizează o sesiune de bază de date per request.
from backend.database import get_db

# Import dependență autentificare
# • Rol: Obține utilizatorul curent din token-ul JWT pentru securizarea endpoint-urilor.
from backend.dependencies import get_current_user

# Router Chat
# • Rol: Grupează endpoint-urile pentru trimiterea și listarea mesajelor de chat într-o cameră.
router = APIRouter(prefix="/chat", tags=["Chat"])

# Endpoint POST /chat/
# • Rol: Înregistrează un nou mesaj în chat; validează existența camerei și returnează mesajul creat.
@router.post(
    "/", 
    response_model=schemas.ChatMessageResponse, 
    status_code=status.HTTP_201_CREATED
)
# Funcție: create_message
# • Rol: Primește payload-ul de chat, creează și salvează mesajul în baza de date, apoi adaugă codul camerei în răspuns.
def create_message(
    msg_in: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificare cameră
    # • Rol: Asigură existența camerei pentru care se trimite mesajul; aruncă 404 dacă nu există.
    room = db.query(models.Room).get(msg_in.room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Room not found"
        )

    # Creare ChatMessage
    # • Rol: Instanțiază modelul ChatMessage cu datele furnizate de utilizator.
    message = models.ChatMessage(
        room_id=msg_in.room_id,
        user_id=current_user.id,
        message=msg_in.message
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Adăugare cod cameră în răspuns
    message.room_code = message.room.code
    return message

# Endpoint GET /chat/?room_id=...
# • Rol: Listează toate mesajele dintr-o cameră specifică, sortate cronologic.
@router.get(
    "/", 
    response_model=list[schemas.ChatMessageResponse]
)
# Funcție: list_messages
# • Rol: Interoghează și returnează istoricul mesajelor pentru o cameră.
def list_messages(
    room_id: int,
    db: Session = Depends(get_db)
):
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.room_id == room_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    for m in messages:
        m.room_code = m.room.code
    return messages

# Endpoint GET /chat/{message_id}
# • Rol: Returnează un mesaj specific după ID; aruncă 404 dacă nu este găsit.
@router.get(
    "/{message_id}", 
    response_model=schemas.ChatMessageResponse
)
# Funcție: get_message
# • Rol: Obține și returnează un mesaj de chat după ID din baza de date.
def get_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    message = db.query(models.ChatMessage).get(message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Message not found"
        )
    message.room_code = message.room.code
    return message