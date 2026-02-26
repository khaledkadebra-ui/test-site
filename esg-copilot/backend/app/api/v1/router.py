"""API v1 Router"""

from fastapi import APIRouter

from app.api.v1.routes import auth, companies, submissions, documents, reports, billing, materiality

api_router = APIRouter()

api_router.include_router(auth.router,        prefix="/auth",        tags=["auth"])
api_router.include_router(companies.router,   prefix="/companies",   tags=["companies"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(documents.router,   prefix="/documents",   tags=["documents"])
api_router.include_router(reports.router,     prefix="/reports",     tags=["reports"])
api_router.include_router(billing.router,     prefix="/billing",     tags=["billing"])
api_router.include_router(materiality.router, prefix="",             tags=["materiality"])
