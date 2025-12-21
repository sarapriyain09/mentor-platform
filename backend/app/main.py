# app/main.py
from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.database import Base, engine
from app.routes import auth_routes

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables
Base.metadata.create_all(bind=engine)


# Include routes
app.include_router(auth_routes.router)
