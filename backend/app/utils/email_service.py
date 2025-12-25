# app/utils/email_service.py
import os
import secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from typing import Optional

def _env(name: str, default: str = "") -> str:
    # Render / dashboards sometimes introduce accidental whitespace.
    return (os.getenv(name, default) or "").strip()


def _env_bool(name: str, default: bool = False) -> bool:
    raw = _env(name, "1" if default else "0").lower()
    return raw in {"1", "true", "yes", "y", "on"}


def _get_email_config() -> dict:
    smtp_host = _env("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(_env("SMTP_PORT", "587") or "587")
    smtp_user = _env("SMTP_USER", "")
    smtp_password = _env("SMTP_PASSWORD", "")
    from_email = _env("FROM_EMAIL", "") or smtp_user
    frontend_url = _env("FRONTEND_URL", "https://mendforworks.vercel.app")
    # Most providers use STARTTLS on 587; set SMTP_STARTTLS=false if using implicit SSL (465)
    smtp_starttls = _env_bool("SMTP_STARTTLS", True)
    smtp_use_tls = _env_bool("SMTP_USE_TLS", False)
    email_enabled = _env_bool("EMAIL_ENABLED", True)

    return {
        "SMTP_HOST": smtp_host,
        "SMTP_PORT": smtp_port,
        "SMTP_USER": smtp_user,
        "SMTP_PASSWORD": smtp_password,
        "FROM_EMAIL": from_email,
        "FRONTEND_URL": frontend_url,
        "SMTP_STARTTLS": smtp_starttls,
        "SMTP_USE_TLS": smtp_use_tls,
        "EMAIL_ENABLED": email_enabled,
    }


# Debug: Log email configuration on startup (do not log passwords)
_cfg = _get_email_config()
print(
    "📧 Email Config: "
    f"HOST={_cfg['SMTP_HOST']}, PORT={_cfg['SMTP_PORT']}, "
    f"USER={'set' if bool(_cfg['SMTP_USER']) else 'missing'}, "
    f"PASS={'set' if bool(_cfg['SMTP_PASSWORD']) else 'missing'}, "
    f"FROM={_cfg['FROM_EMAIL']}, "
    f"STARTTLS={_cfg['SMTP_STARTTLS']}, TLS={_cfg['SMTP_USE_TLS']}, ENABLED={_cfg['EMAIL_ENABLED']}"
)


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def get_reset_token_expiry() -> datetime:
    """Get expiry time for reset token (1 hour from now)"""
    return datetime.utcnow() + timedelta(hours=1)


async def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML version of email body
        text_content: Plain text version (optional, will use HTML if not provided)
    """
    cfg = _get_email_config()
    if not cfg["EMAIL_ENABLED"]:
        print(f"⚠️ Email disabled (EMAIL_ENABLED=false). Would have sent to {to_email}: {subject}")
        return False

    if not cfg["SMTP_USER"] or not cfg["SMTP_PASSWORD"]:
        print(
            f"⚠️ Email not configured (missing SMTP_USER/SMTP_PASSWORD). "
            f"Would have sent to {to_email}: {subject}"
        )
        return False
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = cfg["FROM_EMAIL"]
    message["To"] = to_email
    
    # Add plain text and HTML versions
    text_part = MIMEText(text_content or html_content, "plain")
    html_part = MIMEText(html_content, "html")
    
    message.attach(text_part)
    message.attach(html_part)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=cfg["SMTP_HOST"],
            port=cfg["SMTP_PORT"],
            username=cfg["SMTP_USER"],
            password=cfg["SMTP_PASSWORD"],
            start_tls=cfg["SMTP_STARTTLS"],
            use_tls=cfg["SMTP_USE_TLS"],
        )
        print(f"✅ Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(
            f"❌ Failed to send email to {to_email}: {type(e).__name__}: {str(e)} "
            f"(host={cfg['SMTP_HOST']} port={cfg['SMTP_PORT']} user={'set' if bool(cfg['SMTP_USER']) else 'missing'})"
        )
        return False


async def send_welcome_email(to_email: str, full_name: str, role: str):
    """Send welcome email to newly registered users"""
    subject = "Welcome to MendForWorks! 🎉"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to MendForWorks!</h1>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                
                <p>Thank you for joining MendForWorks as a <strong>{role}</strong>! We're excited to have you on board.</p>
                
                <p>{'As a mentee, you can now:' if role == 'mentee' else 'As a mentor, you can now:'}</p>
                <ul>
                    {'<li>🤖 Use our AI agent to find the perfect mentor match</li>' if role == 'mentee' else '<li>📝 Create your mentor profile to showcase your expertise</li>'}
                    {'<li>📅 Browse and connect with experienced mentors</li>' if role == 'mentee' else '<li>👥 Connect with mentees seeking your guidance</li>'}
                    {'<li>💬 Start your mentorship journey with clarity</li>' if role == 'mentee' else '<li>📅 Manage your availability and bookings</li>'}
                    <li>🎯 Track your progress and growth</li>
                </ul>
                
                <p style="text-align: center;">
                    <a href="{_get_email_config()['FRONTEND_URL']}/dashboard" class="button">Go to Dashboard</a>
                </p>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>The MendForWorks Team</p>
            </div>
            <div class="footer">
                <p>© 2025 MendForWorks. Where Clarity Meets Mentorship.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to MendForWorks!
    
    Hi {full_name},
    
    Thank you for joining MendForWorks as a {role}! We're excited to have you on board.
    
    Visit your dashboard: {_get_email_config()['FRONTEND_URL']}/dashboard
    
    Best regards,
    The MendForWorks Team
    
    © 2025 MendForWorks. Where Clarity Meets Mentorship.
    """
    
    await send_email(to_email, subject, html_content, text_content)


async def send_password_reset_email(to_email: str, full_name: str, reset_token: str):
    """Send password reset email with reset link"""
    reset_link = f"{_get_email_config()['FRONTEND_URL']}/reset-password?token={reset_token}"
    subject = "Reset Your MendForWorks Password"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                
                <p>We received a request to reset your password for your MendForWorks account.</p>
                
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </p>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all;">
                    {reset_link}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Security Note:</strong><br>
                    This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </div>
                
                <p>Best regards,<br>The MendForWorks Team</p>
            </div>
            <div class="footer">
                <p>© 2025 MendForWorks. Where Clarity Meets Mentorship.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Password Reset Request
    
    Hi {full_name},
    
    We received a request to reset your password for your MendForWorks account.
    
    Reset your password here: {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, please ignore this email.
    
    Best regards,
    The MendForWorks Team
    
    © 2025 MendForWorks. Where Clarity Meets Mentorship.
    """
    
    await send_email(to_email, subject, html_content, text_content)
