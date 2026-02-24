"""SQLAlchemy Report + ReportResults models"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

_DISCLAIMER = (
    "This report is an AI-generated draft. CO2 calculations use published emission factors "
    "(IPCC AR6, DEFRA 2023, IEA 2023) but have not been independently verified. "
    "This report does not constitute CSRD compliance certification or assurance."
)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="RESTRICT"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    pdf_url: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False, default=_DISCLAIMER)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped["DataSubmission"] = relationship("DataSubmission", back_populates="reports")  # type: ignore[name-defined]
    results: Mapped["ReportResults | None"] = relationship("ReportResults", back_populates="report", uselist=False, cascade="all, delete-orphan")


class ReportResults(Base):
    __tablename__ = "report_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    # CO2 — always kg, displayed as tonnes
    scope1_co2e_kg: Mapped[float | None] = mapped_column(Numeric(20, 4))
    scope2_co2e_kg: Mapped[float | None] = mapped_column(Numeric(20, 4))
    scope3_co2e_kg: Mapped[float | None] = mapped_column(Numeric(20, 4))
    total_co2e_kg: Mapped[float | None] = mapped_column(Numeric(20, 4))

    scope1_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    scope2_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    scope3_breakdown: Mapped[dict | None] = mapped_column(JSONB)

    # ESG scores
    esg_score_total: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_e: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_s: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_score_g: Mapped[float | None] = mapped_column(Numeric(5, 2))
    esg_rating: Mapped[str | None] = mapped_column(String(1))
    industry_percentile: Mapped[float | None] = mapped_column(Numeric(5, 2))

    e_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    s_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    g_breakdown: Mapped[dict | None] = mapped_column(JSONB)

    identified_gaps: Mapped[list | None] = mapped_column(JSONB)
    recommendations: Mapped[list | None] = mapped_column(JSONB)

    # AI narrative — text only
    executive_summary: Mapped[str | None] = mapped_column(Text)
    co2_narrative: Mapped[str | None] = mapped_column(Text)
    esg_narrative: Mapped[str | None] = mapped_column(Text)
    roadmap_narrative: Mapped[str | None] = mapped_column(Text)

    calculation_engine_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    ai_model_used: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    report: Mapped[Report] = relationship("Report", back_populates="results")
