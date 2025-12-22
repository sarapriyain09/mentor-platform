from pydantic import BaseModel

# ---------- Mentor ----------
class MentorProfileCreate(BaseModel):
    full_name: str
    domains: str
    skills: str
    years_experience: int
    bio: str
    hourly_rate: float
    availability: str

class MentorProfileOut(MentorProfileCreate):
    id: int
    is_verified: bool

    class Config:
        from_attributes = True


# ---------- Mentee ----------
class MenteeProfileCreate(BaseModel):
    name: str
    goals: str
    background: str

class MenteeProfileOut(MenteeProfileCreate):
    id: int

    class Config:
        from_attributes = True
