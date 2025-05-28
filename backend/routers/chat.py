from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=schemas.ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    msg_in: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(models.Room).get(msg_in.room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    message = models.ChatMessage(
        room_id=msg_in.room_id,
        user_id=current_user.id,
        message=msg_in.message
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    message.room_code = message.room.code  # Add room code to the response
    return message

@router.get("/", response_model=list[schemas.ChatMessageResponse])
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

@router.get("/{message_id}", response_model=schemas.ChatMessageResponse)
def get_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    message = db.query(models.ChatMessage).get(message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    message.room_code = message.room.code
    return message
