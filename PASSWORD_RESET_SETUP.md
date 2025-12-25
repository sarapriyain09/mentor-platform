# Password Reset & Email Setup Guide

## ✅ What's Been Added

### Backend Features:
1. **Password Reset Endpoints**:
   - `POST /auth/forgot-password` - Request password reset
   - `POST /auth/reset-password` - Reset password with token

2. **Email Functionality**:
   - Welcome email sent on registration
   - Password reset email with secure token
   - Beautifully designed HTML emails with MendForWorks branding

3. **Database Updates**:
   - Added `reset_token` column to users table
   - Added `reset_token_expiry` column (1-hour expiration)

### Frontend Features:
1. **New Pages**:
   - `/forgot-password` - Request password reset
   - `/reset-password?token=xxx` - Reset password form
   - "Forgot password?" link on login page

## 🚀 Setup Instructions

### 1. Install New Dependencies

```bash
cd backend
pip install python-dotenv aiosmtplib
```

### 2. Configure Email (IMPORTANT!)

#### Option A: Gmail (Recommended for Development)

1. Enable 2-factor authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password named "MendForWorks"
4. Copy the generated password

#### Option B: Other Email Providers

- **SendGrid**: Use API key as password
- **Mailgun**: Get SMTP credentials from dashboard
- **Outlook/Yahoo**: Use regular credentials

### 3. Update Environment Variables

Create or update `backend/.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
FROM_EMAIL=noreply@mendforworks.com
FRONTEND_URL=https://mendforworks.vercel.app
```

For **Render deployment**, add these environment variables in your Render dashboard.

### 4. Run Database Migration

```bash
cd backend
python add_password_reset_columns.py
```

This adds the new `reset_token` and `reset_token_expiry` columns to your existing database.

### 5. Restart Backend

```bash
cd backend
uvicorn app.main:app --reload
```

## 📧 Email Templates

### Welcome Email
- Sent automatically when users register
- Personalized based on role (mentor/mentee)
- Includes dashboard link and feature highlights

### Password Reset Email
- Sent when user requests password reset
- Contains secure reset link (expires in 1 hour)
- Warns if request wasn't made by user

## 🔒 Security Features

1. **Token Security**:
   - 32-byte random tokens using `secrets.token_urlsafe()`
   - 1-hour expiration
   - Single-use tokens (cleared after reset)

2. **Email Enumeration Protection**:
   - Same response whether email exists or not
   - Prevents attackers from discovering registered emails

3. **Background Tasks**:
   - Emails sent asynchronously
   - Doesn't block user registration/password reset requests

## 🧪 Testing

### Test Registration Email:
1. Register a new account
2. Check your email for welcome message

### Test Password Reset:
1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check email for reset link
5. Click link and enter new password

## ⚠️ Without Email Configuration

If you don't configure email (leave SMTP_USER empty):
- App will still work normally
- Console will show: "⚠️ Email not configured"
- Password reset won't work (users won't receive tokens)
- Welcome emails won't be sent

## 🌐 Production Deployment

### Vercel (Frontend):
No changes needed - already configured in `vercel.json`

### Render (Backend):
Add these environment variables in Render Dashboard → Your Service → Environment:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@mendforworks.com
FRONTEND_URL=https://mendforworks.vercel.app
```

## 📝 API Documentation

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "If that email exists, a password reset link has been sent"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "secure-random-token-from-email",
  "new_password": "newpassword123"
}

Response: 200 OK
{
  "message": "Password has been reset successfully"
}
```

## 🎨 Customization

Email templates are in `backend/app/utils/email_service.py`:
- Modify HTML for custom branding
- Change colors to match your theme
- Add more information or links

## 🐛 Troubleshooting

### Email not sending?
- Check SMTP credentials
- Verify app password (not regular password for Gmail)
- Check server logs for error messages
- Test SMTP connection: `python -m smtplib`

### Reset link not working?
- Token may have expired (1 hour limit)
- Check FRONTEND_URL matches your deployment
- Verify database migration ran successfully

### Database error?
- Run migration script: `python add_password_reset_columns.py`
- Or delete `test.db` and restart server to recreate tables
