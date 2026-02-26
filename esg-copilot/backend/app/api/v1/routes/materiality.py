"""
Materiality Assessment routes — ESG Copilot

POST   /companies/{id}/materiality        Run AI materiality assessment (or return cached)
GET    /companies/{id}/materiality        Get latest materiality assessment
DELETE /companies/{id}/materiality        Clear cached assessment (force re-run)
"""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, delete

from app.core.deps import CurrentUser, DB
from app.models.company import Company
from app.models.materiality import MaterialityAssessment
from app.services.ai.materiality_agent import run_materiality_assessment, VSME_DATAPOINTS

logger = logging.getLogger(__name__)
router = APIRouter()


def _assert_access(user, company_id: UUID) -> None:
    if user.company_id != company_id and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")


def _assessment_out(ma: MaterialityAssessment) -> dict:
    return {
        "id": str(ma.id),
        "company_id": str(ma.company_id),
        "assessed_at": ma.assessed_at.isoformat(),
        "industry_code": ma.industry_code,
        "employee_count": ma.employee_count,
        "revenue_eur": float(ma.revenue_eur) if ma.revenue_eur else None,
        "country_code": ma.country_code,
        "assessment": ma.assessment,
        "model_used": ma.model_used,
        "prompt_version": ma.prompt_version,
        "datapoint_count": len(ma.assessment or {}),
    }


@router.post(
    "/companies/{company_id}/materiality",
    summary="Run AI double materiality assessment",
    status_code=status.HTTP_200_OK,
)
async def run_assessment(company_id: UUID, current_user: CurrentUser, db: DB):
    """
    Run (or return cached) materiality assessment for the company.

    Claude classifies each of the ~50 VSME datapoints as:
    - required, recommended, or not_relevant

    Results are cached. If the company profile hasn't changed since the
    last assessment, the cached result is returned instantly.
    """
    _assert_access(current_user, company_id)

    # Load company
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Check for a valid cached assessment
    cached = await _get_latest(db, company_id)
    if cached and _is_cache_valid(cached, company):
        logger.info("Returning cached materiality assessment for company %s", company_id)
        return _assessment_out(cached)

    # Run the agent
    logger.info("Running fresh materiality assessment for company %s (industry=%s)", company_id, company.industry_code)
    try:
        mat_result = await run_materiality_assessment(
            industry_code=company.industry_code,
            employee_count=company.employee_count,
            revenue_eur=float(company.revenue_eur) if company.revenue_eur else None,
            country_code=company.country_code,
        )
    except Exception as e:
        logger.error("Materiality agent failed for company %s: %s", company_id, e)
        raise HTTPException(
            status_code=503,
            detail="Materialitetsvurdering mislykkedes — prøv igen om et øjeblik.",
        )

    # Persist result
    ma = MaterialityAssessment(
        company_id=company_id,
        industry_code=company.industry_code,
        employee_count=company.employee_count,
        revenue_eur=company.revenue_eur,
        country_code=company.country_code,
        assessment=mat_result["assessment"],
        model_used=mat_result["model_used"],
        prompt_version=mat_result["prompt_version"],
    )
    db.add(ma)
    await db.commit()
    await db.refresh(ma)

    return _assessment_out(ma)


@router.get(
    "/companies/{company_id}/materiality",
    summary="Get latest materiality assessment",
)
async def get_assessment(company_id: UUID, current_user: CurrentUser, db: DB):
    """Get the most recent materiality assessment for the company."""
    _assert_access(current_user, company_id)

    ma = await _get_latest(db, company_id)
    if not ma:
        raise HTTPException(
            status_code=404,
            detail="Ingen materialitetsvurdering fundet. Kør POST for at starte.",
        )
    return _assessment_out(ma)


@router.delete(
    "/companies/{company_id}/materiality",
    summary="Clear cached materiality assessment",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def clear_assessment(company_id: UUID, current_user: CurrentUser, db: DB):
    """Delete all cached materiality assessments for the company (forces re-run)."""
    _assert_access(current_user, company_id)
    await db.execute(
        delete(MaterialityAssessment).where(MaterialityAssessment.company_id == company_id)
    )
    await db.commit()


@router.get(
    "/materiality/datapoints",
    summary="List all VSME datapoints with metadata",
)
async def list_datapoints(current_user: CurrentUser):
    """Return the full list of VSME datapoints that the agent can classify."""
    return {
        field_id: {
            "label": dp["label"],
            "section": dp["section"],
            "scope": dp["scope"],
        }
        for field_id, dp in VSME_DATAPOINTS.items()
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_latest(db, company_id: UUID) -> MaterialityAssessment | None:
    result = await db.execute(
        select(MaterialityAssessment)
        .where(MaterialityAssessment.company_id == company_id)
        .order_by(MaterialityAssessment.assessed_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _is_cache_valid(cached: MaterialityAssessment, company: Company) -> bool:
    """Cache is valid if the key company profile fields haven't changed."""
    return (
        cached.industry_code == company.industry_code
        and cached.country_code == company.country_code
        and cached.employee_count == company.employee_count
    )
