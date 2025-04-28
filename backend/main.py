from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, get_db
from backend import models, schemas
from typing import Dict, List

#HOURS SPEND ON THIS SHIT = 16

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

# class ConnectionManager:
#     def __init__(self):
#         self.activate_connections: Dict[str, WebSocket] = {}
        
#     async def connect(self, websocket: WebSocket, room_id: str):
#         await websocket.accept()
#         self.activate_connections.setdefault(room_id, []).append(websocket)

#     def disconnect(self, websocket: WebSocket, room_id: str):
#         connections = self.activate_connections.get(room_id, [])
#         if websocket in connections:
#             connections.remove(websocket)
    
#     async def broadcast(self, message: str, room_id: str):
#         for connection in self.activate_connections.get(room_id, []):
#             await connection.send_text(message)
# manager = ConnectionManager()

# rooms: dict[str, List[WebSocket]] = {}

# @app.websocket("/ws/{room_id}")
# async def websocket_endpoint(websocket: WebSocket, room_id: str):
#     await websocket.accept()
#     rooms.setdefault(room_id, []).append(websocket)
#     print(f"Connection accepted in room {room_id}")
    
#     while True:
#         msg = await websocket.receive()
#         print("RAW ASGI MSG:", msg)
#         if msg["type"] == "websocket.disconnect":
#             print(f"Disconnect in room {room_id} (code={msg.get('code')})")
#             rooms[room_id].remove(websocket)
#             break
        
#         text = msg.get("test")
#         if text is None:
#             text = msg.get("bytes", b"").decode("utf-8", errors="ignore")
        
#         print(f"Echoing back {text!r}")
#         for conn in rooms[room_id]:
#             await conn.send_text(text)

# @app.websocket("/ws/echo")
# async def echo_websocket(websocket: WebSocket):
#     await websocket.accept()
#     print("Echo socket connected")
#     try:
#         while True:
#                         # Receive text frames only
#             data = await websocket.receive_text()
#             print(f"📨 Received: {data!r}")
#             # Echo back
#             await websocket.send_text(data)
#     except WebSocketDisconnect as e:
#         print(f"⚠️ Echo socket disconnected (code={e.code})")