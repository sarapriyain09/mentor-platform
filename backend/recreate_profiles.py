from app.database import engine, Base
from app.models.user import User
from app.models.profile import MentorProfile, MenteeProfile
from app.models.note import Note

# Drop profile tables
with engine.connect() as conn:
    conn.execute(Base.metadata.tables['mentor_profiles'].delete())
    conn.execute(Base.metadata.tables['mentee_profiles'].delete())
    conn.commit()
    print("Cleared profile data")

# Drop and recreate tables
MentorProfile.__table__.drop(engine, checkfirst=True)
MenteeProfile.__table__.drop(engine, checkfirst=True)
print("Dropped profile tables")

# Recreate with correct schema
Base.metadata.create_all(bind=engine)
print("Recreated all tables with correct schema")
