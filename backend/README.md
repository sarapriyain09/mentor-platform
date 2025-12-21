# Mentorship Platform – Web-Based Learning & Guidance System

## Overview

The Mentorship Platform is a web-based application designed to connect mentors and mentees in a structured, secure, and scalable environment. The platform enables users to register, authenticate, manage profiles, schedule mentoring sessions, and receive personalized mentor recommendations.

This repository focuses on a clean backend architecture, secure authentication, and role-based access control — suitable for real-world, production-ready use and for demonstrating backend engineering skills.

## Key Features

- **Authentication & Authorization**: User registration and login, secure password hashing (bcrypt via passlib), JWT-based authentication, and role-based access (mentor / mentee).
- **User Roles**: Mentors create profiles (expertise, availability); mentees create profiles (goals, interests). Endpoints restricted by role.
- **Profile Management**: One-to-one mentor/mentee profiles tied to user accounts.
- **Session Management**: Mentees can request mentoring sessions with scheduled date/time and status tracking.
- **Extensible**: Easy to extend with features like AI recommendations, confirmations, notifications, payments, or chat.

## Technology Stack

- **FastAPI** – Python web framework
- **PostgreSQL** – Relational database (via `DATABASE_URL` env var)
- **SQLAlchemy** – ORM
- **Pydantic** – Data validation and serialization
- **python-jose** – JWT handling
- **passlib (bcrypt)** – Password hashing
- **Uvicorn** – ASGI server

## Architecture

- Modular structure: `app/models.py`, `app/schemas.py`, `app/routes/`, `app/auth.py`, `app/database.py`
- Clear separation of concerns for models, schemas, routes, and authentication
- Designed for RESTful APIs with OpenAPI docs (FastAPI auto-generated)

## Quick Start (Development)

1. Create a Python virtual environment and install dependencies (example):

   ````powershell
   python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
   ````

2. Set required environment variables (example `.env`):

   - `DATABASE_URL` — e.g. `postgresql://postgres:password@localhost:5432/mentorship`
   - `SECRET_KEY` — replace the default secret in `app/auth.py`

3. Run the app (development):

   ````powershell
   uvicorn app.main:app --reload
   ````

4. Open the interactive API docs at `http://127.0.0.1:8000/docs`.

## Notes & Security

- Replace the placeholder `SECRET_KEY` in `app/auth.py` with a strong secret and load it from env.
- Ensure `DATABASE_URL` points to a secure, managed Postgres instance in production.
- Review JWT lifetime and refresh strategies for your safety requirements.

## Useful Files

- `app/main.py` — app entrypoint and router registration
- `app/models.py` — SQLAlchemy models
- `app/schemas.py` — Pydantic request/response schemas
- `app/auth.py` — password hashing, JWT helpers, role-based helpers
- `app/database.py` — DB engine/session helpers

---

If you'd like, I can also:

- Add a `requirements.txt` or `pyproject.toml` listing Python dependencies
- Add CI workflow for linting and tests
- Create Postgres Docker Compose for local development

