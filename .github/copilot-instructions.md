<!-- Copilot instructions for Mentor Platform repo -->
# Quick Agent Guide — Mentor Platform

Purpose: give AI coding agents immediate, actionable context to work on this repository.

Overview
- Backend: a Python FastAPI app lives under `backend/app` (entry: [backend/app/main.py](backend/app/main.py)).
- DB layer: SQLAlchemy models + Pydantic schemas (see [backend/app/models.py](backend/app/models.py) and [backend/app/schemas.py](backend/app/schemas.py)).
- Auth: JWT-based auth and role checks implemented in [backend/app/auth.py](backend/app/auth.py); tokens use `sub`/`role` and `access_token` pairs.
- Separate Prisma schema present at [backend/prisma/schema.prisma](backend/prisma/schema.prisma) and Node dependencies exist in root and `backend/package.json` — the Node/Prisma side appears partial and may be legacy or complementary.

Key patterns and conventions
- App routers: routes are registered as FastAPI routers. See [backend/app/routes/auth_routes.py](backend/app/routes/auth_routes.py) (router prefix `/auth`).
- DB startup: `Base.metadata.create_all(bind=engine)` is invoked in `main.py` – migrations are not present for SQLAlchemy here.
- Environment: secrets and connection strings are read from env vars. Look for `SECRET_KEY` and `DATABASE_URL` (default is a local SQLite `./test.db` in [backend/app/database.py](backend/app/database.py)).
- Pydantic v2 note: models use `from_attributes = True` (instead of `orm_mode`). Respect v2 field handling when producing DTOs.
- Auth flows: password hashing uses `passlib` (bcrypt). OAuth2PasswordBearer tokenUrl is `/auth/login`.

Developer workflows (what actually works from what's discoverable)
- Install Python deps: `pip install -r requirements.txt` from repo root.
- Run backend dev server: from `backend` or repo root run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- DB connection: set `DATABASE_URL` to your Postgres URL to use Postgres; otherwise the app defaults to SQLite `./test.db`.
- JWT secret: set `SECRET_KEY` in env or `.env` (auth uses `os.getenv("SECRET_KEY")`).
- Node/Prisma: root `package.json` and `backend/package.json` list Prisma and Express but there are no reliable Node start scripts. If you need Prisma client work, run `npx prisma generate` and manage migrations with Prisma CLI in the Node context.

What to look for when changing code
- When editing models, update both SQLAlchemy models ([backend/app/models.py](backend/app/models.py)) and Pydantic schemas ([backend/app/schemas.py](backend/app/schemas.py)).
- Auth changes: `backend/app/auth.py` is the central place for hashing, JWT creation, and `get_current_user` dependency; route guards use `require_role()`.
- Router changes: add routers via `app.include_router(...)` in [backend/app/main.py](backend/app/main.py).

Missing / partial areas (observed)
- The Node/Express + Prisma surface appears present but incomplete (no `src/server.js` file detected in this workspace snapshot). Treat Node artifacts as secondary unless the maintainer confirms otherwise.
- No tests or CI scripts were discovered. Avoid adding breaking changes without asking for a test/run validation step.

Quick examples for common tasks
- Add an authenticated endpoint requiring mentor role:

  - Add route in `backend/app/routes/...`, depend on `require_role("MENTOR")` from `backend/app/auth.py`.

- Create a DB-backed model change:
  - Update `models.py`, update `schemas.py`, then ensure application can start (it will auto-create tables for local testing).

If anything here is ambiguous, ask the maintainer which stack (Python FastAPI vs Node/Prisma) is authoritative before implementing cross-cutting changes.

Feedback
- I merged only discoverable facts from the codebase. Tell me which stack is primary (FastAPI or Node) and whether you want migration/test commands added; I will iterate.
