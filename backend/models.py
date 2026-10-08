from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, false, func
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    avatar = Column(String(255), nullable=True)
    role = Column(String(20), default="user")  # "user" | "admin"
    status = Column(String(20), default="active")  # "active" | "banned"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rooms = relationship("Room", back_populates="creator", cascade="all, delete-orphan")
    room_players = relationship("RoomPlayer", back_populates="user", cascade="all, delete-orphan")
    drawings = relationship("Drawing", back_populates="user", cascade="all, delete-orphan")
    votes = relationship("DrawingVote", back_populates="voter", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), unique=True, nullable=False)
    max_players = Column(Integer, nullable=False)
    round_time = Column(Integer, nullable=False)  # seconds
    max_rounds = Column(Integer, nullable=False)
    target_score = Column(Integer, nullable=False)
    status = Column(String(20), default="open")  # "open" | "in_progress"
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_public = Column(Boolean, nullable=False, server_default=false())

    creator = relationship("User", back_populates="rooms")
    room_players = relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="room", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")

    @property
    def player_count(self) -> int:
        return len(self.room_players)


class RoomPlayer(Base):
    """Membership of a user in a room. A row exists while the user is connected to the room."""

    __tablename__ = "room_players"

    room_id = Column(Integer, ForeignKey("rooms.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    score = Column(Integer, default=0)
    status = Column(String(20), default="active")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="room_players")
    room = relationship("Room", back_populates="room_players")


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
    drawings = relationship("Drawing", back_populates="round", cascade="all, delete-orphan")


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
    votes = relationship("DrawingVote", back_populates="drawing", cascade="all, delete-orphan")


class DrawingVote(Base):
    __tablename__ = "drawing_votes"

    voter_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), primary_key=True)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Integer, nullable=False)

    voter = relationship("User", back_populates="votes")
    drawing = relationship("Drawing", back_populates="votes")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")
    room = relationship("Room", back_populates="chat_messages")

    @property
    def room_code(self) -> str:
        return self.room.code


class Theme(Base):
    """Pool of drawing prompts; one is picked at random for every round."""

    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(100), unique=True, nullable=False)
