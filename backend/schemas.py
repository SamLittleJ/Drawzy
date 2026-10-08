from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, PositiveInt


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Users & auth ---


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=1)
    avatar: str | None = None


class UserUpdate(BaseModel):
    """Partial profile update. Role and status are intentionally not user-editable."""

    username: str | None = Field(default=None, min_length=1, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=1)
    avatar: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(ORMModel):
    id: int
    username: str
    email: EmailStr
    avatar: str | None
    role: str
    status: str
    created_at: datetime


# --- Rooms ---


class RoomCreate(BaseModel):
    max_players: PositiveInt
    round_time: PositiveInt
    max_rounds: PositiveInt
    target_score: PositiveInt
    is_public: bool = False


class RoomResponse(ORMModel):
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
    player_count: int


class RoomPlayerResponse(ORMModel):
    room_id: int
    user_id: int
    score: int
    status: str
    joined_at: datetime


# --- Rounds ---


class RoundCreate(BaseModel):
    room_id: int
    theme: str = Field(min_length=1, max_length=100)


class RoundResponse(ORMModel):
    id: int
    room_id: int
    round_number: int
    theme: str
    status: str
    start_time: datetime | None
    end_time: datetime | None


# --- Drawings & votes ---


class DrawingCreate(BaseModel):
    round_id: int
    url: HttpUrl


class DrawingResponse(ORMModel):
    id: int
    round_id: int
    user_id: int
    url: HttpUrl
    created_at: datetime
    score: int


class VoteCreate(BaseModel):
    drawing_id: int
    score: int


class VoteResponse(ORMModel):
    voter_id: int
    drawing_id: int
    score: int


# --- Chat ---


class ChatMessageCreate(BaseModel):
    room_id: int
    message: str = Field(min_length=1)


class ChatMessageResponse(ORMModel):
    id: int
    room_id: int
    user_id: int
    message: str
    created_at: datetime
    room_code: str


# --- Themes ---


class ThemeCreate(BaseModel):
    text: str = Field(min_length=1, max_length=100)


class ThemeResponse(ORMModel):
    id: int
    text: str
