from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

router = APIRouter(prefix="/rounds", tags=["Rounds"])


@router.post("/", response_model=schemas.RoundResponse, status_code=status.HTTP_201_CREATED)
def create_round(
    round_in: schemas.RoundCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(models.Room, round_in.room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the room creator can create rounds")

    round_number = db.query(models.Round).filter(models.Round.room_id == room.id).count() + 1
    round_obj = models.Round(room_id=room.id, round_number=round_number, theme=round_in.theme, status="pending")
    db.add(round_obj)
    db.commit()
    db.refresh(round_obj)
    return round_obj


@router.get("/", response_model=list[schemas.RoundResponse])
def list_rounds(room_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Round)
    if room_id is not None:
        query = query.filter(models.Round.room_id == room_id)
    return query.order_by(models.Round.round_number).all()


@router.get("/{round_id}", response_model=schemas.RoundResponse)
def get_round(round_id: int, db: Session = Depends(get_db)):
    round_obj = db.get(models.Round, round_id)
    if not round_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    return round_obj
