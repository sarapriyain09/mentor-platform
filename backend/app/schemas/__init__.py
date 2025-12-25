from app.schemas.user_schema import UserCreate, UserOut, UserLogin, Token
from app.schemas.profile_schema import MentorProfileCreate, MenteeProfileCreate
from app.schemas.feedback_schema import (
    SessionCompleteRequest,
    FeedbackCreateRequest,
    FeedbackResponse,
    MentorRatingsSummary
)
# app/schemas/__init__.py
from .user import UserCreate, UserLogin, UserResponse
from .token import Token
from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class MessageResponse(BaseModel):
    message: str
