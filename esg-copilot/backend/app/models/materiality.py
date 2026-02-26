"""SQLAlchemy MaterialityAssessment model"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MaterialityAssessment(Base):
    """
    Stores the AI-generated double materiality assessment for a company.

    The `assessment` JSONB column holds the per-datapoint classification:
    {
      "electricity_kwh": {"materiality": "required",  "reason": "All companies use electricity..."},
      "water_withdrawal": {"materiality": "not_relevant", "reason": "IT sector — low water use..."},
      ...
    }

    Materiality values: "required" | "recommended" | "not_relevant"
    """

    __tablename__ = "materiality_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Snapshot of company profile at assessment time (for cache invalidation)
    industry_code: Mapped[str | None] = mapped_column(String(50))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    revenue_eur: Mapped[float | None] = mapped_column(Numeric(20, 2))
    country_code: Mapped[str | None] = mapped_column(String(2))

    # The full assessment result
    assessment: Mapped[dict | None] = mapped_column(JSONB)

    # Metadata
    model_used: Mapped[str | None] = mapped_column(String(100))
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")

    def __repr__(self) -> str:
        return f"<MaterialityAssessment company={self.company_id} at={self.assessed_at}>"
