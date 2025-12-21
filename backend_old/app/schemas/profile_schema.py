from pydantic import BaseModel

# Mentor Profile
class MentorProfileCreate(BaseModel):
    expertise: str
    bio: str | None = None

class MentorProfileOut(BaseModel):
    id: int
    user_id: int
    expertise: str
    bio: str | None = None

    class Config:
        from_attributes = True


# Mentee Profile
class MenteeProfileCreate(BaseModel):
    goals: str
    bio: str | None = None

class MenteeProfileOut(BaseModel):
    id: int
    user_id: int
    goals: str
    bio: str | None = None

    class Config:
        from_attributes = True
