"""Celery app configuration"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "esg_copilot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.report_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,             # re-queue on worker crash
    worker_prefetch_multiplier=1,    # one task at a time per worker
)
