"""
ImprovementAgent
=================
Generates prioritised SMART improvement actions based on ESG score gaps.

Priority order: highest-impact, lowest-cost actions first.
Uses LLM to generate Danish SMART action descriptions.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient

# ---------------------------------------------------------------------------
# Quick-win improvement map — deterministic suggestions per gap area
# ---------------------------------------------------------------------------

_QUICK_WINS: dict[str, list[str]] = {
    "elforbrug":         ["Skift til 100% vedvarende energi via elaftale", "LED-belysning og bevægelsessensorer", "Energimærkning af udstyr (A+++)"],
    "varme":             ["Isolering og tætning af bygning", "Udskift gasfyr med varmepumpe"],
    "transport":         ["Indfør firmacykler og cykelgodtgørelse", "Elektrisk firmabilsflåde (2025-plan)", "Fjernarbejde 2 dage/uge-politik"],
    "affald":            ["Separat affaldssortering (min. 5 fraktioner)", "Zero-waste leverandørpolitik", "Digitalisér papirdokumenter"],
    "medarbejdere":      ["Løngennemsigtighed og ligelønsanalyse", "Kompetenceudviklingsplan pr. medarbejder", "Trivselsundersøgelse 2x/år"],
    "governance":        ["Vedtag skriftlig ESG-politik (1 side)", "Udpeg ESG-ansvarlig i ledelsen", "Indfør whistleblower-kanal"],
    "vandforhold":       ["Installér vandbesparende armaturer", "Måling og månedlig opfølgning på vandforbrug"],
    "indkøb":            ["Grønne indkøbskriterier i leverandørkrav", "Lokal leverandørstrategi (< 100 km)"],
}


class ImprovementAgent(BaseAgent):
    """Generates SMART improvement recommendations from ESG score gaps."""

    name = "ImprovementAgent"

    def __init__(self) -> None:
        super().__init__()
        self._llm = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          esg_score_total: float
          esg_score_e: float (optional)
          esg_score_s: float (optional)
          esg_score_g: float (optional)
          gap_areas: list[str]   — e.g. ["elforbrug", "governance", "affald"]
          industry_code: str
        """
        total   = inputs.get("esg_score_total", 50)
        score_e = inputs.get("esg_score_e", 20)
        score_s = inputs.get("esg_score_s", 17)
        score_g = inputs.get("esg_score_g", 12)
        gaps    = inputs.get("gap_areas", [])
        industry = inputs.get("industry_code", "technology")

        # Collect quick-win suggestions for the identified gaps
        quick_wins: list[str] = []
        for gap in gaps:
            for key, actions in _QUICK_WINS.items():
                if key in gap.lower():
                    quick_wins.extend(actions[:2])  # top 2 per gap
                    break

        # Remove duplicates while preserving order
        seen: set[str] = set()
        unique_wins = [a for a in quick_wins if not (a in seen or seen.add(a))]  # type: ignore[func-returns-value]

        # LLM: generate a prioritised SMART action plan
        system = (
            "Du er en erfaren ESG-konsulent for SMV'er. "
            "Skriv konkrete, prioriterede SMART-handlingsplaner på professionelt dansk. "
            "Hvert punkt skal have: hvad (specifikt), hvornår (deadline), hvem (ansvarlig rolle), forventet effekt."
        )
        prompt = (
            f"Virksomheds ESG-score: {total}/100 (E:{score_e}/40, S:{score_s}/35, G:{score_g}/25)\n"
            f"Branche: {industry}\n"
            f"Identificerede forbedringsområder: {', '.join(gaps) or 'generel forbedring'}\n"
            f"Quick-win forslag: {'; '.join(unique_wins[:6])}\n\n"
            "Udarbejd 5 prioriterede SMART-handlingstiltag. "
            "Format hvert punkt som:\n"
            "**[1] Titel** — Beskrivelse. Deadline: [måned år]. Ansvarlig: [rolle]. Forventet CO2/score-effekt: [effekt].\n"
            "Prioritér tiltag med størst score-effekt og lavest implementeringsomkostning."
        )
        action_plan = await self._llm.generate(system, prompt, max_tokens=800)

        return {
            "ok":          True,
            "action_plan": action_plan,
            "quick_wins":  unique_wins[:6],
            "priority_areas": gaps[:3],
            "current_score":  total,
            "potential_score": min(100, round(total + len(gaps) * 4.5, 1)),
        }
