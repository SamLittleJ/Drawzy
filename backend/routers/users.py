from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend import models, schemas
from backend.database import get_db
from typing import List
from datetime import datetime, timedelta
from backend.dependencies import SECRET_KEY, ALOGRITH, oauth2_scheme
from jose import jwt
from backend.schemas import Token

router = APIRouter(prefix="/users", tags=["Users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #Check if the user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    #create a new user instance (In production has the password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=pwd_ctx.hash(user.password),  # Hash the password    
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not pwd_ctx.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    accees_token_expires = timedelta(hours=4)  # Token expiration time
    to_encode = {"sub": user.email, "exp": datetime.utcnow() + accees_token_expires} 
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALOGRITH)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Update user fields
    user.username = user_in.username
    user.email = user_in.email
    if user_in.password:
        user.hashed_password = pwd_ctx.hash(user_in.password)
    user.avatar = user_in.avatar
    user.role = user_in.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}