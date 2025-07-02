# Importuri FastAPI și gestionare erori HTTP
# • Rol: APIRouter pentru definirea rutelor; HTTPException și status pentru generarea răspunsurilor de eroare; Depends pentru dependențe.
from fastapi import APIRouter, HTTPException, Depends, status

# Import sesiune DB SQLAlchemy
# • Rol: Session oferă o conexiune de lucru la baza de date pentru operațiuni CRUD.
from sqlalchemy.orm import Session

# Import dependență autentificare
# • Rol: Obține utilizatorul curent din token-ul JWT pentru operații de securitate.
from backend.dependencies import get_current_user

# Import modele și scheme Pydantic
# • Rol: Modelele SQLAlchemy pentru acces DB și schemele Pydantic pentru validarea și serializarea datelor.
from backend import models, schemas

# Import funcție sesiune DB
# • Rol: Furnizează o sesiune de bazei de date per request.
from backend.database import get_db

# Router Drawings
# • Rol: Grupează endpoint-urile pentru gestionarea desenelor (creare, listare, obținere, ștergere).
router = APIRouter(prefix="/drawings", tags=["Drawings"])

# Endpoint POST /drawings/
# • Rol: Înregistrează un nou desen asociat unui round; validează existența round-ului.
@router.post("/", response_model=schemas.DrawingResponse, status_code=status.HTTP_201_CREATED)
def create_drawing(
    drawing_in: schemas.DrawingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rnd = db.query(models.Round).get(drawing_in.round_id)
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    drawing = models.Drawing(
        round_id=drawing_in.round_id,
        user_id=current_user.id,
        url=drawing_in.url
    )
    db.add(drawing)
    db.commit()
    db.refresh(drawing)
    return drawing

# Endpoint GET /drawings/
# • Rol: Listează desenele; filtrare opțională după round_id și sortare descrescătoare după dată.
@router.get("/", response_model=list[schemas.DrawingResponse])
def list_drawings(round_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Drawing)
    if round_id is not None:
        query = query.filter(models.Drawing.round_id == round_id)
    return query.order_by(models.Drawing.created_at.desc()).all()

# Endpoint GET /drawings/{drawing_id}
# • Rol: Obține detaliile unui desen după ID; returnează 404 dacă nu există.
@router.get("/{drawing_id}", response_model=schemas.DrawingResponse)
def get_drawing(drawing_id: int, db: Session = Depends(get_db)):
    drawing = db.query(models.Drawing).get(drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drawing not found")
    return drawing

# Endpoint DELETE /drawings/{drawing_id}
# • Rol: Șterge un desen; permite doar autorului desenului; returnează 403 sau 404 după caz.
@router.delete("/{drawing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drawing(
    drawing_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    drawing = db.query(models.Drawing).get(drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drawing not found")
    if drawing.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this drawing")
    db.delete(drawing)
    db.commit()
    return