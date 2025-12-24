$env:DATABASE_URL="postgresql://postgres:Raja%40250709@localhost:5432/mentor_db"
cd "d:\Five_Pillar\07Software\02metoring\menment-platform\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
