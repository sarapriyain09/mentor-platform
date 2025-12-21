# app/main.py
from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.database import Base, engine, SessionLocal
from app.routes import auth_routes
import app.models.note  # ensure Note model is registered with Base
from app.routes.demo_routes import router as demo_router

# -------------------------
# Create FastAPI instance
# -------------------------
app = FastAPI(title="Mentoralab API")

# -------------------------
# Include Routers
# -------------------------
app.include_router(auth_router)
app.include_router(profile_router)

from fastapi.middleware.cors import CORSMiddleware

@app.get("/")
def read_root():
    return {"status": "FastAPI running"}

@app.get("/api/tasks")
def get_tasks():
    return [{"id": 1, "title": "Learn FastAPI"}, {"id": 2, "title": "Deploy React"}]

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-react-app.vercel.app"],  # or ["*"] for testing
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",npm  "https://your-react-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables
Base.metadata.create_all(bind=engine)


# Include routes
app.include_router(auth_routes.router)
app.include_router(demo_router)


# Create a demo note if none exist
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
