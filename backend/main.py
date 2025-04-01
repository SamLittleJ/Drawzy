from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import schemas

#Create the database tables (if they don't exist)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

#Allowing all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #You can specify allowed origins here e.g. ["http://localhost", "http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Dependency to get the database session for the current request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
#Basic root endpoint to verify that the API is running
@app.get("/")
def read_root():
    return {"message": "Welcome to Drawzy! This is changing as i write! Look it changed!"}

#User registration endpoint
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #Check if the user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    #create a new user instance (In production has the password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=user.password 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.get("/")
def root():
    return {"message": "Drawzy Backend is up!"}