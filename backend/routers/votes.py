# Importuri FastAPI și SQLAlchemy
# • Rol: APIRouter pentru definirea rutelor; HTTPException și status pentru gestionarea erorilor; Session pentru sesiunea DB.
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db
from backend.dependencies import get_current_user

# Router Votes
# • Rol: Grupează endpoint-urile pentru operațiunile de vot în cameră.
router = APIRouter(prefix="/votes", tags=["Votes"])

# Endpoint POST /votes/
# • Rol: Înregistrează un nou vot pentru un desen; validează existența desenului, împiedică votul propriu și voturile duplicate.
@router.post("/", response_model=schemas.VoteResponse, status_code=status.HTTP_201_CREATED)
def create_vote(
    vote_in: schemas.VoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    drawing = db.query(models.Drawing).get(vote_in.drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drawing not found")
    if drawing.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot vote for your own drawing")
    existing = db.query(models.DrawingVote).filter(
        models.DrawingVote.voter_id == current_user.id,
        models.DrawingVote.drawing_id == vote_in.drawing_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already voted for this drawing")
    vote = models.DrawingVote(
        voter_id=current_user.id,
        drawing_id=vote_in.drawing_id
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return vote

# Endpoint GET /votes/?drawing_id=...
# • Rol: Listează toate voturile pentru un desen specificat, sortate după ID-ul votatorului.
@router.get("/", response_model=list[schemas.VoteResponse])
def list_votes(
    drawing_id: int,
    db: Session = Depends(get_db)
):
    query = db.query(models.DrawingVote).filter(models.DrawingVote.drawing_id == drawing_id)
    return query.order_by(models.DrawingVote.voter_id).all()

# Endpoint GET /votes/{drawing_id}/{voter_id}
# • Rol: Returnează votul unui utilizator specific pentru un desen; produce 404 dacă lipsește.
@router.get("/{drawing_id}/{voter_id}", response_model=schemas.VoteResponse)
def get_vote(
    drawing_id: int,
    voter_id: int,
    db: Session = Depends(get_db)
):
    vote = db.query(models.DrawingVote).get((drawing_id, voter_id))
    if not vote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vote not found")
    return vote