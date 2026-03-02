"""
SustainabilityCoachAgent
========================
Conversational Danish ESG advisor + support agent.

Handles:
  - Concept explanations ("Hvad er Scope 3?")
  - Regulatory questions ("Hvornår gælder CSRD for os?")
  - Practical tips ("Hvordan sætter jeg en CO2-baseline?")
  - Motivational support ("Er det det hele værd for en lille virksomhed?")

Also doubles as SupportAgent (FAQ). Uses LLM with a rich system prompt and
optional company context to give personalised advice.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient

_SYSTEM_PROMPT = """Du er ESG Coach — en venlig, professionel dansk bæredygtighedsrådgiver for SMV'er.

Du hjælper virksomhedsejere og -ledere med at forstå og implementere ESG og VSME-rapportering.

PERSONLIGHED:
- Varm og tilgængelig — ingen ESG-jargon uden forklaring
- Konkret og handlingsorienteret — giv altid et næste skridt
- Ærlig — indrøm hvad der er svært, men giv løsninger
- Motiverende — SMV'er kan gøre en reel forskel

VIDEN:
- VSME Basic Modul (EFRAG 2024) — alle 50 datapunkter
- CSRD/ESRS-tidslinjer (2024-2028 indfasning)
- DEFRA 2024 emissionsfaktorer
- Danske virksomheders ESG-udfordringer og muligheder
- EU-taksonomi og finansieringsmuligheder for grønne SMV'er

REGLER:
1. Svar ALTID på dansk
2. Hold svar kortfattede og konkrete (max 4 afsnit)
3. Afslut med ét klart næste skridt
4. Henvis til VSME-guiden eller kontakt support ved komplekse juridiske spørgsmål
5. Opfind aldrig tal — sig "det afhænger af..." ved usikkerhed

FAQ-emner du er god til:
- Scope 1, 2, 3 forklaret simpelt
- VSME vs. CSRD — hvem skal hvad?
- Hvad koster ESG-rapportering?
- Hvad er emissionsfaktorer, og hvorfor bruges DEFRA?
- Hvornår skal vi i gang med CSRD?
- Kan vi bruge ESG til at tiltrække kunder/investorer/medarbejdere?
"""


class SustainabilityCoachAgent(BaseAgent):
    """Conversational Danish ESG coach + FAQ support."""

    name = "SustainabilityCoachAgent"

    def __init__(self) -> None:
        super().__init__()
        self._llm = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          message: str           — user's question/message in Danish
          history: list[dict]    — prior turns [{role, content}] (optional)
          context: dict          — company context (name, score, etc.) (optional)
        """
        message   = inputs.get("message", "")
        context   = inputs.get("context", {})

        if not message.strip():
            return {"ok": True, "response": "Hej! Jeg er din ESG Coach. Hvad kan jeg hjælpe dig med?"}

        # Build contextual system addendum
        ctx_lines = []
        if context.get("company_name"):
            ctx_lines.append(f"Virksomhed: {context['company_name']}")
        if context.get("esg_score_total"):
            ctx_lines.append(f"Aktuel ESG-score: {context['esg_score_total']}/100 ({context.get('esg_rating', '')})")
        if context.get("industry_code"):
            ctx_lines.append(f"Branche: {context['industry_code']}")
        if context.get("total_co2e_tonnes"):
            ctx_lines.append(f"CO2-aftryk: {context['total_co2e_tonnes']:.1f} tCO2e/år")

        system = _SYSTEM_PROMPT
        if ctx_lines:
            system += "\n\nVirksomhedens aktuelle status:\n" + "\n".join(ctx_lines)

        response = await self._llm.generate(system, message, max_tokens=600)

        return {
            "ok":       True,
            "response": response,
            "role":     "assistant",
        }
