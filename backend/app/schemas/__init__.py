from app.schemas.user_schema import UserCreate, UserOut, UserLogin, Token
from app.schemas.profile_schema import MentorProfileCreate, MenteeProfileCreate
# app/schemas/__init__.py
from .user import UserCreate, UserLogin, UserResponse
from .token import Token

