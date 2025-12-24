from typing import Optional
from pydantic import BaseModel, EmailStr

# -------------------------
# User Schemas
# -------------------------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# -------------------------
# Token Data (for auth utilities)
# -------------------------
class TokenData(BaseModel):
    id: Optional[int] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True  # REQUIRED for SQLAlchemy
