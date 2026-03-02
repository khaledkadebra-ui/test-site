"""
MaterialityAssessorAgent
=========================
Wraps the existing run_materiality_assessment() function into the
agent pattern, adding a summary digest and priority-ordered output.

Double materiality: this assesses both financial materiality
(impact on company performance) and impact materiality
(company's impact on society/environment), per ESRS 1 framework.

The underlying LLM call uses Claude to classify 50 VSME datapoints as
required / recommended / not_relevant for this specific company.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.materiality_agent import run_materiality_assessment, VSME_DATAPOINTS


class MaterialityAssessorAgent(BaseAgent):
    """
    Double materiality assessment — wraps the existing materiality_agent.
    Returns structured classification + priority digest.
    """

    name = "MaterialityAssessorAgent"

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          industry_code:  str   — e.g. 'manufacturing'
          employee_count: int   — optional
          revenue_eur:    float — optional
          country_code:   str   — default 'DK'
        """
        industry   = inputs.get("industry_code", "technology")
        employees  = inputs.get("employee_count")
        revenue    = inputs.get("revenue_eur")
        country    = inputs.get("country_code", "DK")

        result = await run_materiality_assessment(
            industry_code=industry,
            employee_count=employees,
            revenue_eur=revenue,
            country_code=country,
        )

        assessment: dict = result.get("assessment", {})

        # Build priority digest
        required: list[dict]     = []
        recommended: list[dict]  = []
        not_relevant: list[dict] = []

        for key, dp_info in VSME_DATAPOINTS.items():
            classification = assessment.get(key, {})
            mat  = classification.get("materiality", "recommended")
            reason = classification.get("reason", "")
            entry = {
                "key":     key,
                "label":   dp_info["label"],
                "section": dp_info["section"],
                "reason":  reason,
            }
            if mat == "required":
                required.append(entry)
            elif mat == "recommended":
                recommended.append(entry)
            else:
                not_relevant.append(entry)

        # Group required by VSME section
        sections: dict[str, list] = {}
        for item in required:
            sec = item["section"]
            sections.setdefault(sec, []).append(item["label"])

        return {
            "ok":            True,
            "required":      required,
            "recommended":   recommended,
            "not_relevant":  not_relevant,
            "sections":      sections,
            "counts": {
                "required":     len(required),
                "recommended":  len(recommended),
                "not_relevant": len(not_relevant),
                "total":        len(VSME_DATAPOINTS),
            },
            "model_used":     result.get("model_used", ""),
            "summary": (
                f"{len(required)} obligatoriske datapunkter identificeret for {industry}-virksomheden. "
                f"{len(recommended)} anbefalede og {len(not_relevant)} ikke-relevante."
            ),
        }
