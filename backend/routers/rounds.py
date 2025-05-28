from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.dependencies import get_current_user
from backend import models, schemas
from backend.database import get_db

router = APIRouter(prefix="/rounds", tags=["Rounds"])

@router.post("/", response_model=schemas.RoundResponse, status_code=status.HTTP_201_CREATED)
def create_round(round_in: schemas.RoundCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == round_in.room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create rounds in this room")
    count = db.query(models.Round).filter(models.Round.room_id == round_in.room_id).count()
    round_number = count + 1
    round_obj = models.Round(
        room_id=round_in.room_id,
        round_number=round_number,
        theme=round_in.theme,
        status="pending",
        start_time=None,
        end_time=None
    )
    db.add(round_obj)
    db.commit()
    db.refresh(round_obj)
    return round_obj

@router.get("/", response_model=list[schemas.RoundResponse])
def list_rounds(room_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Round)
    if room_id:
        query = query.filter(models.Round.room_id == room_id)
    return query.order_by(models.Round.round_number).all()

@router.get("/{round_id}", response_model=schemas.RoundResponse)
def get_round(round_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(models.Round).get(round_id)
    if not round_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    return round_obj
