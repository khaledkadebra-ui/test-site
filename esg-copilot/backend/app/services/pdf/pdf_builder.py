"""
PDF Report Builder — ESG Copilot
=================================
Renders a Jinja2 HTML template with report data, then converts it to
a PDF using WeasyPrint. Returns raw bytes ready for upload to storage.

WeasyPrint requires system libraries (libpango, libcairo2) — these are
pre-installed in the Docker image. On Windows dev machines, install
WeasyPrint via: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html
"""

from __future__ import annotations

import io
import logging
from datetime import date
from pathlib import Path
from typing import TYPE_CHECKING

from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "templates"


def _build_html(context: dict) -> str:
    """Render the Jinja2 template with the given context."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("report.html")
    return template.render(**context)


def build_pdf(
    *,
    company_name: str,
    reporting_year: int,
    industry_code: str,
    country_code: str,
    engine_version: str,
    # CO2 data
    scope1_co2e_tonnes: float,
    scope2_co2e_tonnes: float,
    scope3_co2e_tonnes: float,
    total_co2e_tonnes: float,
    scope1_breakdown: dict,
    scope2_breakdown: dict,
    scope3_breakdown: dict,
    # ESG scores
    esg_score_total: float,
    esg_score_e: float,
    esg_score_s: float,
    esg_score_g: float,
    esg_rating: str,
    industry_percentile: float,
    # Gaps + roadmap
    identified_gaps: list,
    recommendations: list,
    # AI narratives
    executive_summary: str,
    co2_narrative: str,
    esg_narrative: str,
    improvements_narrative: str,
    roadmap_narrative: str,
    # Legal
    disclaimer: str,
) -> bytes:
    """
    Build and return the PDF as bytes.

    Raises:
        ImportError: if WeasyPrint is not installed
        Exception: for any rendering failures (logged before re-raising)
    """
    try:
        from weasyprint import HTML, CSS
    except ImportError:
        raise ImportError(
            "WeasyPrint is not installed. Run: pip install weasyprint\n"
            "On Windows, see: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html"
        )

    context = {
        "company_name": company_name,
        "reporting_year": reporting_year,
        "industry_code": industry_code,
        "country_code": country_code,
        "engine_version": engine_version,
        "generated_date": date.today().strftime("%d %b %Y"),
        # CO2
        "scope1_co2e_tonnes": scope1_co2e_tonnes,
        "scope2_co2e_tonnes": scope2_co2e_tonnes,
        "scope3_co2e_tonnes": scope3_co2e_tonnes,
        "total_co2e_tonnes": total_co2e_tonnes,
        "scope1_breakdown": scope1_breakdown,
        "scope2_breakdown": scope2_breakdown,
        "scope3_breakdown": scope3_breakdown,
        # ESG
        "esg_score_total": esg_score_total,
        "esg_score_e": esg_score_e,
        "esg_score_s": esg_score_s,
        "esg_score_g": esg_score_g,
        "esg_rating": esg_rating,
        "industry_percentile": industry_percentile,
        # Gaps
        "identified_gaps": identified_gaps,
        "recommendations": recommendations,
        # Narratives
        "executive_summary": executive_summary,
        "co2_narrative": co2_narrative,
        "esg_narrative": esg_narrative,
        "improvements_narrative": improvements_narrative,
        "roadmap_narrative": roadmap_narrative,
        # Legal
        "disclaimer": disclaimer,
    }

    try:
        html_content = _build_html(context)
        pdf_bytes = HTML(string=html_content, base_url=str(TEMPLATES_DIR)).write_pdf()
        logger.info("PDF generated successfully: %d bytes", len(pdf_bytes))
        return pdf_bytes
    except Exception as exc:
        logger.exception("PDF generation failed: %s", exc)
        raise
