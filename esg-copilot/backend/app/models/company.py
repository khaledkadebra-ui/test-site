"""SQLAlchemy Company model"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(100))
    industry_code: Mapped[str] = mapped_column(String(50), nullable=False)
    nace_code: Mapped[str | None] = mapped_column(String(10))
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    city: Mapped[str | None] = mapped_column(String(255))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    revenue_eur: Mapped[float | None] = mapped_column(Numeric(20, 2))
    fiscal_year_end: Mapped[str | None] = mapped_column(String(5))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users: Mapped[list["User"]] = relationship("User", back_populates="company", foreign_keys="[User.company_id]")  # type: ignore[name-defined]
    submissions: Mapped[list["DataSubmission"]] = relationship("DataSubmission", back_populates="company", cascade="all, delete-orphan")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Company {self.name} ({self.country_code})>"
