"""
QAValidatorAgent
================
Reviews a generated ESG report for:
  - Internal consistency (numbers match across sections)
  - Missing mandatory VSME sections
  - Potential hallucinations (numbers not present in source data)
  - Language quality (professional Danish)

Returns a quality score 0-100 and a list of issues.
"""

from __future__ import annotations

import re
from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient


class QAValidatorAgent(BaseAgent):
    name = "QAValidatorAgent"

    _REQUIRED_SECTIONS = [
        "executive_summary",
        "scope1_narrative",
        "scope2_narrative",
        "scope3_narrative",
        "social_narrative",
        "governance_narrative",
    ]

    def __init__(self) -> None:
        super().__init__()
        self._llm = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          report_sections: dict[str, str]  — section_name → text
          co2_data: dict                   — optional, for cross-validation
          esg_scores: dict                 — optional, for cross-validation
        """
        sections   = inputs.get("report_sections", {})
        co2_data   = inputs.get("co2_data", {})
        esg_scores = inputs.get("esg_scores", {})

        issues: list[str] = []

        # 1. Check for missing sections
        for sec in self._REQUIRED_SECTIONS:
            if not sections.get(sec, "").strip():
                issues.append(f"Manglende afsnit: {sec}")

        # 2. Check that key CO2 numbers appear in narrative if co2_data provided
        if co2_data and sections.get("executive_summary"):
            total = co2_data.get("total_co2e_tonnes")
            if total and str(round(total, 0)) not in sections.get("executive_summary", ""):
                # Check if any number close to total appears
                numbers_in_text = re.findall(r"\d+[,.]?\d*", sections.get("executive_summary", ""))
                found = any(abs(float(n.replace(",", ".")) - total) < 5 for n in numbers_in_text if n)
                if not found:
                    issues.append(f"CO2-total ({total:.0f} tCO2e) ikke nævnt i resumé")

        # 3. LLM quality check
        all_text = "\n\n---\n\n".join(
            f"[{k}]\n{v}" for k, v in sections.items() if v
        )
        if all_text:
            system = (
                "Du er en kvalitetssikrer af ESG-rapporter. "
                "Evaluer rapporten for professionel kvalitet, konsistens og fuldstændighed. "
                "Vær kritisk og objektiv. Rapportér kun reelle problemer."
            )
            co2_ctx = f"CO2-data til krydsvalidering: {co2_data}" if co2_data else ""
            score_ctx = f"ESG-scorer til krydsvalidering: {esg_scores}" if esg_scores else ""
            prompt = (
                f"Rapporttekst:\n{all_text[:3000]}\n\n"
                f"{co2_ctx}\n{score_ctx}\n\n"
                "Evaluer:\n"
                "1. Er sprogkvaliteten professionel og konsistent dansk?\n"
                "2. Er der interne modsigelser?\n"
                "3. Er der udsagn, der ikke understøttes af tallene?\n"
                "4. Overordnet kvalitetsscore (0-100)?\n\n"
                "Svar i formatet:\n"
                "**Kvalitetsscore:** [tal]/100\n"
                "**Problemer:** [liste eller 'Ingen væsentlige problemer fundet']\n"
                "**Anbefalinger:** [1-3 konkrete forbedringer]"
            )
            qa_text = await self._llm.generate(system, prompt, max_tokens=500)

            # Extract score from LLM response
            score_match = re.search(r"Kvalitetsscore.*?(\d+)", qa_text)
            quality_score = int(score_match.group(1)) if score_match else 75
        else:
            qa_text = "Ingen rapport at validere."
            quality_score = 0

        return {
            "ok":            True,
            "quality_score": quality_score,
            "issues":        issues,
            "qa_narrative":  qa_text,
            "passed":        quality_score >= 70 and len(issues) == 0,
        }
