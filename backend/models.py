from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Text, func, Boolean
from backend.database import Base
from sqlalchemy.orm import relationship

# Model: User
# • Rol: Reprezintă utilizatorii din aplicație și stochează date de autentificare și profil.
# • Câmpuri: id, username, email, hashed_password, avatar, role, status, created_at.
# • Relații: rooms (camere create), room_players (participări), drawings și votes (acțiuni de desen și vot), chat_messages.
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    avatar = Column(String(255), nullable=True)
    role = Column(String(20), default="user")  # e.g., "user", "admin"
    status = Column(String(20), default="active")  # e.g., "active", "banned"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relații către alte tabele
    rooms = relationship("Room", back_populates="creator")
    room_players = relationship("RoomPlayer", back_populates="user")
    drawings = relationship("Drawing", back_populates="user")
    votes = relationship("DrawingVote", back_populates="voter")
    chat_messages = relationship("ChatMessage", back_populates="user")

# Model: Room
# • Rol: Reprezintă camerele de joc create de utilizatori.
# • Câmpuri: id, code, max_players, round_time, max_rounds, target_score, status, creator_id, created_at, is_public.
# • Relații: creator (User), room_players (jucători), rounds, chat_messages.
class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), unique=True, nullable=False)
    max_players = Column(Integer, nullable=False)
    round_time = Column(Integer, nullable=False)
    max_rounds = Column(Integer, nullable=False)
    target_score = Column(Integer, nullable=False)
    status = Column(String(20), default="open")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_public = Column(Boolean, nullable=False, server_default=func.false())
    
    # Relații către alte tabele
    creator = relationship("User", back_populates="rooms")
    room_players = relationship("RoomPlayer", back_populates="room")
    rounds = relationship("Round", back_populates="room")
    chat_messages = relationship("ChatMessage", back_populates="room")

# Model: RoomPlayer
# • Rol: Reprezintă asocierea între utilizatori și camere, cu starea și scorul fiecărui jucător.
# • Câmpuri: room_id, user_id, score, status, joined_at.
class RoomPlayer(Base):
    __tablename__ = "room_players"
    room_id = Column(Integer, ForeignKey("rooms.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    score = Column(Integer, default=0)
    status = Column(String(20), default="active")  # e.g., "active", "disconnected"
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="room_players")
    room = relationship("Room", back_populates="room_players")

# Model: Round
# • Rol: Reprezintă un tur de desen într-o cameră.
# • Câmpuri: id, room_id, round_number, theme, status, start_time, end_time.
# • Relații: drawings pentru fiecare tur.
class Round(Base):
    __tablename__ = "rounds"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    theme = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    room = relationship("Room", back_populates="rounds")
    drawings = relationship("Drawing", back_populates="round")

# Model: Drawing
# • Rol: Stochează URL-ul desenului făcut de un jucător într-un tur.
# • Câmpuri: id, round_id, user_id, url, created_at, score.
class Drawing(Base):
    __tablename__ = "drawings"
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Integer, default=0)
    
    round = relationship("Round", back_populates="drawings")
    user = relationship("User", back_populates="drawings")
    votes = relationship("DrawingVote", back_populates="drawing")

# Model: DrawingVote
# • Rol: Reprezintă votul unui utilizator pentru un desen.
# • Câmpuri: voter_id, drawing_id, voted_at, score.
class DrawingVote(Base):
    __tablename__ = "drawing_votes"
    voter_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), primary_key=True)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Integer, nullable=False)
    
    voter = relationship("User", back_populates="votes")
    drawing = relationship("Drawing", back_populates="votes")

# Model: ChatMessage
# • Rol: Reprezintă mesajele trimise de utilizatori în chat-ul unei camere.
# • Câmpuri: id, room_id, user_id, message, created_at.
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="chat_messages")
    room = relationship("Room", back_populates="chat_messages")

# Model: Theme
# • Rol: Stochează temele de desen posibile în tururi.
# • Câmpuri: id, text.
class Theme(Base):
    __tablename__ = "themes"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(100), unique=True, nullable=False)