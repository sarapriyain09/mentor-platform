# Deployment Guide - Mentor Platform

## Prerequisites
- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)

## Step 1: Push Code to GitHub

```bash
cd D:\Five_Pillar\07Software\02metoring\mentor-platform
git add .
git commit -m "Prepare for deployment - Week 1-3 features complete"
git push origin master
```

## Step 2: Deploy Backend to Render

### 2.1 Create PostgreSQL Database
1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Name: `mentor-platform-db`
4. Region: Choose closest to you
5. Plan: Free (for testing)
6. Click "Create Database"
7. **IMPORTANT**: Copy the "Internal Database URL" from the database page

### 2.2 Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `sarapriyain09/mentor-platform`
3. Configure:
   - **Name**: `mentor-platform-backend`
   - **Region**: Same as database
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r ../requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. Add Environment Variables:
   - `DATABASE_URL` = (Paste the Internal Database URL from step 2.1)
   - `SECRET_KEY` = `your-super-secret-jwt-key-change-this-in-production-12345`

5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. **Copy your backend URL** (e.g., `https://mentor-platform-backend.onrender.com`)

### 2.3 Update CORS Origins
After deployment, update `backend/app/main.py`:
- Add your Render backend URL to `allow_origins`
- Add your Vercel frontend URL (we'll get this next)

## Step 3: Deploy Frontend to Vercel

### 3.1 Update API URL
Before deploying, update `frontend/src/api.js`:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

And update all fetch calls to use this base URL.

### 3.2 Deploy to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import `sarapriyain09/mentor-platform`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
5. Add Environment Variable:
   - `VITE_API_URL` = (Your Render backend URL from step 2.2)

6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. **Copy your Vercel URL** (e.g., `https://mentor-platform.vercel.app`)

## Step 4: Update CORS

1. Go back to your code
2. Update `backend/app/main.py`:

```python
allow_origins=[
    "https://mentor-platform.vercel.app",  # Your Vercel URL
    "http://localhost:5173",
    "http://localhost:3000"
],
```

3. Commit and push:
```bash
git add .
git commit -m "Update CORS for production"
git push origin master
```

4. Render will auto-deploy the update

## Step 5: Initialize Production Database

1. In Render dashboard, go to your backend service
2. Click "Shell" tab
3. Run:
```bash
python -c "from app.database import Base, engine; from app.models.user import User; from app.models.profile import MentorProfile, MenteeProfile; from app.models.mentorship import MentorshipRequest, Mentorship; from app.models.note import Note; Base.metadata.create_all(bind=engine); print('Tables created')"
```

## Step 6: Test Production

1. Visit your Vercel URL
2. Register a new account
3. Create profile
4. Test all features

## Deployment URLs

- **Frontend**: https://mentor-platform.vercel.app (your actual URL)
- **Backend**: https://mentor-platform-backend.onrender.com (your actual URL)
- **API Docs**: https://mentor-platform-backend.onrender.com/docs

## Important Notes

### Free Tier Limitations:
- **Render**: Backend sleeps after 15 min inactivity (takes 30s to wake up)
- **Render DB**: 90-day expiration on free tier
- **Vercel**: 100GB bandwidth/month

### Security Reminders:
- Change `SECRET_KEY` to a strong random value
- Never commit `.env` files
- Use Render's environment variables dashboard for secrets

## Troubleshooting

### Backend won't start:
- Check logs in Render dashboard
- Verify environment variables are set
- Check `requirements.txt` has all dependencies

### Frontend can't connect:
- Verify `VITE_API_URL` is set correctly
- Check CORS origins in backend
- Check Network tab in browser DevTools

### Database errors:
- Verify `DATABASE_URL` format
- Run table creation command
- Check Render database logs

## Next Steps After Deployment

1. Custom domain (optional)
2. SSL certificate (automatic with Render/Vercel)
3. Monitoring and logging
4. Backup strategy
5. Upgrade to paid plans for production use
