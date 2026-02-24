"""
ESG Copilot — Backend API
FastAPI application entry point.
"""

import uuid
import time
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
import app.models  # noqa: F401 — ensures all ORM models are registered

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="ESG Copilot API",
    description="AI-powered ESG analysis and reporting platform for SMEs.",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request ID + timing middleware ────────────────────────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start = time.perf_counter()

    response = await call_next(request)

    elapsed = round((time.perf_counter() - start) * 1000, 1)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = str(elapsed)

    logger.info("%s %s → %d (%sms) [%s]", request.method, request.url.path, response.status_code, elapsed, request_id)
    return response

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
            "request_id": getattr(request.state, "request_id", None),
        },
    )

# ── Routes ────────────────────────────────────────────────────────────────────
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "engine_version": settings.CALCULATION_ENGINE_VERSION,
    }

# ── Calculation engine smoke test (dev only) ──────────────────────────────────
if settings.ENVIRONMENT == "development":
    from app.services.esg_engine.calculator import CO2Calculator, Scope1Input, Scope2Input, Scope3Input
    from app.services.esg_engine.scorer import ESGScorer, ScorerInput
    from app.services.esg_engine.gap_analyzer import GapAnalyzer

    @app.get("/dev/engine-test", tags=["dev"])
    async def engine_test():
        """Quick smoke test for the calculation + scoring pipeline."""
        calc = CO2Calculator()
        report = calc.calculate(
            scope1=Scope1Input(natural_gas_m3=5000, diesel_liters=2000, company_car_km=50000),
            scope2=Scope2Input(electricity_kwh=80000, country_code="DK"),
            scope3=Scope3Input(air_short_haul_km=15000, employee_count=25, avg_commute_km_one_way=12, purchased_goods_spend_eur=200000, industry_code="technology"),
        )

        scorer = ESGScorer()
        score = scorer.score(ScorerInput(
            industry_code="technology", employee_count=25, country_code="DK",
            revenue_eur=2_000_000, reporting_year=2025,
            total_co2e_tonnes=report.total_tonnes, scope2_co2e_tonnes=report.scope2_tonnes,
            electricity_kwh=80000, renewable_electricity_pct=50,
            has_health_safety_policy=True, has_diversity_policy=False,
            has_esg_policy=False, has_data_privacy_policy=True,
            has_code_of_conduct=True, has_anti_corruption_policy=False,
            has_training_program=True, avg_training_hours_per_employee=16,
        ))

        analyzer = GapAnalyzer()
        gaps = analyzer.analyze(score)

        return {
            "co2_result": report.to_dict(),
            "esg_score": score.to_dict(),
            "gaps": gaps.to_dict(),
        }
