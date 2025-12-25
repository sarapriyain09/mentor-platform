# app/routes/auth_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas import UserCreate, UserResponse, UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
from app.auth import hash_password, verify_password, create_access_token
from app.utils.email_service import send_welcome_email, send_password_reset_email, generate_reset_token, get_reset_token_expiry

router = APIRouter(tags=["auth"])

# -------------------------
# Register User
# -------------------------
@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.full_name, new_user.role)
    
    return new_user

# -------------------------
# Login User
# -------------------------
@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# -------------------------
# Forgot Password
# -------------------------
@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration attacks
    if not user:
        return {"message": "If that email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expiry = get_reset_token_expiry()
    db.commit()
    
    # Send reset email in background
    background_tasks.add_task(send_password_reset_email, user.email, user.full_name, reset_token)
    
    return {"message": "If that email exists, a password reset link has been sent"}

# -------------------------
# Reset Password
# -------------------------
@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update password and clear reset token
    user.password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}

# -------------------------
# List all users (for testing)
# -------------------------
@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()