"""
RoadmapAgent
=============
Builds a Q1–Q4 implementation timeline from an improvement action list.
Assigns quarters, owners, and milestones. LLM formats into a clean Danish plan.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient


class RoadmapAgent(BaseAgent):
    name = "RoadmapAgent"

    def __init__(self) -> None:
        super().__init__()
        self._llm = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          improvement_actions: list[str]
          reporting_year: int  (default: current year + 1)
          company_size: str    ('micro' | 'small' | 'medium')
        """
        actions  = inputs.get("improvement_actions", [])
        year     = inputs.get("reporting_year", 2025)
        size     = inputs.get("company_size", "small")

        if not actions:
            return {"ok": True, "roadmap": "Ingen forbedringstiltag at planlægge.", "quarters": {}}

        size_note = {
            "micro":  "Virksomheden er meget lille (<10 mda.) — prioritér 1-2 tiltag ad gangen og hold det simpelt.",
            "small":  "Virksomheden er lille (10-49 mda.) — realistisk at håndtere 3-4 parallelle tiltag.",
            "medium": "Virksomheden er mellemstor (50-249 mda.) — kan håndtere et fuldt kvartalsprogram.",
        }.get(size, "")

        system = (
            "Du er en erfaren projektleder specialiseret i ESG-implementering i SMV'er. "
            "Skriv klare, realistiske Q1-Q4 køreplaner på dansk. "
            "Vær specifik om deadlines, milepæle og ansvar."
        )
        prompt = (
            f"Rapporteringsår: {year}\n"
            f"Virksomhedsstørrelse: {size}. {size_note}\n\n"
            f"Forbedringstiltag at implementere:\n"
            + "\n".join(f"- {a}" for a in actions[:8])
            + "\n\n"
            "Byg en Q1-Q4 køreplan for det kommende år. "
            "Prioritér de tiltag med størst effekt til Q1-Q2. "
            "Format:\n"
            "**Q1 [jan-mar]:** [2-3 tiltag med ansvarlig rolle og succeskriterium]\n"
            "**Q2 [apr-jun]:** [...]\n"
            "**Q3 [jul-sep]:** [...]\n"
            "**Q4 [okt-dec]:** [...] inkl. årsopgørelse og rapportforberedelse\n\n"
            "Afslut med: **Forventet ESG-score-fremgang ved fuld implementering:** [estimat]"
        )
        roadmap_text = await self._llm.generate(system, prompt, max_tokens=800)

        return {
            "ok":      True,
            "roadmap": roadmap_text,
            "year":    year,
            "action_count": len(actions),
        }
