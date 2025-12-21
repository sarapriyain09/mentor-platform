# reset_db.py
from app.database import Base, engine

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating tables from models...")
Base.metadata.create_all(bind=engine)

print("✅ Database reset complete! Tables recreated with latest models.")
