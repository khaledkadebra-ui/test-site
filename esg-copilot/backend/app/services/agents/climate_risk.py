"""
ClimateRiskAgent
================
Identifies physical and transition climate risks for a company based on
its industry, country, and emissions profile.

Uses LLM to generate tailored Danish risk narrative from a structured
risk database. The risk categories are deterministic — only the narrative
is LLM-generated.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient

# ---------------------------------------------------------------------------
# Risk database — deterministic scoring
# (physical_score, transition_score) per industry, 0-10 scale
# ---------------------------------------------------------------------------

_INDUSTRY_RISKS: dict[str, dict] = {
    "agriculture":    {"physical": 9, "transition": 7, "key_physical": ["tørke", "oversvømmelse", "ekstremt vejr"], "key_transition": ["CO2-afgifter på landbrug", "nitratregulering", "ændret efterspørgsel"]},
    "manufacturing":  {"physical": 6, "transition": 8, "key_physical": ["oversvømmelse af fabrikker", "varmebelastning af processer"], "key_transition": ["CO2-kvoter (EU ETS)", "energiprisstigninger", "cirkulærøkonomi-krav"]},
    "construction":   {"physical": 7, "transition": 7, "key_physical": ["ekstremvejr på byggepladser", "vandmangel"], "key_transition": ["bygningsenergikrav (BR23)", "materialeregulering"]},
    "retail":         {"physical": 4, "transition": 6, "key_physical": ["forsyningskædeforstyrrelser"], "key_transition": ["forbrugerpreferencer", "plastikregulering", "CSR-rapporteringskrav"]},
    "logistics":      {"physical": 6, "transition": 9, "key_physical": ["infrastrukturforstyrrelser", "oversvømmede ruter"], "key_transition": ["CO2-afgift på transport", "Euro 7-normer", "elektrificering af flåde"]},
    "technology":     {"physical": 3, "transition": 5, "key_physical": ["datacentervarme", "vandkøling-mangel"], "key_transition": ["energieffektivitetskrav", "e-affaldsdirektiv"]},
    "finance":        {"physical": 3, "transition": 8, "key_physical": ["fysisk risikoeksponering via lånebog"], "key_transition": ["SFDR/CSRD-krav", "stranded assets", "taxonomi-krav"]},
    "healthcare":     {"physical": 4, "transition": 5, "key_physical": ["varmebølger øger patientbelastning"], "key_transition": ["medicinspild", "éngangsplast-regulering"]},
    "hospitality":    {"physical": 7, "transition": 6, "key_physical": ["turismemønstre ændrer sig", "vandmangel"], "key_transition": ["energiprisstigninger", "grønne krav fra bookingplatforme"]},
}
_DEFAULT_RISK = {"physical": 5, "transition": 5, "key_physical": ["generelle klimarisici"], "key_transition": ["CO2-regulering", "energiprisstigninger"]}

_DK_PHYSICAL_CONTEXT = (
    "Danmark er primært eksponeret for: stormflod og oversvømmelse (særligt i kystområder og lavtliggende byer), "
    "kraftige regnskyl (cloudburst), og hyppigere varmebølger. "
    "DK1 (Jylland/Fyn) og DK2 (Sjælland/øer) har forskellig eksponering."
)


class ClimateRiskAgent(BaseAgent):
    """Identifies and narrates physical + transition climate risks."""

    name = "ClimateRiskAgent"

    def __init__(self) -> None:
        super().__init__()
        self._llm = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          industry_code:  str
          country_code:   str  (default 'DK')
          employee_count: int  (optional)
          scope1_co2e:    float  (optional)
          scope2_co2e:    float  (optional)
          scope3_co2e:    float  (optional)
        """
        industry    = inputs.get("industry_code", "technology")
        country     = inputs.get("country_code", "DK")
        s1          = inputs.get("scope1_co2e", 0) or 0
        s2          = inputs.get("scope2_co2e", 0) or 0
        s3          = inputs.get("scope3_co2e", 0) or 0
        total_co2e  = s1 + s2 + s3

        risk = _INDUSTRY_RISKS.get(industry, _DEFAULT_RISK)
        physical_score    = risk["physical"]
        transition_score  = risk["transition"]
        key_physical      = risk["key_physical"]
        key_transition    = risk["key_transition"]

        # Boost transition risk if high emissions
        if total_co2e > 500:
            transition_score = min(10, transition_score + 1)
        if total_co2e > 2000:
            transition_score = min(10, transition_score + 1)

        overall_risk = round((physical_score + transition_score) / 2, 1)

        # LLM narrative
        dk_context = _DK_PHYSICAL_CONTEXT if country.upper() == "DK" else ""
        system = (
            "Du er en dansk klimarisikorådgiver specialiseret i SMV'er. "
            "Skriv korte, faktabaserede risikovurderinger på professionelt dansk. "
            "Undgå at overdrive — vær objektiv og handlingsorienteret."
        )
        user_prompt = (
            f"Branche: {industry}, Land: {country}\n"
            f"CO2-aftryk: {total_co2e:.1f} tCO2e/år (S1: {s1:.1f}, S2: {s2:.1f}, S3: {s3:.1f})\n"
            f"Fysisk risikoscore: {physical_score}/10 — nøglerisici: {', '.join(key_physical)}\n"
            f"Transitionsrisikoscore: {transition_score}/10 — nøglerisici: {', '.join(key_transition)}\n"
            f"{dk_context}\n\n"
            "Skriv en kort klimarisikovurdering (3-4 afsnit):\n"
            "1. Fysiske risici (konkrete for denne branche og dette land)\n"
            "2. Transitionsrisici (regulering, marked, teknologi)\n"
            "3. Top 3 anbefalede risikomitigeringstiltag med kort begrundelse\n"
            "Vær specifik og handlingsorienteret. Maks 300 ord."
        )
        narrative = await self._llm.generate(system, user_prompt, max_tokens=600)

        return {
            "ok":               True,
            "physical_score":   physical_score,
            "transition_score": transition_score,
            "overall_risk":     overall_risk,
            "risk_level":       "Høj" if overall_risk >= 7 else "Moderat" if overall_risk >= 4 else "Lav",
            "key_physical":     key_physical,
            "key_transition":   key_transition,
            "narrative":        narrative,
        }
