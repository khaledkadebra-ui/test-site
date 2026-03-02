"""
ReportWriterAgent
=================
Agent wrapper around ReportWriter that:
  1. Runs all 5 narrative sections in parallel (asyncio.gather)
  2. Optionally runs QAValidatorAgent on the output
  3. Returns the complete report sections dict

This is the final step in the full analysis pipeline:
  GHGCalculator → ESGScorer → GapAnalyzer → ReportWriterAgent → QAValidator

The LLM only READS pre-computed numbers — never invents figures.
"""

from __future__ import annotations

import asyncio
from typing import Any

from .base import BaseAgent
from ..ai.report_writer import ReportWriter
from ..esg_engine.calculator import CalculationReport
from ..esg_engine.scorer import ESGScorer
from ..esg_engine.gap_analyzer import GapAnalyzer


class ReportWriterAgent(BaseAgent):
    """
    Generates all VSME narrative sections + optionally runs QA validation.
    """

    name = "ReportWriterAgent"

    def __init__(self) -> None:
        super().__init__()
        self._writer = ReportWriter()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          company_name:      str
          reporting_year:    int
          calc_dict:         dict  — CalculationReport.to_dict() output
          esg_score_dict:    dict  — ESGScore serialized
          gap_report_dict:   dict  — GapReport serialized
          workforce_data:    dict  — optional, for social narrative
          policy_data:       dict  — optional, for governance narrative
          environment_data:  dict  — optional, for environment narrative
          revenue_dkk:       float — optional
          employee_count:    int   — optional
          industry_code:     str   — optional
          country_code:      str   — default 'DK'
          run_qa:            bool  — whether to validate output (default False, set True for prod)
        """
        company_name   = inputs.get("company_name", "Virksomheden")
        reporting_year = inputs.get("reporting_year", 2024)
        calc_dict      = inputs.get("calc_dict", {})
        score_dict     = inputs.get("esg_score_dict", {})
        gap_dict       = inputs.get("gap_report_dict", {})
        workforce      = inputs.get("workforce_data", {})
        policy         = inputs.get("policy_data", {})
        environment    = inputs.get("environment_data", {})
        revenue_dkk    = float(inputs.get("revenue_dkk", 0) or 0)
        employees      = int(inputs.get("employee_count", 0) or 0)
        industry       = inputs.get("industry_code", "technology")
        country        = inputs.get("country_code", "DK")
        run_qa         = inputs.get("run_qa", False)

        if not calc_dict:
            return {"ok": False, "error": "calc_dict required — run GHGCalculatorAgent first"}
        if not score_dict:
            return {"ok": False, "error": "esg_score_dict required — run ESG scorer first"}

        # Reconstruct CalculationReport from dict (rehydrate for narrative formatting)
        calc = CalculationReport(
            scope1_total_kg=calc_dict.get("scope1_total_kg", 0),
            scope2_total_kg=calc_dict.get("scope2_total_kg", 0),
            scope3_total_kg=calc_dict.get("scope3_total_kg", 0),
            total_kg=calc_dict.get("total_kg", 0),
            scope1_breakdown=calc_dict.get("scope1_breakdown", {}),
            scope2_breakdown=calc_dict.get("scope2_breakdown", {}),
            scope3_breakdown=calc_dict.get("scope3_breakdown", {}),
            warnings=calc_dict.get("warnings", []),
        )

        # Reconstruct ESGScore from dict for narrative generation
        # Build a lightweight proxy that matches ReportWriter's expected interface
        score = _ScoreProxy(score_dict)
        gaps  = _GapProxy(gap_dict)

        # Generate all sections in parallel
        sections = await asyncio.gather(
            self._writer.write_executive_summary(
                company_name, reporting_year, calc, score, gaps,  # type: ignore[arg-type]
                revenue_dkk=revenue_dkk, employee_count=employees,
            ),
            self._writer.write_co2_narrative(
                company_name, reporting_year, calc, industry, country,
                revenue_dkk=revenue_dkk, employee_count=employees,
            ),
            self._writer.write_esg_narrative(
                company_name, score, workforce_data=workforce,  # type: ignore[arg-type]
            ),
            self._writer.write_social_narrative(
                company_name, workforce, policy, score,  # type: ignore[arg-type]
            ),
            self._writer.write_governance_narrative(
                company_name, policy, score,  # type: ignore[arg-type]
            ),
        )

        result: dict[str, Any] = {
            "ok": True,
            "sections": {
                "executive_summary":   sections[0],
                "scope1_narrative":    sections[1],
                "scope2_narrative":    "",   # included in co2_narrative for VSME Basic
                "scope3_narrative":    "",
                "co2_narrative":       sections[1],
                "esg_narrative":       sections[2],
                "social_narrative":    sections[3],
                "governance_narrative": sections[4],
            },
            "company_name":   company_name,
            "reporting_year": reporting_year,
        }

        # Optional QA validation
        if run_qa:
            from .qa_validator import QAValidatorAgent
            qa_result = await QAValidatorAgent().safe_run({
                "report_sections": result["sections"],
                "co2_data": calc_dict,
                "esg_scores": score_dict,
            })
            result["qa"] = qa_result

        return result


# ── Lightweight proxy objects so we can call ReportWriter without ORM ──────────

class _DimProxy:
    def __init__(self, data: dict, key: str) -> None:
        d = data.get(key, {})
        self.score  = float(d.get("score", 0))
        self.rating = str(d.get("rating", "C"))
        self.gaps   = list(d.get("gaps", []))


class _ScoreProxy:
    def __init__(self, data: dict) -> None:
        self.total               = float(data.get("esg_score_total", data.get("total", 50)))
        self.rating              = str(data.get("esg_rating", data.get("rating", "C")))
        self.industry_percentile = int(data.get("industry_percentile", 50))
        self.environmental       = _DimProxy(data, "environmental")
        self.social              = _DimProxy(data, "social")
        self.governance          = _DimProxy(data, "governance")


class _GapProxy:
    def __init__(self, data: dict) -> None:
        self.total_gaps                = int(data.get("total_gaps", 0))
        self.high_priority_count       = int(data.get("high_priority_count", 0))
        self.total_potential_score_gain = float(data.get("total_potential_score_gain", 0))
        self.gaps                      = data.get("gaps", [])
