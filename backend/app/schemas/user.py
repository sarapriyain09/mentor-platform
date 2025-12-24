# app/schemas/user.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # mentee or mentor

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        orm_mode = True
