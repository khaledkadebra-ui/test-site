"""
Company routes — ESG Copilot
POST   /companies
GET    /companies/cvr-lookup        CVR auto-fill (Danish Central Business Register)
GET    /companies/{id}
PATCH  /companies/{id}
POST   /companies/{id}/submissions
GET    /companies/{id}/submissions
"""

import logging
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import select

logger = logging.getLogger(__name__)

from app.core.deps import CurrentUser, DB
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.submission import DataSubmission
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate, SubmissionCreate, SubmissionOut

router = APIRouter()


# ── CVR Lookup ─────────────────────────────────────────────────────────────────

_INDUSTRY_MAP = {
    "Fremstilling":          "manufacturing",
    "Handel og service":     "retail",
    "Byggeri og anlæg":      "construction",
    "Transport":             "logistics",
    "Landbrug, skovbrug og fiskeri": "agriculture",
    "Hotel og restauration": "hospitality",
    "Sundhed og social":     "healthcare",
    "Finans og forsikring":  "finance",
    "IT og telekommunikation": "technology",
}


@router.get("/cvr-lookup")
async def cvr_lookup(cvr: str = Query(..., min_length=8, max_length=10)):
    """
    Look up a Danish company by CVR number using the free cvrapi.dk API.
    Returns company name, industry, employee count, city, and country.
    No auth required (used during company setup before token is stored).
    """
    cvr_clean = cvr.replace(" ", "").replace("-", "")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://cvrapi.dk/api",
                params={"search": cvr_clean, "country": "dk"},
                headers={"User-Agent": "ESG-Copilot/1.0 (support@esgcopilot.dk)"},
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="CVR-nummer ikke fundet")
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="CVR-opslag timeout — prøv igen")
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("CVR lookup failed for %s: %s", cvr_clean, exc)
        raise HTTPException(status_code=503, detail="CVR-opslag utilgængeligt")

    # Map cvrapi industry description → our industry_code
    raw_industry = data.get("industrydesc", "") or ""
    industry_code = "technology"  # default
    for dk_name, code in _INDUSTRY_MAP.items():
        if dk_name.lower() in raw_industry.lower():
            industry_code = code
            break

    return {
        "name":           data.get("name", ""),
        "cvr":            cvr_clean,
        "industry_code":  industry_code,
        "industry_desc":  raw_industry,
        "city":           data.get("city", ""),
        "country_code":   "DK",
        "employee_count": data.get("employees") or None,
    }


def _company_out(c: Company) -> CompanyOut:
    return CompanyOut(
        id=str(c.id),
        name=c.name,
        industry_code=c.industry_code,
        country_code=c.country_code,
        registration_number=c.registration_number,
        nace_code=c.nace_code,
        city=c.city,
        employee_count=c.employee_count,
        revenue_eur=float(c.revenue_eur) if c.revenue_eur else None,
        fiscal_year_end=c.fiscal_year_end,
        created_at=c.created_at.isoformat(),
    )


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(body: CompanyCreate, request: Request, current_user: CurrentUser, db: DB):
    company = Company(
        name=body.name,
        industry_code=body.industry_code,
        country_code=body.country_code,
        registration_number=body.registration_number,
        nace_code=body.nace_code,
        city=body.city,
        employee_count=body.employee_count,
        revenue_eur=body.revenue_eur,
        fiscal_year_end=body.fiscal_year_end,
        created_by=current_user.id,
    )
    db.add(company)
    await db.flush()

    # Link user to company if not already linked
    if current_user.company_id is None:
        current_user.company_id = company.id

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company.created",
        entity_type="company",
        entity_id=company.id,
        new_value={"name": company.name, "industry": company.industry_code},
        ip_address=request.client.host if request.client else None,
    ))

    return _company_out(company)


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(company_id: UUID, current_user: CurrentUser, db: DB):
    company = await _get_or_404(db, company_id)
    _assert_access(current_user, company_id)
    return _company_out(company)


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(company_id: UUID, body: CompanyUpdate, request: Request, current_user: CurrentUser, db: DB):
    company = await _get_or_404(db, company_id)
    _assert_access(current_user, company_id)

    old = {"name": company.name, "industry_code": company.industry_code}
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company.updated",
        entity_type="company",
        entity_id=company.id,
        old_value=old,
        new_value=body.model_dump(exclude_none=True),
        ip_address=request.client.host if request.client else None,
    ))

    return _company_out(company)


@router.post("/{company_id}/submissions", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(company_id: UUID, body: SubmissionCreate, current_user: CurrentUser, db: DB):
    _assert_access(current_user, company_id)
    await _get_or_404(db, company_id)

    # Check for duplicate year
    existing = await db.execute(
        select(DataSubmission).where(
            DataSubmission.company_id == company_id,
            DataSubmission.reporting_year == body.reporting_year,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Submission for year {body.reporting_year} already exists")

    sub = DataSubmission(
        company_id=company_id,
        reporting_year=body.reporting_year,
        submitted_by=current_user.id,
    )
    db.add(sub)
    await db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=company_id,
        action="submission.created",
        entity_type="submission",
        entity_id=sub.id,
        new_value={"year": body.reporting_year},
    ))

    return SubmissionOut(
        id=str(sub.id),
        company_id=str(sub.company_id),
        reporting_year=sub.reporting_year,
        status=sub.status,
        created_at=sub.created_at.isoformat(),
    )


@router.get("/{company_id}/submissions", response_model=list[SubmissionOut])
async def list_submissions(company_id: UUID, current_user: CurrentUser, db: DB):
    _assert_access(current_user, company_id)
    result = await db.execute(
        select(DataSubmission)
        .where(DataSubmission.company_id == company_id)
        .order_by(DataSubmission.reporting_year.desc())
    )
    subs = result.scalars().all()
    return [
        SubmissionOut(
            id=str(s.id),
            company_id=str(s.company_id),
            reporting_year=s.reporting_year,
            status=s.status,
            created_at=s.created_at.isoformat(),
        )
        for s in subs
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_404(db, company_id: UUID) -> Company:
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


def _assert_access(user: User, company_id: UUID) -> None:
    if user.role == "super_admin":
        return
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
