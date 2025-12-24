from pydantic import BaseModel

class TestUserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

# Test it
u = TestUserCreate(email='test@test.com', password='pass', full_name='Test Name', role='MENTEE')
print(f"✅ Works! full_name = {u.full_name}")
print(f"Fields: {TestUserCreate.model_fields.keys()}")
