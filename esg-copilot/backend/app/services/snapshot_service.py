"""
SnapshotService
===============
Saves ESG snapshots after report generation and retrieves historical data.
Snapshots are upserted per company per calendar month — one per month, newest report wins.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.esg_snapshot import EsgSnapshot

logger = logging.getLogger(__name__)


async def save_snapshot(
    db: AsyncSession,
    *,
    company_id: str,
    report_id: str,
    results: Any,          # ReportResults ORM object
    company: Any,          # Company ORM object
    reporting_year: int | None = None,
) -> EsgSnapshot:
    """
    Upsert an ESG snapshot for the current calendar month.
    If a snapshot already exists for this company+month, it is overwritten.
    """
    now = datetime.now(tz=timezone.utc)

    # Delete existing snapshot for same company+month (upsert via delete+insert)
    await db.execute(
        delete(EsgSnapshot).where(
            EsgSnapshot.company_id == company_id,
            EsgSnapshot.snapshot_month == now.month,
            EsgSnapshot.snapshot_year == now.year,
        )
    )

    snap = EsgSnapshot(
        company_id=company_id,
        report_id=report_id,
        snapshot_month=now.month,
        snapshot_year=now.year,
        reporting_year=reporting_year,
        # ESG scores
        esg_score_total=float(results.esg_score_total) if results.esg_score_total is not None else None,
        esg_score_e=float(results.esg_score_e) if results.esg_score_e is not None else None,
        esg_score_s=float(results.esg_score_s) if results.esg_score_s is not None else None,
        esg_score_g=float(results.esg_score_g) if results.esg_score_g is not None else None,
        esg_rating=results.esg_rating,
        industry_percentile=float(results.industry_percentile) if results.industry_percentile is not None else None,
        # CO2 — convert kg → tonnes
        total_co2e_tonnes=(float(results.total_co2e_kg) / 1000) if results.total_co2e_kg is not None else None,
        scope1_co2e_tonnes=(float(results.scope1_co2e_kg) / 1000) if results.scope1_co2e_kg is not None else None,
        scope2_co2e_tonnes=(float(results.scope2_co2e_kg) / 1000) if results.scope2_co2e_kg is not None else None,
        scope3_co2e_tonnes=(float(results.scope3_co2e_kg) / 1000) if results.scope3_co2e_kg is not None else None,
        # Company context
        employee_count=getattr(company, "employee_count", None),
        industry_code=getattr(company, "industry_code", None),
    )

    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    logger.info("Snapshot saved for company %s (%d/%d)", company_id, now.month, now.year)
    return snap


async def get_history(
    db: AsyncSession,
    company_id: str,
    limit: int = 24,
) -> list[dict]:
    """Return up to `limit` snapshots, oldest first."""
    result = await db.execute(
        select(EsgSnapshot)
        .where(EsgSnapshot.company_id == company_id)
        .order_by(EsgSnapshot.snapshot_year.asc(), EsgSnapshot.snapshot_month.asc())
        .limit(limit)
    )
    snaps = result.scalars().all()
    return [s.to_dict() for s in snaps]


async def get_trends(
    db: AsyncSession,
    company_id: str,
) -> dict:
    """
    Compute trend summary from snapshot history.
    Returns: latest scores, change vs previous, direction indicators.
    """
    history = await get_history(db, company_id, limit=24)

    if not history:
        return {"has_data": False, "snapshots": []}

    latest = history[-1]
    previous = history[-2] if len(history) >= 2 else None

    def delta(key: str) -> float | None:
        if previous is None:
            return None
        a = latest.get(key)
        b = previous.get(key)
        if a is None or b is None:
            return None
        return round(a - b, 2)

    def direction(key: str) -> str:
        d = delta(key)
        if d is None:
            return "stable"
        if d > 0.5:
            return "up"
        if d < -0.5:
            return "down"
        return "stable"

    return {
        "has_data": True,
        "snapshots": history,
        "latest": latest,
        "previous": previous,
        "changes": {
            "esg_score_total": delta("esg_score_total"),
            "esg_score_e": delta("esg_score_e"),
            "esg_score_s": delta("esg_score_s"),
            "esg_score_g": delta("esg_score_g"),
            "total_co2e_tonnes": delta("total_co2e_tonnes"),
        },
        "directions": {
            "esg_score_total": direction("esg_score_total"),
            "esg_score_e": direction("esg_score_e"),
            "esg_score_s": direction("esg_score_s"),
            "esg_score_g": direction("esg_score_g"),
            # CO2: lower is better, so invert
            "total_co2e_tonnes": (
                "down" if direction("total_co2e_tonnes") == "up"
                else "up" if direction("total_co2e_tonnes") == "down"
                else "stable"
            ),
        },
    }
