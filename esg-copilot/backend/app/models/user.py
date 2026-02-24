"""SQLAlchemy User model"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="company_admin")
    company_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ── Email verification ────────────────────────────────────────────────────
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verify_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Stripe / Subscription ─────────────────────────────────────────────────
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")   # free | starter | professional
    subscription_status: Mapped[str] = mapped_column(String(50), nullable=False, default="inactive")  # inactive | active | trialing | past_due | cancelled
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="users", foreign_keys=[company_id])  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"

    @property
    def has_active_subscription(self) -> bool:
        return self.subscription_status in ("active", "trialing")

    @property
    def plan_limits(self) -> dict:
        limits = {
            "free":         {"reports_per_year": 1,  "pdf_download": False, "ai_narratives": True},
            "starter":      {"reports_per_year": 5,  "pdf_download": True,  "ai_narratives": True},
            "professional": {"reports_per_year": 999, "pdf_download": True,  "ai_narratives": True},
        }
        return limits.get(self.subscription_plan, limits["free"])
