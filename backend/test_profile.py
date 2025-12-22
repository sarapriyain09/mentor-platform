from app.database import SessionLocal
from app.models.profile import MentorProfile
from app.schemas.profile_schema import MentorProfileCreate

db = SessionLocal()

# Test data
profile_data = MentorProfileCreate(
    full_name="John Mentor",
    domains="Tech",
    skills="Python, FastAPI",
    years_experience=5,
    bio="Senior dev",
    hourly_rate=50,
    availability="Weekdays"
)

print("Profile data:", profile_data.model_dump())

try:
    new_profile = MentorProfile(user_id=3, **profile_data.model_dump())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    print("Success! Profile created:", new_profile.id)
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
