$env:DATABASE_URL="sqlite:///./test.db"
cd "d:\Five_Pillar\07Software\02metoring\menment-platform\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
