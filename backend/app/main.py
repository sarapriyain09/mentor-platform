# app/main.py
from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.routes.demo_routes import router as demo_router
from app.routes.mentorship_routes import router as mentorship_router
from app.routes.ai_agent_routes import router as ai_agent_router
from app.routes.booking_routes import router as booking_router  # NEW
from app.routes.payment_routes import router as payment_router  # NEW
import app.models.note
import app.models.user
import app.models.profile
import app.models.mentorship
import app.models.mentee_intake
import app.models.booking  # NEW
import app.models.payment  # NEW
from fastapi.middleware.cors import CORSMiddleware

# -------------------------
# Create FastAPI instance
# -------------------------
app = FastAPI(title="Mentoralab API")

# -------------------------
# CORS Middleware - Allow all Vercel deployments
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mendforworks.vercel.app",
        "https://www.mendforworks.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Include Routers
# -------------------------
app.include_router(mentorship_router)
app.include_router(auth_router, prefix="/auth", tags=["auth"])  # only once
app.include_router(profile_router)
app.include_router(demo_router)
app.include_router(ai_agent_router)
app.include_router(booking_router)  # NEW
app.include_router(payment_router)  # NEW

# -------------------------
# Root & Demo API
# -------------------------
@app.get("/")
def read_root():
    return {"status": "FastAPI running"}

@app.get("/api/tasks")
def get_tasks():
    return [{"id": 1, "title": "Learn FastAPI"}, {"id": 2, "title": "Deploy React"}]

# -------------------------
# Create all tables
# -------------------------
Base.metadata.create_all(bind=engine)

# -------------------------
# Auto-migrate: Add password reset columns if they don't exist
# -------------------------
def _add_password_reset_columns():
    """Add reset_token and reset_token_expiry columns to users table if they don't exist"""
    from sqlalchemy import text, inspect
    
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        with engine.connect() as conn:
            if 'reset_token' not in columns:
                print("Adding reset_token column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR"))
                conn.commit()
                print("✅ Added reset_token column")
            
            if 'reset_token_expiry' not in columns:
                print("Adding reset_token_expiry column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP"))
                conn.commit()
                print("✅ Added reset_token_expiry column")
    except Exception as e:
        print(f"Migration check: {str(e)}")

_add_password_reset_columns()

# -------------------------
# Seed demo note
# -------------------------
def _seed_demo_note():
    db = SessionLocal()
    try:
        from app.models.note import Note
        exists = db.query(Note).first()
        if not exists:
            demo = Note(title="Welcome", content="This is a seeded demo note.")
            db.add(demo)
            db.commit()
    finally:
        db.close()

_seed_demo_note()

