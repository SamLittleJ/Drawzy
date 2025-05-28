from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import datetime
from typing import Optional, List, Literal

#Input data when creating a user
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    role: Optional[str] = "player"
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

#Data return in API responses (Password is omitted)
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar: Optional[str]
    role: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
        
class RoomCreate(BaseModel):
    max_players: int
    round_time: int
    is_public: Optional[bool] = False

class RoomResponse(BaseModel):
    id: int
    code: str
    max_players: int
    round_time: int
    status: str
    creator_id: int
    created_at: datetime
    is_public: bool
    
    class Config:
        from_attributes = True
        
class RoundCreate(BaseModel):
    room_id: int
    theme: str

class RoundResponse(BaseModel):
    id: int
    room_id: int
    round_number: int
    theme: str
    status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    
    class Config:
        from_attributes = True
        
class RoomPlayerResponse(BaseModel):
    room_id: int
    user_id: int
    score: int
    status: str
    joined_at: datetime
    
    class Config:
        from_attributes = True
        
class DrawingCreate(BaseModel):
    round_id: int
    url: HttpUrl
    
class DrawingResponse(BaseModel):
    id: int
    round_id: int
    user_id: int
    url: HttpUrl
    created_at: datetime
    score: int
    
    class Config:
        from_attributes = True
        
class VoteCreate(BaseModel):
    voter_id: int
    drawing_id: int

class VoteResponse(BaseModel):
    voter_id: int
    drawing_id: int
    
    class Config:
        from_attributes = True
        
class ChatMessageCreate(BaseModel):
    room_id: int
    message: str
    
    class Config:
        from_attributes = True
    
class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    message: str
    created_at: datetime
    room_code: str
    
    class Config:
        from_attributes = True