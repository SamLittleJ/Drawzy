from pydantic import BaseModel, EmailStr

#Input data when creating a user
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

#Data return in API responses (Password is omitted)
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: str
    
    class Config:
        orm_mode = True