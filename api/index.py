# Vercel serverless function entrypoint
import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import and expose the FastAPI app
from app.main import app
