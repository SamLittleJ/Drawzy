from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import datetime
from typing import Optional, List, Literal

# Schema Input: UserCreate
# • Rol: Definirea datelor necesare pentru înregistrarea unui nou utilizator.
# • Câmpuri: username, email, password, avatar opțional, rol implicit "player".
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    role: Optional[str] = "player"
    
# Schema Input: UserLogin
# • Rol: Definirea datelor necesare pentru autentificarea unui utilizator.
# • Câmpuri: email și password.
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
# Schema Output: Token
# • Rol: Retur de token JWT la autentificare.
# • Câmpuri: access_token și token_type.
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema Internă: TokenData
# • Rol: Conține informațiile decodate din token (email opțional).
class TokenData(BaseModel):
    email: Optional[EmailStr] = None

# Schema Output: UserResponse
# • Rol: Datele returnate pentru un utilizator (ex.: în profil sau listări).
# • Câmpuri: id, username, email, avatar, rol, status, created_at.
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
        
# Schema Input: RoomCreate
# • Rol: Date necesare pentru crearea unei noi camere de joc.
# • Câmpuri: max_players, round_time, max_rounds, target_score, is_public opțional.
class RoomCreate(BaseModel):
    max_players: int
    round_time: int
    max_rounds: int
    target_score: int
    is_public: Optional[bool] = False

# Schema Output: RoomResponse
# • Rol: Datele returnate pentru o cameră (ex.: listare sau detalii).
# • Câmpuri: id, code, max_players, round_time, max_rounds, target_score, status, creator_id, created_at, is_public.
class RoomResponse(BaseModel):
    id: int
    code: str
    max_players: int
    round_time: int
    max_rounds: int
    target_score: int
    status: str
    creator_id: int
    created_at: datetime
    is_public: bool
    
    class Config:
        from_attributes = True
        
# Schema Input: RoundCreate
# • Rol: Parametrii pentru inițierea unui nou tur (round) în cadrul unei camere.
# • Câmpuri: room_id și tema (theme).
class RoundCreate(BaseModel):
    room_id: int
    theme: str

# Schema Output: RoundResponse
# • Rol: Datele returnate pentru un tur de joc.
# • Câmpuri: id, room_id, round_number, theme, status, start_time, end_time.
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
        
# Schema Output: RoomPlayerResponse
# • Rol: Starea și scorul unui utilizator într-o cameră.
# • Câmpuri: room_id, user_id, score, status, joined_at.
class RoomPlayerResponse(BaseModel):
    room_id: int
    user_id: int
    score: int
    status: str
    joined_at: datetime
    
    class Config:
        from_attributes = True
        
# Schema Input: DrawingCreate
# • Rol: Trimite URL-ul unui desen pentru un tur.
# • Câmpuri: round_id și url.
class DrawingCreate(BaseModel):
    round_id: int
    url: HttpUrl
    
# Schema Output: DrawingResponse
# • Rol: Datele returnate după salvarea unui desen.
# • Câmpuri: id, round_id, user_id, url, created_at, score.
class DrawingResponse(BaseModel):
    id: int
    round_id: int
    user_id: int
    url: HttpUrl
    created_at: datetime
    score: int
    
    class Config:
        from_attributes = True
        
# Schema Input: VoteCreate
# • Rol: Conține votul pentru un desen.
# • Câmpuri: drawing_id și score.
class VoteCreate(BaseModel):
    drawing_id: int
    score: int

# Schema Output: VoteResponse
# • Rol: Datele returnate după înregistrarea unui vot.
# • Câmpuri: voter_id, drawing_id, score.
class VoteResponse(BaseModel):
    voter_id: int
    drawing_id: int
    score: int
    
    class Config:
        from_attributes = True
        
# Schema Input: ChatMessageCreate
# • Rol: Parametrii pentru trimiterea unui mesaj în chat.
# • Câmpuri: room_id și message.
class ChatMessageCreate(BaseModel):
    room_id: int
    message: str
    
    class Config:
        from_attributes = True
    
# Schema Output: ChatMessageResponse
# • Rol: Datele returnate pentru un mesaj de chat.
# • Câmpuri: id, room_id, user_id, message, created_at, room_code.
class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    message: str
    created_at: datetime
    room_code: str
    
    class Config:
        from_attributes = True
        
# Schema Input: ThemeCreate
# • Rol: Definirea unui nou test de temă (temporar).
# • Câmpuri: test (temporar).
class ThemeCreate(BaseModel):
    test: str
    
# Schema Output: ThemeResponse
# • Rol: Datele returnate pentru entitatea Theme.
# • Câmpuri: id și test.
class ThemeResponse(BaseModel):
    id: int
    test: str
    
    class Config:
        from_attributes = True