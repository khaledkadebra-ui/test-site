"""
Email Service — ESG Copilot
Sends transactional emails via Resend API.
Falls back to logging if RESEND_API_KEY is not configured.
"""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> bool:
    """Send email via Resend. Returns True on success."""
    if not settings.RESEND_API_KEY:
        logger.info("[EMAIL - no API key] To: %s | Subject: %s", to, subject)
        return True  # silently skip in dev

    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:40px 20px;">
      <div style="max-width:520px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:#0d1f2d; padding:32px; text-align:center;">
          <div style="display:inline-flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; background:#22c55e; border-radius:10px; display:inline-flex; align-items:center; justify-content:center;">
              <span style="color:white; font-size:18px;">🌿</span>
            </div>
            <span style="color:white; font-size:20px; font-weight:700;">ESG Copilot</span>
          </div>
        </div>
        <div style="padding:40px 32px;">
          <h1 style="margin:0 0 8px; font-size:24px; font-weight:700; color:#111827;">Verify your email</h1>
          <p style="color:#6b7280; margin:0 0 32px; line-height:1.6;">
            Hi {full_name or "there"}, welcome to ESG Copilot! Click the button below to verify your email address and get started.
          </p>
          <a href="{verify_url}"
             style="display:inline-block; background:#22c55e; color:white; text-decoration:none;
                    font-weight:600; font-size:16px; padding:14px 32px; border-radius:10px;">
            Verify email address →
          </a>
          <p style="color:#9ca3af; font-size:13px; margin:32px 0 0; line-height:1.6;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#f9fafb; padding:20px 32px; text-align:center;">
          <p style="color:#9ca3af; font-size:12px; margin:0;">© 2025 ESG Copilot · GDPR Compliant · EU Data Only</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send(to_email, "Verify your ESG Copilot email", html)


def send_welcome_email(to_email: str, full_name: str) -> bool:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:40px 20px;">
      <div style="max-width:520px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:#0d1f2d; padding:32px; text-align:center;">
          <span style="color:white; font-size:20px; font-weight:700;">🌿 ESG Copilot</span>
        </div>
        <div style="padding:40px 32px;">
          <h1 style="margin:0 0 8px; font-size:24px; font-weight:700; color:#111827;">Welcome to ESG Copilot! 🎉</h1>
          <p style="color:#6b7280; margin:0 0 24px; line-height:1.6;">
            Hi {full_name or "there"}, your account is ready. Here's how to get your first ESG report:
          </p>
          <div style="background:#f0fdf4; border-radius:12px; padding:24px; margin-bottom:32px;">
            <div style="margin-bottom:16px; display:flex; align-items:flex-start; gap:12px;">
              <span style="background:#22c55e; color:white; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">1</span>
              <div>
                <strong style="color:#111827;">Set up your company profile</strong>
                <p style="margin:4px 0 0; color:#6b7280; font-size:14px;">Enter your company details including industry and size.</p>
              </div>
            </div>
            <div style="margin-bottom:16px; display:flex; align-items:flex-start; gap:12px;">
              <span style="background:#22c55e; color:white; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">2</span>
              <div>
                <strong style="color:#111827;">Enter your ESG data</strong>
                <p style="margin:4px 0 0; color:#6b7280; font-size:14px;">Fill in energy, travel, procurement and governance data. Takes ~20 minutes.</p>
              </div>
            </div>
            <div style="display:flex; align-items:flex-start; gap:12px;">
              <span style="background:#22c55e; color:white; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">3</span>
              <div>
                <strong style="color:#111827;">Get your full ESG report</strong>
                <p style="margin:4px 0 0; color:#6b7280; font-size:14px;">AI generates your complete report with CO₂ footprint, ESG score, and improvement roadmap.</p>
              </div>
            </div>
          </div>
          <a href="{settings.FRONTEND_URL}/dashboard"
             style="display:inline-block; background:#22c55e; color:white; text-decoration:none;
                    font-weight:600; font-size:16px; padding:14px 32px; border-radius:10px;">
            Go to your dashboard →
          </a>
        </div>
        <div style="background:#f9fafb; padding:20px 32px; text-align:center;">
          <p style="color:#9ca3af; font-size:12px; margin:0;">© 2025 ESG Copilot · GDPR Compliant · EU Data Only</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send(to_email, "Welcome to ESG Copilot — get started in 3 steps", html)


def send_subscription_confirmation(to_email: str, full_name: str, plan: str) -> bool:
    plan_label = {"starter": "Starter", "professional": "Professional"}.get(plan, plan.title())
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:40px 20px;">
      <div style="max-width:520px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:#0d1f2d; padding:32px; text-align:center;">
          <span style="color:white; font-size:20px; font-weight:700;">🌿 ESG Copilot</span>
        </div>
        <div style="padding:40px 32px;">
          <h1 style="margin:0 0 8px; font-size:24px; font-weight:700; color:#111827;">Subscription confirmed! 🎉</h1>
          <p style="color:#6b7280; margin:0 0 24px; line-height:1.6;">
            Hi {full_name or "there"}, your <strong>{plan_label}</strong> subscription is now active.
            You now have access to all {plan_label} features.
          </p>
          <a href="{settings.FRONTEND_URL}/dashboard"
             style="display:inline-block; background:#22c55e; color:white; text-decoration:none;
                    font-weight:600; font-size:16px; padding:14px 32px; border-radius:10px;">
            Go to dashboard →
          </a>
        </div>
        <div style="background:#f9fafb; padding:20px 32px; text-align:center;">
          <p style="color:#9ca3af; font-size:12px; margin:0;">© 2025 ESG Copilot · GDPR Compliant · EU Data Only</p>
        </div>
      </div>
    </body>
    </html>
    """
    return _send(to_email, f"Your ESG Copilot {plan_label} subscription is active", html)
