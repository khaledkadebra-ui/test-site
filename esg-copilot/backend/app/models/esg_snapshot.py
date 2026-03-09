"""SQLAlchemy EsgSnapshot model — monthly ESG data history per company."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EsgSnapshot(Base):
    __tablename__ = "esg_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)

    snapshot_month: Mapped[int] = mapped_column(Integer, nullable=False)   # 1–12
    snapshot_year: Mapped[int] = mapped_column(Integer, nullable=False)
    reporting_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ESG scores
    esg_score_total: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_e: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_s: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_g: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_rating: Mapped[str | None] = mapped_column(String(1))
    industry_percentile: Mapped[float | None] = mapped_column(Numeric(5, 2))

    # CO2 (stored as tonnes)
    total_co2e_tonnes: Mapped[float | None] = mapped_column(Numeric(12, 3))
    scope1_co2e_tonnes: Mapped[float | None] = mapped_column(Numeric(12, 3))
    scope2_co2e_tonnes: Mapped[float | None] = mapped_column(Numeric(12, 3))
    scope3_co2e_tonnes: Mapped[float | None] = mapped_column(Numeric(12, 3))

    employee_count: Mapped[int | None] = mapped_column(Integer)
    industry_code: Mapped[str | None] = mapped_column(String(100))
    extra_data: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "company_id": str(self.company_id),
            "report_id": str(self.report_id) if self.report_id else None,
            "snapshot_month": self.snapshot_month,
            "snapshot_year": self.snapshot_year,
            "reporting_year": self.reporting_year,
            "label": f"{_MONTHS[self.snapshot_month - 1]} {self.snapshot_year}",
            "esg_score_total": float(self.esg_score_total) if self.esg_score_total is not None else None,
            "esg_score_e": float(self.esg_score_e) if self.esg_score_e is not None else None,
            "esg_score_s": float(self.esg_score_s) if self.esg_score_s is not None else None,
            "esg_score_g": float(self.esg_score_g) if self.esg_score_g is not None else None,
            "esg_rating": self.esg_rating,
            "industry_percentile": float(self.industry_percentile) if self.industry_percentile is not None else None,
            "total_co2e_tonnes": float(self.total_co2e_tonnes) if self.total_co2e_tonnes is not None else None,
            "scope1_co2e_tonnes": float(self.scope1_co2e_tonnes) if self.scope1_co2e_tonnes is not None else None,
            "scope2_co2e_tonnes": float(self.scope2_co2e_tonnes) if self.scope2_co2e_tonnes is not None else None,
            "scope3_co2e_tonnes": float(self.scope3_co2e_tonnes) if self.scope3_co2e_tonnes is not None else None,
            "industry_code": self.industry_code,
            "employee_count": self.employee_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
