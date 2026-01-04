# Mentor Platform — Local dev & quick deploy

This repo contains a React frontend and a FastAPI backend. Quick notes to run locally and deploy the example stack.

Local development

- Start backend (FastAPI):

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Start frontend (Vite/React):

```bash
cd frontend
npm install
npm run dev
```

API demo

- Demo notes endpoint: `GET /demo/notes` (example seed created on startup).

Environment variables

- Backend: set `DATABASE_URL` and `SECRET_KEY` for production. Local defaults use SQLite at `backend/mentor.db`. When targeting Postgres locally, install the bundled psycopg3 driver (already listed in `backend/requirements.txt`) and ensure your `DATABASE_URL` starts with `postgresql+psycopg://`.
- Frontend: set `REACT_APP_API_URL` to your deployed API URL (default: `http://localhost:8000`).
- Social login: configure `FRONTEND_APP_URL`, `SOCIAL_AUTH_REDIRECT_URL`, `LINKEDIN_CLIENT_ID/SECRET/REDIRECT_URI`, and `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`. The redirect URIs must point to the backend callbacks (`/auth/oauth/linkedin/callback` and `/auth/oauth/google/callback`).

Deploy suggestions

- Frontend: deploy the `frontend` folder to Vercel (select the project root). Configure `REACT_APP_API_URL` in Vercel environment variables to point at your API.
- Backend: deploy the `backend` folder to Render or Fly or Render's Web Service. Ensure `DATABASE_URL` points to Postgres (Supabase or managed DB).
- Database: use Supabase or managed Postgres. Update `DATABASE_URL` accordingly.

Quick flow example

1. Deploy backend and set `DATABASE_URL` to a Postgres DB.
2. Deploy frontend to Vercel and set `REACT_APP_API_URL` to your backend's URL.
3. Visit frontend — it will call `/demo/notes` on the backend.

Security & next steps

- Replace SQLite with Postgres for production and use Alembic migrations.
- Add CI to run tests and linting on PRs.
