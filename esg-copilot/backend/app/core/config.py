"""
Application Configuration — ESG Copilot
All config loaded from environment variables (via .env file in dev).
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"         # development | staging | production
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24   # 24 hours
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/esg_copilot"

    # ── Redis (Celery task queue) ─────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # ── File Storage ─────────────────────────────────────────────────────────
    STORAGE_BACKEND: str = "local"           # local | s3 | r2
    LOCAL_STORAGE_PATH: str = "/tmp/esg-copilot/uploads"
    S3_BUCKET_NAME: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-west-1"            # EU region for GDPR compliance

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Stripe Payments ───────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_STARTER: str = ""     # monthly price ID for Starter plan
    STRIPE_PRICE_PRO: str = ""         # monthly price ID for Professional plan

    # ── Email (Resend) ────────────────────────────────────────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "ESG Copilot <noreply@esg-copilot.com>"

    # ── Calculation Engine ────────────────────────────────────────────────────
    CALCULATION_ENGINE_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
