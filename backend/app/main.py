# app/main.py
from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.routes.demo_routes import router as demo_router
from app.routes.mentorship_routes import router as mentorship_router
from app.routes.ai_agent_routes import router as ai_agent_router
from app.routes.booking_routes import router as booking_router  # NEW
import app.models.note
import app.models.user
import app.models.profile
import app.models.mentorship
import app.models.mentee_intake
import app.models.booking  # NEW
from fastapi.middleware.cors import CORSMiddleware

# -------------------------
# Create FastAPI instance
# -------------------------
app = FastAPI(title="Mentoralab API")

# -------------------------
# CORS Middleware
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=False,  # Must be False when using "*"
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

