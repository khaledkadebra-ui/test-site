"""
Agent routes — ESG Copilot Multi-Agent System
=============================================

POST /agent/chat          Conversational coach (SustainabilityCoachAgent)
POST /agent/analyze       Full orchestrated analysis pipeline
POST /agent/compliance    VSME compliance check only
POST /agent/climate-risk  Climate risk assessment only
POST /agent/benchmark     Peer benchmark only
POST /agent/improve       Improvement action plan only
POST /agent/roadmap       Q1-Q4 implementation roadmap only
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request/Response models ────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []
    context: dict[str, Any] = {}


class ChatResponse(BaseModel):
    response: str
    ok: bool = True


class AnalyzeRequest(BaseModel):
    user_message: str
    context: dict[str, Any] = {}
    history: list[dict[str, Any]] = []


class AnalyzeResponse(BaseModel):
    answer: str
    trace: list[dict[str, Any]] = []
    ok: bool = True


class ComplianceRequest(BaseModel):
    submission_data: dict[str, Any]
    industry_code: str = "technology"


class ClimateRiskRequest(BaseModel):
    industry_code: str
    country_code: str = "DK"
    employee_count: int | None = None
    scope1_co2e: float = 0
    scope2_co2e: float = 0
    scope3_co2e: float = 0


class BenchmarkRequest(BaseModel):
    industry_code: str
    esg_score_total: float
    total_co2e_tonnes: float = 0
    employee_count: int = 25


class ImprovementRequest(BaseModel):
    esg_score_total: float
    esg_score_e: float = 0
    esg_score_s: float = 0
    esg_score_g: float = 0
    gap_areas: list[str] = []
    industry_code: str = "technology"


class RoadmapRequest(BaseModel):
    improvement_actions: list[str]
    reporting_year: int = 2025
    company_size: str = "small"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, current_user: CurrentUser):
    """Conversational ESG coach — answers questions, explains concepts, motivates."""
    from app.services.agents.sustainability_coach import SustainabilityCoachAgent
    agent = SustainabilityCoachAgent()
    result = await agent.safe_run({
        "message": body.message,
        "history": body.history,
        "context": body.context,
    })
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error", "Agent fejl"))
    return ChatResponse(response=result.get("response", ""), ok=True)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest, current_user: CurrentUser):
    """
    Full orchestrated analysis — Claude decides which specialist agents to invoke
    based on the user's message and available context.
    """
    from app.services.agents.orchestrator import AgentOrchestrator
    try:
        orchestrator = AgentOrchestrator()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    result = await orchestrator.run({
        "user_message": body.user_message,
        "context":      body.context,
        "history":      body.history,
    })
    return AnalyzeResponse(answer=result["answer"], trace=result.get("trace", []), ok=result.get("ok", True))


@router.post("/compliance")
async def compliance_check(body: ComplianceRequest, current_user: CurrentUser):
    """VSME Basic Modul completeness check — returns missing required + recommended fields."""
    from app.services.agents.vsme_compliance import VSMEComplianceAgent
    result = await VSMEComplianceAgent().safe_run({
        "submission_data": body.submission_data,
        "industry_code":   body.industry_code,
    })
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/climate-risk")
async def climate_risk(body: ClimateRiskRequest, current_user: CurrentUser):
    """Physical + transition climate risk assessment for the company's industry."""
    from app.services.agents.climate_risk import ClimateRiskAgent
    result = await ClimateRiskAgent().safe_run(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/benchmark")
async def benchmark(body: BenchmarkRequest, current_user: CurrentUser):
    """Compare ESG score + CO2 intensity vs. Danish SME industry peers."""
    from app.services.agents.benchmark import BenchmarkAgent
    result = await BenchmarkAgent().safe_run(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/improve")
async def improve(body: ImprovementRequest, current_user: CurrentUser):
    """Generate SMART improvement action plan from ESG score gaps."""
    from app.services.agents.improvement import ImprovementAgent
    result = await ImprovementAgent().safe_run(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/roadmap")
async def roadmap(body: RoadmapRequest, current_user: CurrentUser):
    """Build a Q1–Q4 implementation roadmap from improvement actions."""
    from app.services.agents.roadmap import RoadmapAgent
    result = await RoadmapAgent().safe_run(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result
