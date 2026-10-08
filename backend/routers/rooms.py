import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])

ROOM_CODE_ALPHABET = string.ascii_uppercase + string.digits
ROOM_CODE_LENGTH = 6


def generate_room_code(db: Session) -> str:
    while True:
        code = "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(ROOM_CODE_LENGTH))
        if not db.query(models.Room).filter(models.Room.code == code).first():
            return code


def get_room_or_404(code: str, db: Session) -> models.Room:
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room


def _get_owned_room(code: str, current_user: models.User, db: Session) -> models.Room:
    room = get_room_or_404(code, db)
    if room.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the room creator can do this")
    return room


@router.post("/", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: schemas.RoomCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = models.Room(code=generate_room_code(db), creator_id=current_user.id, **room_in.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/", response_model=list[schemas.RoomResponse])
def list_public_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Room)
        .filter(models.Room.is_public.is_(True))
        .order_by(models.Room.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{code}", response_model=schemas.RoomResponse)
def get_room(code: str, db: Session = Depends(get_db)):
    return get_room_or_404(code, db)


@router.put("/{code}", response_model=schemas.RoomResponse)
def update_room(
    code: str,
    room_in: schemas.RoomCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = _get_owned_room(code, current_user, db)
    for field, value in room_in.model_dump().items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


@router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(code: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = _get_owned_room(code, current_user, db)
    db.delete(room)
    db.commit()
