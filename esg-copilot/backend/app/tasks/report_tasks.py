"""
Async report generation task — ESG Copilot
Week 5 will fill this in. Stub shows the full pipeline flow.
"""

import logging
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="generate_report", max_retries=2)
def generate_report(self, report_id: str, submission_id: str):
    """
    Full report generation pipeline (runs async via Celery):

    1. Load submission data from DB
    2. Build Scope1Input / Scope2Input / Scope3Input
    3. CO2Calculator.calculate()           → deterministic
    4. ESGScorer.score()                   → deterministic
    5. GapAnalyzer.analyze()               → deterministic
    6. Save scores + breakdowns to report_results
    7. ReportWriter.write_executive_summary()  → LLM narrative
    8. ReportWriter.write_co2_narrative()      → LLM narrative
    9. ReportWriter.write_esg_narrative()      → LLM narrative
    10. ReportWriter.write_roadmap_narrative() → LLM narrative
    11. PDFBuilder.build()                 → WeasyPrint PDF
    12. Upload PDF to S3
    13. Update report status to 'completed'

    On failure: update report status to 'failed', store error_message.
    """
    logger.info("Report generation task started: report_id=%s", report_id)
    # TODO: implement in Week 5
    raise NotImplementedError("Report generation pipeline — implement in Week 5")
