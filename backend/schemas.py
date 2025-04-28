from pydantic import BaseModel, EmailStr
from datetime import datetime

#Input data when creating a user
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

#Data return in API responses (Password is omitted)
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    
    class Config:
        from_attributes = True