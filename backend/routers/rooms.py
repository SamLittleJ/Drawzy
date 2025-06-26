from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.post("/", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(room_in: schemas.RoomCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    import random, string
    code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    while db.query(models.Room).filter(models.Room.code == code).first():
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    room = models.Room(
        code=code,
        max_players=room_in.max_players,
        round_time=room_in.round_time,
        max_rounds=room_in.max_rounds,
        target_score=room_in.target_score,
        creator_id=current_user.id,
        is_public= room_in.is_public
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/", response_model=list[schemas.RoomResponse])
def list_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Room).filter(models.Room.is_public == True).offset(skip).limit(limit).all()

@router.get("/{code}", response_model=schemas.RoomResponse)
def get_room(code: str, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{code}", response_model=schemas.RoomResponse)
def update_room(code: str, room_in: schemas.RoomCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this room")
    room.max_players = room_in.max_players
    room.round_time = room_in.round_time
    room.max_rounds = room_in.max_rounds
    room.target_score = room_in.target_score
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(code: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.code == code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this room")
    db.delete(room)
    db.commit()
    return {"detail": "Room deleted successfully"}
        
    