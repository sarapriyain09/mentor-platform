# app/main.py

from fastapi import FastAPI
from app.database import engine
from app import models

from app.routes.auth_routes import router as auth_router
from app.routes.profile_routes import router as profile_router
from app.routes.session_routes import router as session_router

# ======================
# CREATE DATABASE TABLES
# ======================
models.Base.metadata.create_all(bind=engine)

# ======================
# FASTAPI APP
# ======================
app = FastAPI(
    title="Mentorship Platform API",
    version="2.0"
)

# ======================
# ROUTES
# ======================
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(session_router)

# ======================
# HEALTH CHECK
# ======================
@app.get("/")
def root():
    return {"status": "Mentorship Platform API running"}
