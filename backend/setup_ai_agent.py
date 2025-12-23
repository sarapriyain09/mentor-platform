# backend/setup_ai_agent.py
"""
Complete setup script for AI Agent feature
"""
from app.database import Base, engine
from app.models.user import User
from app.models.profile import MentorProfile, MenteeProfile
from app.models.mentorship import MentorshipRequest, Mentorship
from app.models.mentee_intake import MenteeIntake, MentorMatch
import app.models.note

def setup_ai_agent():
    """Complete setup for AI agent feature"""
    print("=" * 60)
    print("AI MENTORSHIP AGENT - SETUP")
    print("=" * 60)
    
    print("\n[1/3] Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created/verified successfully!")
        print("   - users")
        print("   - mentor_profiles")
        print("   - mentee_profiles")
        print("   - mentorship_requests")
        print("   - mentorships")
        print("   - mentee_intakes (NEW)")
        print("   - mentor_matches (NEW)")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return
    
    print("\n[2/3] Verifying table structure...")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    required_tables = ['mentee_intakes', 'mentor_matches']
    for table in required_tables:
        if table in tables:
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"✅ {table}: {len(columns)} columns")
        else:
            print(f"❌ {table}: NOT FOUND")
    
    print("\n[3/3] Setup complete!")
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Register AI agent routes in main.py:")
    print("   from app.routes.ai_agent_routes import router as ai_agent_router")
    print("   app.include_router(ai_agent_router)")
    print("\n2. Run the backend server:")
    print("   uvicorn app.main:app --reload")
    print("\n3. Test the AI agent at:")
    print("   POST http://127.0.0.1:8000/ai-agent/chat")
    print("   GET  http://127.0.0.1:8000/ai-agent/matches")
    print("=" * 60)

if __name__ == "__main__":
    setup_ai_agent()