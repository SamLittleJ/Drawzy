from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, get_db
from backend import models, schemas
from typing import Dict, List

#HOURS SPEND ON THIS SHIT = 24
#No point to this IG

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

        
#Basic root endpoint to verify that the API is running
@app.get("/")
def read_root(db = Depends(get_db)):
    return {"message": "Welcome to Drawzy! This is changing as i write! Look it changed! And again! Whatever"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

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

@app.post("/users/login", response_model=schemas.UserResponse)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.hashed_password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user

@app.websocket("/ws/echo")
async def echo_websocket(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established")
    await websocket.send_text("Hello from the server!")
    try:
        while True:
            # #await websocket.send_text("Hello from the server!")
            # message = await websocket.receive()
            # print("Hello")
            # msg_type = message.get("type")
            # print("Raw event", message)
            
            # if msg_type == "websocket.receive":
            #     print("Hello3")
            #     if "text" in message and message["text"] is not None:
            #         print("Hello4")
            #         data = message["text"]
            #         print(f"Received message: {data!r}")
            #         await websocket.send_text(data)
            #     elif "bytes" in message and message["bytes"] is not None:
            #         data = message["bytes"]
            #         print(f"Received bytes: {data!r}")
            #         await websocket.send_bytes(data)
            
            # elif msg_type == "websocket.disconnect":
            #     code = message.get('code')
            #     print(f"WebSocket disconnected with code: {code}")
            #     break
            
            data = await websocket.receive_text()
            print(f"Received message: {data!r}")
            await websocket.send_text(data)
    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected: {e.code}")        
            
    except Exception as e:
        print("WebSocket handler error:", e)
    finally:
        print("WebSocket connection closed")
            