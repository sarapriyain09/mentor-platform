# Mentor Platform - Development Setup & Run Guide

## ✅ Sanity Check Status (December 24, 2025)

### System Status
- **Backend**: Running on port 8001 (PostgreSQL)
- **Frontend**: Running on port 5173 (Vite dev server)
- **Database**: PostgreSQL `mentor_db` on localhost:5432
- **Auth System**: ✅ Fully functional
- **E2E Tests**: ✅ 3/3 passing (100%)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.14
- Node.js & npm
- PostgreSQL running on localhost:5432
- Database: `mentor_db` with user `postgres` (password: `Raja@250709`)

### 1. Start Backend (Port 8001)

```powershell
# Option A: Using PowerShell script
cd backend
.\start_postgres_server.ps1

# Option B: Manual start
cd backend
$env:DATABASE_URL="postgresql://postgres:Raja%40250709@localhost:5432/mentor_db"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

**Backend URL**: http://localhost:8001
**API Docs**: http://localhost:8001/docs

### 2. Start Frontend (Port 5173)

```powershell
cd frontend
npm run dev
```

**Frontend URL**: http://localhost:5173

---

## 🧪 Testing

### Backend Auth Tests

```powershell
cd backend
python auth_repro.py
```

**Expected Output**:
- ✅ Registration (POST /auth/register) - 200 OK
- ✅ Login (POST /auth/login) - 200 OK, returns JWT token
- ✅ Protected endpoint (GET /auth/users) - 200 OK, returns user list

### Frontend E2E Tests

```powershell
cd frontend
$env:FRONTEND_TEST_URL="http://localhost:5173"
npx playwright test
```

**Expected Output**: 3 passed
- ✅ Complete auth flow: register → login → dashboard
- ✅ Login with existing user
- ✅ Homepage redirects correctly

---

## 🔧 Recent Fixes Applied

### Database Schema
- ✅ Added `full_name` column to `users` table
- ✅ Synchronized all 3 UserCreate schemas:
  - `backend/app/schemas.py`
  - `backend/app/schemas/user.py`
  - `backend/app/schemas/user_schema.py`

### Backend
- ✅ Fixed bcrypt compatibility (upgraded to 4.2.1)
- ✅ Updated `backend/app/models/user.py` - added `full_name` field
- ✅ Updated `backend/app/routes/auth_routes.py` - saves `full_name` during registration
- ✅ Fixed Pydantic v2 warnings (changed `orm_mode` to `from_attributes`)

### Frontend
- ✅ Updated page title from "frontend" to "Mentor Platform"
- ✅ Fixed API URL from port 8000 to 8001 in:
  - `frontend/src/api.js`
  - `frontend/src/Login.jsx`
- ✅ Added `full_name` field to registration form in `frontend/src/Register.jsx`
- ✅ Fixed role values to uppercase `MENTEE`/`MENTOR`

---

## 📊 Current Database Users

14 users registered (IDs 1-14), including:
- Test users from backend auth tests
- E2E test users from Playwright tests
- Manual test accounts

---

## 🗂️ File Structure (Key Files)

```
backend/
├── app/
│   ├── models/user.py         # User model with full_name
│   ├── schemas/               # Pydantic schemas (3 files updated)
│   ├── routes/auth_routes.py  # Auth endpoints
│   └── main.py                # FastAPI app
├── auth_repro.py              # Auth testing script
├── requirements.txt           # Updated with bcrypt 4.2.1
└── start_postgres_server.ps1  # Server startup script

frontend/
├── src/
│   ├── Login.jsx              # Login component (port 8001)
│   ├── Register.jsx           # Register with full_name
│   └── api.js                 # API client (port 8001)
├── tests/
│   ├── auth-flow.spec.js      # E2E auth tests (NEW)
│   └── example.spec.js        # Updated redirect test
└── index.html                 # Title: "Mentor Platform"
```

---

## 🐛 Known Issues / Cleanup Needed

### Debug Scripts (Can be removed after review):
- `backend/auth_repro.py` - Keep for manual testing
- `backend/test_postgres.py` - Keep for DB verification
- `backend/add_fullname_column.py` - Can remove (one-time migration)
- `backend/check_schema.py` - Can remove (debug only)
- `backend/test_direct_postgres.py` - Can remove (debug only)
- `backend/test_direct_user.py` - Can remove (debug only)
- `backend/test_pydantic.py` - Can remove (debug only)

### Pydantic Warning
- Console shows: `UserWarning: Valid config keys have changed in V2`
- Non-breaking, but schemas should eventually update all `Config.orm_mode` to `from_attributes`
- Already fixed in main schemas, may exist in other models

---

## 🔐 Environment Variables

### Backend
```
DATABASE_URL=postgresql://postgres:Raja%40250709@localhost:5432/mentor_db
SECRET_KEY=your_secret_key_here  # Default in code, should set for production
```

### Frontend
```
VITE_API_URL=http://127.0.0.1:8001  # Default in code
FRONTEND_TEST_URL=http://localhost:5173  # For E2E tests
```

---

## 📝 Next Steps (Week 5 Plan Remaining)

- [ ] Implement payment system (Stripe webhooks, commission, mentor balances)
- [ ] Create payment E2E test
- [ ] Remove debug scripts
- [ ] Add migration system for database changes
- [ ] Document payment flow
- [ ] Production deployment checklist

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```powershell
# 1. Check servers are running
netstat -ano | findstr ":8001 :5173"

# 2. Verify database schema
cd backend
python test_postgres.py

# 3. Run backend auth test
python auth_repro.py

# 4. Run frontend E2E tests
cd ..\frontend
npx playwright test

# 5. Manual smoke test
# - Open http://localhost:5173
# - Register new account
# - Login
# - Verify redirect to dashboard
```

---

**Last Updated**: December 24, 2025 22:31 UTC
**Status**: ✅ All systems operational, E2E tests passing
