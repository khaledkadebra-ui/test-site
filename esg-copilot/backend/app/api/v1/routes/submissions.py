"""
Submission data input routes — ESG Copilot

PATCH /submissions/{id}/energy               Save energy & fuel data
PATCH /submissions/{id}/travel               Save travel & commuting data
PATCH /submissions/{id}/procurement          Save procurement data
PATCH /submissions/{id}/policies             Save ESG policy answers
POST  /submissions/{id}/submit               Mark as ready for report generation
GET   /submissions/{id}                      Get full submission + all data
GET   /submissions/{id}/completeness         Check what's missing
GET   /submissions/{id}/calculate-preview    Run CO2 calc live (no DB write)
GET   /submissions/{id}/score-preview        Run ESG scoring live (no DB write)
"""

from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DB
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.submission import (
    DataSubmission, EnergyData, TravelData, ProcurementData, ESGPolicyData,
    VSMEWorkforceData, VSMEEnvironmentData,
)
from app.schemas.submission import (
    EnergyDataInput, TravelDataInput, ProcurementDataInput,
    PolicyDataInput, CompletenessCheck, SubmissionFull,
    VSMEWorkforceDataIn, VSMEEnvironmentDataIn,
)

router = APIRouter()


# ── GET /submissions/{id} ─────────────────────────────────────────────────────

@router.get("/{submission_id}", response_model=SubmissionFull)
async def get_submission(submission_id: UUID, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)

    def _row_to_dict(obj) -> dict | None:
        if obj is None:
            return None
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns
                if c.name not in ("id", "submission_id", "created_at", "updated_at")}

    return SubmissionFull(
        id=str(sub.id),
        company_id=str(sub.company_id),
        reporting_year=sub.reporting_year,
        status=sub.status,
        energy=_row_to_dict(sub.energy_data),
        travel=_row_to_dict(sub.travel_data),
        procurement=_row_to_dict(sub.procurement_data),
        policies=_row_to_dict(sub.policy_data),
        created_at=sub.created_at.isoformat(),
    )


# ── PATCH /submissions/{id}/energy ───────────────────────────────────────────

@router.patch("/{submission_id}/energy", status_code=status.HTTP_200_OK)
async def save_energy(submission_id: UUID, body: EnergyDataInput, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.energy_data:
        ed = sub.energy_data
    else:
        ed = EnergyData(submission_id=sub.id)
        db.add(ed)

    for field, value in body.model_dump().items():
        if hasattr(ed, field):
            setattr(ed, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="energy_data", entity_id=sub.id,
    ))
    return {"message": "Energy data saved"}


# ── PATCH /submissions/{id}/travel ───────────────────────────────────────────

@router.patch("/{submission_id}/travel", status_code=status.HTTP_200_OK)
async def save_travel(submission_id: UUID, body: TravelDataInput, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.travel_data:
        td = sub.travel_data
    else:
        td = TravelData(submission_id=sub.id)
        db.add(td)

    for field, value in body.model_dump().items():
        if hasattr(td, field):
            setattr(td, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="travel_data", entity_id=sub.id,
    ))
    return {"message": "Travel data saved"}


# ── PATCH /submissions/{id}/procurement ──────────────────────────────────────

@router.patch("/{submission_id}/procurement", status_code=status.HTTP_200_OK)
async def save_procurement(submission_id: UUID, body: ProcurementDataInput, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.procurement_data:
        pd = sub.procurement_data
    else:
        pd = ProcurementData(submission_id=sub.id)
        db.add(pd)

    for field, value in body.model_dump().items():
        if hasattr(pd, field):
            setattr(pd, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="procurement_data", entity_id=sub.id,
    ))
    return {"message": "Procurement data saved"}


# ── PATCH /submissions/{id}/policies ─────────────────────────────────────────

@router.patch("/{submission_id}/policies", status_code=status.HTTP_200_OK)
async def save_policies(submission_id: UUID, body: PolicyDataInput, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.policy_data:
        pol = sub.policy_data
    else:
        pol = ESGPolicyData(submission_id=sub.id)
        db.add(pol)

    for field, value in body.model_dump().items():
        if hasattr(pol, field):
            setattr(pol, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="policy_data", entity_id=sub.id,
    ))
    return {"message": "Policy data saved"}


# ── PATCH /submissions/{id}/workforce ────────────────────────────────────────

@router.patch("/{submission_id}/workforce", status_code=status.HTTP_200_OK)
async def save_workforce(submission_id: UUID, body: VSMEWorkforceDataIn, current_user: CurrentUser, db: DB):
    """Save VSME B8-B10: Medarbejdere, arbejdsmiljø og løn."""
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.workforce_data:
        wf = sub.workforce_data
    else:
        wf = VSMEWorkforceData(submission_id=sub.id)
        db.add(wf)

    for field, value in body.model_dump(exclude_unset=False).items():
        if hasattr(wf, field) and value is not None:
            setattr(wf, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="vsme_workforce_data", entity_id=sub.id,
    ))
    return {"message": "Medarbejderdata gemt (B8-B10)"}


# ── PATCH /submissions/{id}/environment ──────────────────────────────────────

@router.patch("/{submission_id}/environment", status_code=status.HTTP_200_OK)
async def save_environment(submission_id: UUID, body: VSMEEnvironmentDataIn, current_user: CurrentUser, db: DB):
    """Save VSME B4-B7: Forurening, biodiversitet, vand og affald."""
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    if sub.environment_data:
        env = sub.environment_data
    else:
        env = VSMEEnvironmentData(submission_id=sub.id)
        db.add(env)

    for field, value in body.model_dump(exclude_unset=False).items():
        if hasattr(env, field):
            setattr(env, field, value)

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="data.updated", entity_type="vsme_environment_data", entity_id=sub.id,
    ))
    return {"message": "Miljødata gemt (B4-B7)"}


# ── POST /submissions/{id}/submit ─────────────────────────────────────────────

@router.post("/{submission_id}/submit", status_code=status.HTTP_200_OK)
async def submit(submission_id: UUID, current_user: CurrentUser, db: DB):
    """Mark submission as ready. Validates completeness first."""
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    _assert_editable(sub)

    completeness = _check_completeness(sub)
    if not completeness.is_complete:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Submission is incomplete. Fix blocking issues before submitting.",
                "blocking_issues": completeness.blocking_issues,
            },
        )

    sub.status = "submitted"
    sub.submitted_at = datetime.now(timezone.utc)
    sub.submitted_by = current_user.id

    db.add(AuditLog(
        user_id=current_user.id, company_id=sub.company_id,
        action="submission.submitted", entity_type="submission", entity_id=sub.id,
    ))
    return {"message": "Submission accepted. You can now generate a report.", "submission_id": str(sub.id)}


# ── GET /submissions/{id}/completeness ───────────────────────────────────────

@router.get("/{submission_id}/completeness", response_model=CompletenessCheck)
async def completeness(submission_id: UUID, current_user: CurrentUser, db: DB):
    sub = await _load_submission(db, submission_id)
    _assert_access(current_user, sub.company_id)
    return _check_completeness(sub)


# ── GET /submissions/{id}/calculate-preview ──────────────────────────────────

@router.get("/{submission_id}/calculate-preview")
async def calculate_preview(submission_id: UUID, current_user: CurrentUser, db: DB):
    """
    Run the CO2 calculator against current submission data.
    Returns results instantly — nothing is written to the database.
    Use this to give users live feedback as they fill in data.
    """
    from app.services.esg_engine.calculator import (
        CO2Calculator, Scope1Input, Scope2Input, Scope3Input,
    )
    from sqlalchemy.orm import selectinload as sio

    sub_result = await db.execute(
        select(DataSubmission)
        .options(
            sio(DataSubmission.energy_data),
            sio(DataSubmission.travel_data),
            sio(DataSubmission.procurement_data),
            sio(DataSubmission.company),
        )
        .where(DataSubmission.id == submission_id)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    _assert_access(current_user, sub.company_id)

    ed, td, pd, co = sub.energy_data, sub.travel_data, sub.procurement_data, sub.company

    calc = CO2Calculator()
    report = calc.calculate(
        scope1=Scope1Input(
            natural_gas_m3=float(ed.natural_gas_m3 or 0) if ed else 0,
            diesel_liters=float(ed.diesel_liters or 0) if ed else 0,
            petrol_liters=float(ed.petrol_liters or 0) if ed else 0,
            lpg_liters=float(ed.lpg_liters or 0) if ed else 0,
            heating_oil_liters=float(ed.heating_oil_liters or 0) if ed else 0,
            coal_kg=float(ed.coal_kg or 0) if ed else 0,
            company_car_km=float(ed.company_car_km or 0) if ed else 0,
            company_van_km=float(ed.company_van_km or 0) if ed else 0,
            company_truck_km=float(ed.company_truck_km or 0) if ed else 0,
        ),
        scope2=Scope2Input(
            electricity_kwh=float(ed.electricity_kwh or 0) if ed else 0,
            district_heating_kwh=float(ed.district_heating_kwh or 0) if ed else 0,
            country_code=co.country_code if co else "EU_AVERAGE",
        ),
        scope3=Scope3Input(
            air_short_haul_km=float(td.air_short_haul_km or 0) if td else 0,
            air_long_haul_km=float(td.air_long_haul_km or 0) if td else 0,
            air_business_class_pct=float(td.air_business_class_pct or 0) if td else 0,
            rail_km=float(td.rail_km or 0) if td else 0,
            rental_car_km=float(td.rental_car_km or 0) if td else 0,
            employee_count=co.employee_count or 0 if co else 0,
            avg_commute_km_one_way=float(td.avg_commute_km_one_way or 0) if td else 0,
            commute_days_per_year=int(td.commute_days_per_year or 220) if td else 220,
            purchased_goods_spend_eur=float(pd.purchased_goods_spend_eur or 0) if pd else 0,
            industry_code=co.industry_code if co else "general",
        ),
    )

    return {
        "preview": True,
        "note": "Live calculation — not saved. Generate a report to persist these results.",
        "scope1_tonnes": round(report.scope1_tonnes, 3),
        "scope2_tonnes": round(report.scope2_tonnes, 3),
        "scope3_tonnes": round(report.scope3_tonnes, 3),
        "total_tonnes": round(report.total_tonnes, 3),
        "scope1_breakdown": report.scope1_breakdown,
        "scope2_breakdown": report.scope2_breakdown,
        "scope3_breakdown": report.scope3_breakdown,
        "warnings": report.warnings,
        "emission_factor_sources": ["IPCC AR6 (2022)", "DEFRA 2023", "IEA 2023"],
    }


# ── GET /submissions/{id}/score-preview ──────────────────────────────────────

@router.get("/{submission_id}/score-preview")
async def score_preview(submission_id: UUID, current_user: CurrentUser, db: DB):
    """
    Run the full CO2 + ESG scoring pipeline against current submission data.
    Returns scores, category breakdowns, gaps, and quick wins instantly.
    Nothing is written to the database.
    """
    from app.services.esg_engine.calculator import (
        CO2Calculator, Scope1Input, Scope2Input, Scope3Input,
    )
    from app.services.esg_engine.scorer import ESGScorer, ScorerInput
    from app.services.esg_engine.gap_analyzer import GapAnalyzer
    from sqlalchemy.orm import selectinload as sio

    sub_result = await db.execute(
        select(DataSubmission)
        .options(
            sio(DataSubmission.energy_data),
            sio(DataSubmission.travel_data),
            sio(DataSubmission.procurement_data),
            sio(DataSubmission.policy_data),
            sio(DataSubmission.company),
        )
        .where(DataSubmission.id == submission_id)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    _assert_access(current_user, sub.company_id)

    ed, td, pd, pol, co = (
        sub.energy_data, sub.travel_data, sub.procurement_data,
        sub.policy_data, sub.company,
    )

    # CO2 first (needed for intensity calculation)
    calc = CO2Calculator()
    co2 = calc.calculate(
        scope1=Scope1Input(
            natural_gas_m3=float(ed.natural_gas_m3 or 0) if ed else 0,
            diesel_liters=float(ed.diesel_liters or 0) if ed else 0,
            petrol_liters=float(ed.petrol_liters or 0) if ed else 0,
            lpg_liters=float(ed.lpg_liters or 0) if ed else 0,
            heating_oil_liters=float(ed.heating_oil_liters or 0) if ed else 0,
            coal_kg=float(ed.coal_kg or 0) if ed else 0,
            company_car_km=float(ed.company_car_km or 0) if ed else 0,
            company_van_km=float(ed.company_van_km or 0) if ed else 0,
            company_truck_km=float(ed.company_truck_km or 0) if ed else 0,
        ),
        scope2=Scope2Input(
            electricity_kwh=float(ed.electricity_kwh or 0) if ed else 0,
            district_heating_kwh=float(ed.district_heating_kwh or 0) if ed else 0,
            country_code=co.country_code if co else "EU_AVERAGE",
        ),
        scope3=Scope3Input(
            air_short_haul_km=float(td.air_short_haul_km or 0) if td else 0,
            air_long_haul_km=float(td.air_long_haul_km or 0) if td else 0,
            employee_count=co.employee_count or 0 if co else 0,
            avg_commute_km_one_way=float(td.avg_commute_km_one_way or 0) if td else 0,
            commute_days_per_year=int(td.commute_days_per_year or 220) if td else 220,
            purchased_goods_spend_eur=float(pd.purchased_goods_spend_eur or 0) if pd else 0,
            industry_code=co.industry_code if co else "general",
        ),
    )

    # ESG scoring
    scorer = ESGScorer()
    score = scorer.score(ScorerInput(
        industry_code=co.industry_code if co else "general",
        employee_count=co.employee_count or 0 if co else 0,
        country_code=co.country_code if co else "EU_AVERAGE",
        revenue_eur=float(co.revenue_eur or 0) if co else 0,
        reporting_year=sub.reporting_year,
        total_co2e_tonnes=co2.total_tonnes,
        scope2_co2e_tonnes=co2.scope2_tonnes,
        electricity_kwh=float(ed.electricity_kwh or 0) if ed else 0,
        renewable_electricity_pct=float(ed.renewable_electricity_pct or 0) if ed else 0,
        has_energy_reduction_target=pol.has_energy_reduction_target if pol else False,
        has_net_zero_target=pol.has_net_zero_target if pol else False,
        waste_recycled_pct=float(pol.waste_recycled_pct) if pol and pol.waste_recycled_pct else None,
        has_waste_policy=pol.has_waste_policy if pol else False,
        has_water_policy=pol.has_water_policy if pol else False,
        has_health_safety_policy=pol.has_health_safety_policy if pol else False,
        lost_time_injury_rate=float(pol.lost_time_injury_rate) if pol and pol.lost_time_injury_rate else None,
        has_training_program=pol.has_training_program if pol else False,
        avg_training_hours_per_employee=float(pol.avg_training_hours_per_employee or 0) if pol else 0,
        has_diversity_policy=pol.has_diversity_policy if pol else False,
        female_management_pct=float(pol.female_management_pct) if pol and pol.female_management_pct else None,
        living_wage_commitment=pol.living_wage_commitment if pol else False,
        has_esg_policy=pol.has_esg_policy if pol else False,
        has_code_of_conduct=pol.has_code_of_conduct if pol else False,
        has_anti_corruption_policy=pol.has_anti_corruption_policy if pol else False,
        has_data_privacy_policy=pol.has_data_privacy_policy if pol else False,
        has_board_esg_oversight=pol.has_board_esg_oversight if pol else False,
        esg_reporting_year=pol.esg_reporting_year if pol else None,
        supply_chain_code_of_conduct=pol.supply_chain_code_of_conduct if pol else False,
    ))

    gaps = GapAnalyzer().analyze(score)

    return {
        "preview": True,
        "note": "Live scoring — not saved. Generate a report to persist these results.",
        "esg_score": score.to_dict(),
        "co2_summary": {
            "scope1_tonnes": round(co2.scope1_tonnes, 2),
            "scope2_tonnes": round(co2.scope2_tonnes, 2),
            "scope3_tonnes": round(co2.scope3_tonnes, 2),
            "total_tonnes": round(co2.total_tonnes, 2),
        },
        "gap_summary": {
            "total_gaps": gaps.total_gaps,
            "high_priority_count": gaps.high_priority_count,
            "quick_wins": [a.title for a in gaps.quick_wins],
            "potential_score_gain": gaps.total_potential_score_gain,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

async def _load_submission(db, submission_id: UUID) -> DataSubmission:
    result = await db.execute(
        select(DataSubmission)
        .options(
            selectinload(DataSubmission.energy_data),
            selectinload(DataSubmission.travel_data),
            selectinload(DataSubmission.procurement_data),
            selectinload(DataSubmission.policy_data),
            selectinload(DataSubmission.workforce_data),
            selectinload(DataSubmission.environment_data),
        )
        .where(DataSubmission.id == submission_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


def _assert_access(user, company_id: UUID) -> None:
    if user.role == "super_admin":
        return
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")


def _assert_editable(sub: DataSubmission) -> None:
    if sub.status in ("processing", "processed"):
        raise HTTPException(status_code=409, detail="Submission is locked — report generation is in progress")


def _check_completeness(sub: DataSubmission) -> CompletenessCheck:
    sections = {}
    blocking = []

    # ── Energy data (required) ─────────────────────────────────────────────
    ed = sub.energy_data
    energy_missing = []
    if not ed:
        energy_missing.append("No energy data entered")
        blocking.append("Energy data is required — at minimum, electricity consumption (kWh)")
    else:
        total_energy = float(ed.electricity_kwh or 0) + float(ed.natural_gas_m3 or 0) + float(ed.diesel_liters or 0)
        if total_energy == 0:
            energy_missing.append("All energy inputs are zero — enter at least electricity_kwh")
            blocking.append("At least one energy source must be non-zero")

    sections["energy"] = {
        "complete": len(energy_missing) == 0,
        "missing": energy_missing,
    }

    # ── Travel data (recommended, not blocking) ────────────────────────────
    td = sub.travel_data
    travel_missing = []
    if not td:
        travel_missing.append("No travel data entered (Scope 3 Cat 6+7 will be zero)")
    sections["travel"] = {"complete": td is not None, "missing": travel_missing}

    # ── Procurement data (recommended, not blocking) ───────────────────────
    pd = sub.procurement_data
    procurement_missing = []
    if not pd:
        procurement_missing.append("No procurement data entered (Scope 3 Cat 1 will be zero)")
    sections["procurement"] = {"complete": pd is not None, "missing": procurement_missing}

    # ── Policy data (required for ESG scoring) ────────────────────────────
    pol = sub.policy_data
    policy_missing = []
    if not pol:
        policy_missing.append("No policy answers entered — ESG score will be minimal")
        blocking.append("Policy questionnaire is required for ESG scoring")
    sections["policies"] = {
        "complete": pol is not None,
        "missing": policy_missing,
    }

    total_sections = len(sections)
    complete_sections = sum(1 for v in sections.values() if v["complete"])
    pct = round((complete_sections / total_sections) * 100)

    return CompletenessCheck(
        is_complete=len(blocking) == 0,
        completion_pct=pct,
        sections=sections,
        blocking_issues=blocking,
    )
