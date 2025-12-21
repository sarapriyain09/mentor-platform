from pydantic import BaseModel, EmailStr

# Request body for registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

# Response body for user
class UserOut(BaseModel):
    email: EmailStr
    role: str

    class Config:
        from_attributes = True  # pydantic v2 replacement for orm_mode

# Request body for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response body for token
class Token(BaseModel):
    access_token: str
    token_type: str
