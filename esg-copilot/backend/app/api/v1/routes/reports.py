"""
Report routes — ESG Copilot

POST /reports/generate              Trigger async report generation
GET  /reports/{id}                  Full report results
GET  /reports/{id}/status           Poll generation status
GET  /reports/{id}/pdf              Download PDF (when ready)
GET  /companies/{company_id}/reports  Report history
"""

import uuid
from uuid import UUID

from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DB
from app.models.audit_log import AuditLog
from app.models.report import Report, ReportResults
from app.models.submission import DataSubmission
from app.models.company import Company
from app.schemas.report import GenerateReportRequest, ReportOut, ReportStatusOut

router = APIRouter()


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    body: GenerateReportRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DB,
):
    """
    Kick off report generation for a submitted data submission.

    Pipeline (runs in background via Celery in Week 5, BackgroundTasks for now):
    1. Load all submission data
    2. CO2Calculator → deterministic numbers
    3. ESGScorer → deterministic scores
    4. GapAnalyzer → deterministic roadmap
    5. ReportWriter (LLM) → narrative text
    6. PDFBuilder → downloadable PDF
    """
    # Validate submission exists and is submitted
    result = await db.execute(
        select(DataSubmission)
        .options(
            selectinload(DataSubmission.energy_data),
            selectinload(DataSubmission.travel_data),
            selectinload(DataSubmission.procurement_data),
            selectinload(DataSubmission.policy_data),
            selectinload(DataSubmission.company),
        )
        .where(DataSubmission.id == body.submission_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role != "super_admin" and sub.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if sub.status not in ("submitted", "processed"):
        raise HTTPException(
            status_code=422,
            detail=f"Submission must be in 'submitted' status (current: '{sub.status}'). "
                   f"Call POST /submissions/{{id}}/submit first.",
        )

    # Check if active report already exists
    existing = await db.execute(
        select(Report).where(
            Report.submission_id == body.submission_id,
            Report.status.in_(["draft", "processing"]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A report is already being generated for this submission")

    # Create report record
    report = Report(
        id=uuid.uuid4(),
        company_id=sub.company_id,
        submission_id=sub.id,
        status="processing",
        created_by=current_user.id,
    )
    db.add(report)
    await db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=sub.company_id,
        action="report.generated",
        entity_type="report",
        entity_id=report.id,
        new_value={"submission_id": str(sub.id), "year": sub.reporting_year},
    ))

    # Queue the actual generation (Week 5: replace with Celery task)
    background_tasks.add_task(_run_report_pipeline, str(report.id), str(sub.id))

    return {
        "report_id": str(report.id),
        "status": "processing",
        "message": "Report generation started. Poll GET /reports/{report_id}/status for updates.",
    }


@router.get("/{report_id}/status", response_model=ReportStatusOut)
async def get_report_status(report_id: UUID, current_user: CurrentUser, db: DB):
    report = await _get_report_or_404(db, report_id)
    _assert_access(current_user, report.company_id)
    return ReportStatusOut(
        report_id=str(report.id),
        status=report.status,
        created_at=report.created_at.isoformat(),
        completed_at=report.completed_at.isoformat() if report.completed_at else None,
        pdf_ready=report.pdf_url is not None,
        error_message=report.error_message,
    )


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.results))
        .where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    _assert_access(current_user, report.company_id)

    if report.status != "completed":
        raise HTTPException(
            status_code=425,
            detail=f"Report is not ready yet (status: {report.status}). Poll /reports/{report_id}/status",
        )

    r = report.results
    return ReportOut(
        report_id=str(report.id),
        status=report.status,
        version=report.version,
        disclaimer=report.disclaimer,
        # CO2
        scope1_co2e_tonnes=float(r.scope1_co2e_kg or 0) / 1000,
        scope2_co2e_tonnes=float(r.scope2_co2e_kg or 0) / 1000,
        scope3_co2e_tonnes=float(r.scope3_co2e_kg or 0) / 1000,
        total_co2e_tonnes=float(r.total_co2e_kg or 0) / 1000,
        scope1_breakdown=r.scope1_breakdown or {},
        scope2_breakdown=r.scope2_breakdown or {},
        scope3_breakdown=r.scope3_breakdown or {},
        # ESG scores
        esg_score_total=float(r.esg_score_total or 0),
        esg_score_e=float(r.esg_score_e or 0),
        esg_score_s=float(r.esg_score_s or 0),
        esg_score_g=float(r.esg_score_g or 0),
        esg_rating=r.esg_rating or "E",
        industry_percentile=float(r.industry_percentile or 0),
        identified_gaps=r.identified_gaps or [],
        recommendations=r.recommendations or [],
        # AI narrative
        executive_summary=r.executive_summary or "",
        co2_narrative=r.co2_narrative or "",
        esg_narrative=r.esg_narrative or "",
        roadmap_narrative=r.roadmap_narrative or "",
        pdf_url=report.pdf_url,
        completed_at=report.completed_at.isoformat() if report.completed_at else None,
    )


@router.get("/{report_id}/pdf")
async def download_pdf(report_id: UUID, current_user: CurrentUser, db: DB):
    report = await _get_report_or_404(db, report_id)
    _assert_access(current_user, report.company_id)
    if not report.pdf_url:
        raise HTTPException(status_code=425, detail="PDF not ready yet")

    db.add(AuditLog(
        user_id=current_user.id,
        company_id=report.company_id,
        action="report.downloaded",
        entity_type="report",
        entity_id=report.id,
    ))

    from app.services.storage.file_storage import get_storage
    url = get_storage().presigned_url(report.pdf_url, expires_in=300)
    return {"download_url": url, "expires_in_seconds": 300}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_report_or_404(db, report_id: UUID) -> Report:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


def _assert_access(user, company_id: UUID) -> None:
    if user.role == "super_admin":
        return
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")


async def _run_report_pipeline(report_id: str, submission_id: str):
    """
    Temporary BackgroundTask shim — Week 5 replaces this with Celery.
    Runs the full deterministic pipeline then calls the LLM for narratives.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Starting report pipeline: report_id=%s", report_id)

    from app.core.database import AsyncSessionLocal
    from app.services.esg_engine.calculator import CO2Calculator, Scope1Input, Scope2Input, Scope3Input
    from app.services.esg_engine.scorer import ESGScorer, ScorerInput
    from app.services.esg_engine.gap_analyzer import GapAnalyzer
    from app.services.ai.report_writer import ReportWriter
    from app.core.config import settings
    from datetime import datetime, timezone
    from uuid import UUID

    async with AsyncSessionLocal() as db:
        try:
            # Load report + submission
            result = await db.execute(
                select(Report)
                .options(selectinload(Report.results))
                .where(Report.id == UUID(report_id))
            )
            report = result.scalar_one_or_none()
            if not report:
                return

            sub_result = await db.execute(
                select(DataSubmission)
                .options(
                    selectinload(DataSubmission.energy_data),
                    selectinload(DataSubmission.travel_data),
                    selectinload(DataSubmission.procurement_data),
                    selectinload(DataSubmission.policy_data),
                    selectinload(DataSubmission.company),
                )
                .where(DataSubmission.id == UUID(submission_id))
            )
            sub = sub_result.scalar_one_or_none()
            if not sub:
                raise ValueError("Submission not found")

            ed = sub.energy_data
            td = sub.travel_data
            pd = sub.procurement_data
            pol = sub.policy_data
            company = sub.company

            # ── 1. CO2 Calculation ───────────────────────────────────────────
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
                    country_code=company.country_code,
                ),
                scope3=Scope3Input(
                    air_short_haul_km=float(td.air_short_haul_km or 0) if td else 0,
                    air_long_haul_km=float(td.air_long_haul_km or 0) if td else 0,
                    air_business_class_pct=float(td.air_business_class_pct or 0) if td else 0,
                    rail_km=float(td.rail_km or 0) if td else 0,
                    rental_car_km=float(td.rental_car_km or 0) if td else 0,
                    taxi_km=float(td.taxi_km or 0) if td else 0,
                    employee_count=company.employee_count or 0,
                    avg_commute_km_one_way=float(td.avg_commute_km_one_way or 0) if td else 0,
                    commute_days_per_year=int(td.commute_days_per_year or 220) if td else 220,
                    purchased_goods_spend_eur=float(pd.purchased_goods_spend_eur or 0) if pd else 0,
                    industry_code=company.industry_code,
                ),
            )

            # ── 2. ESG Scoring ───────────────────────────────────────────────
            scorer = ESGScorer()
            score = scorer.score(ScorerInput(
                industry_code=company.industry_code,
                employee_count=company.employee_count or 0,
                country_code=company.country_code,
                revenue_eur=float(company.revenue_eur or 0),
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

            # ── 3. Gap Analysis ──────────────────────────────────────────────
            gaps = GapAnalyzer().analyze(score)

            # ── 4. AI Narratives ─────────────────────────────────────────────
            writer = ReportWriter()
            exec_summary = await writer.write_executive_summary(company.name, sub.reporting_year, co2, score, gaps)
            co2_narrative = await writer.write_co2_narrative(company.name, sub.reporting_year, co2, company.industry_code)
            esg_narrative = await writer.write_esg_narrative(company.name, score)
            roadmap_narrative = await writer.write_roadmap_narrative(company.name, score, gaps)

            # ── 5. Save results ──────────────────────────────────────────────
            rr = ReportResults(
                report_id=report.id,
                scope1_co2e_kg=co2.scope1_total_kg,
                scope2_co2e_kg=co2.scope2_total_kg,
                scope3_co2e_kg=co2.scope3_total_kg,
                total_co2e_kg=co2.total_kg,
                scope1_breakdown=co2.scope1_breakdown,
                scope2_breakdown=co2.scope2_breakdown,
                scope3_breakdown=co2.scope3_breakdown,
                esg_score_total=score.total,
                esg_score_e=score.environmental.score,
                esg_score_s=score.social.score,
                esg_score_g=score.governance.score,
                esg_rating=score.rating,
                industry_percentile=score.industry_percentile,
                e_breakdown=score.environmental.breakdown,
                s_breakdown=score.social.breakdown,
                g_breakdown=score.governance.breakdown,
                identified_gaps=score.environmental.gaps + score.social.gaps + score.governance.gaps,
                recommendations=gaps.to_dict()["actions"],
                executive_summary=exec_summary,
                co2_narrative=co2_narrative,
                esg_narrative=esg_narrative,
                roadmap_narrative=roadmap_narrative,
                ai_model_used=settings.OPENAI_MODEL,
                calculation_engine_version=settings.CALCULATION_ENGINE_VERSION,
            )
            db.add(rr)

            report.status = "completed"
            report.completed_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info("Report completed: report_id=%s", report_id)

        except Exception as e:
            logger.exception("Report pipeline failed: report_id=%s", report_id)
            try:
                report.status = "failed"
                report.error_message = str(e)
                await db.commit()
            except Exception:
                pass
