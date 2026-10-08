from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

router = APIRouter(prefix="/drawings", tags=["Drawings"])


@router.post("/", response_model=schemas.DrawingResponse, status_code=status.HTTP_201_CREATED)
def create_drawing(
    drawing_in: schemas.DrawingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(models.Round, drawing_in.round_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    drawing = models.Drawing(round_id=drawing_in.round_id, user_id=current_user.id, url=str(drawing_in.url))
    db.add(drawing)
    db.commit()
    db.refresh(drawing)
    return drawing


@router.get("/", response_model=list[schemas.DrawingResponse])
def list_drawings(round_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Drawing)
    if round_id is not None:
        query = query.filter(models.Drawing.round_id == round_id)
    return query.order_by(models.Drawing.created_at.desc()).all()


@router.get("/{drawing_id}", response_model=schemas.DrawingResponse)
def get_drawing(drawing_id: int, db: Session = Depends(get_db)):
    drawing = db.get(models.Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drawing not found")
    return drawing


@router.delete("/{drawing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drawing(
    drawing_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drawing = db.get(models.Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drawing not found")
    if drawing.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this drawing")
    db.delete(drawing)
    db.commit()
