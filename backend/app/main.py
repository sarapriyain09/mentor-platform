# app/main.py
from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.routes.demo_routes import router as demo_router
from app.routes.mentorship_routes import router as mentorship_router
from app.routes.ai_agent_routes import router as ai_agent_router
from app.routes.booking_routes import router as booking_router
from app.routes.payment_routes import router as payment_router
from app.routes.feedback_routes import router as feedback_router  # NEW
from app.routes.chat_routes import router as chat_router
import app.models.note
import app.models.user
import app.models.profile
import app.models.mentorship
import app.models.mentee_intake
import app.models.booking
import app.models.payment
import app.models.feedback  # NEW
import app.models.message
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
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(profile_router)
app.include_router(demo_router)
app.include_router(ai_agent_router)
app.include_router(booking_router)
app.include_router(payment_router)
app.include_router(feedback_router)  # NEW
app.include_router(chat_router)

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
    """Add missing columns to users table if they don't exist"""
    from sqlalchemy import text, inspect
    
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        with engine.connect() as conn:
            if 'full_name' not in columns:
                print("Adding full_name column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
                conn.commit()
                print("✅ Added full_name column")
            
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
# Auto-migrate: Add booking closeout + payout gating columns
# -------------------------
def _add_session_closeout_columns():
    """Add missing columns for session closeout and payout gating.

    This repo doesn't use Alembic; keep production resilient by adding
    new columns when the app boots.
    """
    from sqlalchemy import text, inspect

    try:
        inspector = inspect(engine)
        booking_columns = {col["name"] for col in inspector.get_columns("bookings")}
        payment_columns = {col["name"] for col in inspector.get_columns("payments")}

        with engine.connect() as conn:
            # bookings
            if "meeting_link" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN meeting_link VARCHAR"))
                conn.commit()
                print("✅ Added bookings.meeting_link")
            if "session_summary" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN session_summary TEXT"))
                conn.commit()
                print("✅ Added bookings.session_summary")
            if "session_summary_submitted_at" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN session_summary_submitted_at TIMESTAMP"))
                conn.commit()
                print("✅ Added bookings.session_summary_submitted_at")
            if "mentee_consent" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent BOOLEAN"))
                conn.commit()
                print("✅ Added bookings.mentee_consent")
            if "mentee_consent_at" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent_at TIMESTAMP"))
                conn.commit()
                print("✅ Added bookings.mentee_consent_at")
            if "mentee_consent_note" not in booking_columns:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN mentee_consent_note VARCHAR"))
                conn.commit()
                print("✅ Added bookings.mentee_consent_note")

            # payments
            if "payout_released" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN payout_released BOOLEAN DEFAULT FALSE"))
                conn.commit()
                print("✅ Added payments.payout_released")
            if "payout_released_at" not in payment_columns:
                conn.execute(text("ALTER TABLE payments ADD COLUMN payout_released_at TIMESTAMP"))
                conn.commit()
                print("✅ Added payments.payout_released_at")
    except Exception as e:
        print(f"Session closeout migration check: {str(e)}")


_add_session_closeout_columns()

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

