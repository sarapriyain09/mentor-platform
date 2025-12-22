# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL-encode special characters in the password
# Original password: Raja@250709 -> Raja%40250709
DATABASE_URL = "postgresql://postgres:Raja%40250709@localhost:5432/mentor_db"

# Create the engine without 'check_same_thread' (only for SQLite)
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
