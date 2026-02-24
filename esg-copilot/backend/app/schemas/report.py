"""Pydantic schemas for report endpoints"""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class GenerateReportRequest(BaseModel):
    submission_id: UUID
    include_ai_narrative: bool = True


class ReportStatusOut(BaseModel):
    report_id: str
    status: str          # draft | processing | completed | failed
    created_at: str
    completed_at: Optional[str]
    pdf_ready: bool
    error_message: Optional[str]


class ReportOut(BaseModel):
    report_id: str
    status: str
    version: int
    disclaimer: str

    # CO2 (in tonnes for display)
    scope1_co2e_tonnes: float
    scope2_co2e_tonnes: float
    scope3_co2e_tonnes: float
    total_co2e_tonnes: float
    scope1_breakdown: dict
    scope2_breakdown: dict
    scope3_breakdown: dict

    # ESG scores
    esg_score_total: float
    esg_score_e: float
    esg_score_s: float
    esg_score_g: float
    esg_rating: str
    industry_percentile: float

    # Gaps and actions
    identified_gaps: list
    recommendations: list

    # AI narrative
    executive_summary: str
    co2_narrative: str
    esg_narrative: str
    roadmap_narrative: str

    pdf_url: Optional[str]
    completed_at: Optional[str]
