# app/schemas.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True  # important for SQLAlchemy objects

class Token(BaseModel):
    access_token: str
    token_type: str

