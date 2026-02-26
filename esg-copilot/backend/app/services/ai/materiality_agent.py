"""
Materiality Assessment Agent — ESG Copilot
==========================================
Uses Claude to perform a double materiality assessment for a company,
classifying each VSME Basic Module datapoint as:
  - "required"      — Must collect and report this data
  - "recommended"   — Relevant but not mandatory for this profile
  - "not_relevant"  — Not applicable given industry/size/geography

The agent receives the company profile and outputs a structured JSON
classification for all ~50 VSME datapoints in a single Claude call.
This is "agentic" in that Claude reasons about each field independently
given the company context — not hard-coded rules.

Output is cached per company and invalidated when profile changes.
"""

import json
import logging
import os
import re
from typing import TypedDict

import anthropic

logger = logging.getLogger(__name__)

PROMPT_VERSION = "1.0"

# ── All VSME Basic Module datapoints with descriptions ────────────────────────
VSME_DATAPOINTS: dict[str, dict] = {
    # B3 — Energy & Scope 1 (direct combustion)
    "natural_gas_m3":            {"label": "Naturgas (m³)",              "section": "B3", "scope": 1},
    "diesel_liters":             {"label": "Diesel (liter)",              "section": "B3", "scope": 1},
    "petrol_liters":             {"label": "Benzin (liter)",              "section": "B3", "scope": 1},
    "lpg_liters":                {"label": "Flaskegas LPG (liter)",       "section": "B3", "scope": 1},
    "heating_oil_liters":        {"label": "Fyringsolie (liter)",         "section": "B3", "scope": 1},
    "coal_kg":                   {"label": "Kul (kg)",                    "section": "B3", "scope": 1},
    "biomass_wood_chips_kg":     {"label": "Biomasse/træflis (kg)",       "section": "B3", "scope": 1},
    "company_car_km":            {"label": "Firmabiler (km)",             "section": "B3", "scope": 1},
    "company_van_km":            {"label": "Varevogne (km)",              "section": "B3", "scope": 1},
    "company_truck_km":          {"label": "Lastbiler (km)",              "section": "B3", "scope": 1},
    # B3 — Scope 2 (purchased energy)
    "electricity_kwh":           {"label": "El-forbrug (kWh)",            "section": "B3", "scope": 2},
    "district_heating_kwh":      {"label": "Fjernvarme (kWh)",            "section": "B3", "scope": 2},
    # B3 — Scope 3 business travel (optional)
    "air_short_haul_km":         {"label": "Kortdistancefly (km)",        "section": "B3", "scope": 3},
    "air_long_haul_economy_km":  {"label": "Langfly economy (km)",        "section": "B3", "scope": 3},
    "air_long_haul_business_km": {"label": "Langfly business (km)",       "section": "B3", "scope": 3},
    "rail_km":                   {"label": "Togreiser (km)",              "section": "B3", "scope": 3},
    "rental_car_km":             {"label": "Lejebil (km)",                "section": "B3", "scope": 3},
    "taxi_km":                   {"label": "Taxa (km)",                   "section": "B3", "scope": 3},
    "employee_commuting_km":     {"label": "Medarbejderpendling (km/dag)", "section": "B3", "scope": 3},
    # B3 — Scope 3 procurement (optional)
    "purchased_goods_spend_eur": {"label": "Indkøbte varer/tjenester (EUR)", "section": "B3", "scope": 3},
    # B4 — Water
    "water_withdrawal_m3":       {"label": "Vandforbrug (m³)",            "section": "B4", "scope": 0},
    "water_recycled_pct":        {"label": "Genanvendt vand (%)",         "section": "B4", "scope": 0},
    # B5 — Waste
    "total_waste_tonnes":        {"label": "Samlet affald (tonnes)",      "section": "B5", "scope": 0},
    "hazardous_waste_tonnes":    {"label": "Farligt affald (tonnes)",     "section": "B5", "scope": 0},
    "waste_recycled_pct":        {"label": "Genanvendt affald (%)",       "section": "B5", "scope": 0},
    # B6 — Biodiversity
    "has_biodiversity_impact":   {"label": "Biodiversitetspåvirkning",    "section": "B6", "scope": 0},
    # B7 — Pollution
    "air_pollutants_reported":   {"label": "Luftforurening rapporteret",  "section": "B7", "scope": 0},
    "water_pollutants_reported": {"label": "Vandforurening rapporteret",  "section": "B7", "scope": 0},
    # B8 — Workforce
    "employees_total":           {"label": "Antal medarbejdere (total)",  "section": "B8", "scope": 0},
    "employees_full_time":       {"label": "Fuldtidsmedarbejdere",        "section": "B8", "scope": 0},
    "employees_part_time":       {"label": "Deltidsmedarbejdere",         "section": "B8", "scope": 0},
    "employees_male":            {"label": "Mandlige medarbejdere",       "section": "B8", "scope": 0},
    "employees_female":          {"label": "Kvindelige medarbejdere",     "section": "B8", "scope": 0},
    "employees_permanent":       {"label": "Fastansatte",                 "section": "B8", "scope": 0},
    "employees_temporary":       {"label": "Midlertidigt ansatte",        "section": "B8", "scope": 0},
    "employee_turnover_pct":     {"label": "Medarbejderomsætning (%)",    "section": "B8", "scope": 0},
    # B9 — Health & Safety
    "work_related_accidents":    {"label": "Arbejdsulykker (antal)",      "section": "B9", "scope": 0},
    "injury_rate_per_1000":      {"label": "Skadefrekvens per 1000",      "section": "B9", "scope": 0},
    "days_lost_injuries":        {"label": "Tabte arbejdsdage (skader)",  "section": "B9", "scope": 0},
    "has_health_safety_policy":  {"label": "Arbejdsmiljøpolitik",         "section": "B9", "scope": 0},
    # B10 — Pay & Diversity
    "wage_gender_gap_pct":       {"label": "Lønforskel mænd/kvinder (%)", "section": "B10", "scope": 0},
    "female_management_pct":     {"label": "Kvinder i ledelse (%)",       "section": "B10", "scope": 0},
    "youth_employment_pct":      {"label": "Ungdomsbeskæftigelse (%)",    "section": "B10", "scope": 0},
    "disability_employment_pct": {"label": "Handicapbeskæftigelse (%)",   "section": "B10", "scope": 0},
    # B11 — Governance policies
    "has_anti_bribery_policy":        {"label": "Anti-bestikkelsespolitik",       "section": "B11", "scope": 0},
    "has_data_protection_policy":     {"label": "Databeskyttelsespolitik",         "section": "B11", "scope": 0},
    "has_whistleblower_policy":       {"label": "Whistleblower-ordning",           "section": "B11", "scope": 0},
    "has_environmental_policy":       {"label": "Miljøpolitik",                    "section": "B11", "scope": 0},
    "has_human_rights_policy":        {"label": "Menneskerettighedspolitik",       "section": "B11", "scope": 0},
    "has_supplier_code_of_conduct":   {"label": "Leverandøradfærdskodeks",         "section": "B11", "scope": 0},
    "net_zero_target_year":           {"label": "Netto-nul målår",                 "section": "B11", "scope": 0},
    "science_based_target":           {"label": "Videnskabsbaseret klimamål (SBTi)", "section": "B11", "scope": 0},
}

_SYSTEM = """\
Du er en ESG-compliance ekspert specialiseret i VSME Basic Module (EFRAG, 2024) for SMV'er.
Din opgave er at vurdere hvilke VSME-datapunkter der er relevante for en specifik virksomhed
baseret på dens profil (branche, størrelse, land).

KLASSIFICERING:
- "required":      Datapunktet er obligatorisk eller klart materiellt for denne virksomhedstype
- "recommended":   Datapunktet er relevant men ikke kritisk for virksomhedens profil
- "not_relevant":  Datapunktet er ikke materiellt for virksomheden (f.eks. vandforurening for et softwareselskab)

REGLER:
1. Scope 1+2 (energi, el) er ALTID "required" for alle virksomheder
2. Basis medarbejderdata (B8: employees_total, male, female, permanent) er ALTID "required"
3. B11 governance-politikker er ALTID mindst "recommended"
4. Vær specifik i din begrundelse — maks 1 sætning på dansk
5. Returner KUN valid JSON — ingen forklaringer uden for JSON
"""


class DatapointAssessment(TypedDict):
    materiality: str   # "required" | "recommended" | "not_relevant"
    reason: str        # 1 sentence in Danish


class MaterialityResult(TypedDict):
    assessment: dict[str, DatapointAssessment]
    model_used: str
    prompt_version: str


async def run_materiality_assessment(
    industry_code: str,
    employee_count: int | None,
    revenue_eur: float | None,
    country_code: str,
) -> MaterialityResult:
    """
    Run the AI materiality assessment agent for a company.

    Uses Claude to classify each VSME datapoint as required/recommended/not_relevant
    based on the company's industry, size, and geography.

    Returns a MaterialityResult with the full assessment dict.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")

    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    client = anthropic.AsyncAnthropic(api_key=api_key)

    # Build the list of datapoints for Claude to assess
    datapoints_text = "\n".join(
        f'  "{field_id}": {{ "label": "{dp["label"]}", "section": "{dp["section"]}", "scope": {dp["scope"]} }}'
        for field_id, dp in VSME_DATAPOINTS.items()
    )

    size_label = _size_label(employee_count)
    revenue_label = f"{revenue_eur:,.0f} EUR" if revenue_eur else "ukendt"

    user_prompt = f"""\
Vurdér materialiteten for følgende virksomhed i henhold til VSME Basic Module:

VIRKSOMHEDSPROFIL:
- Branche: {industry_code}
- Størrelse: {size_label} ({employee_count or "?"} medarbejdere)
- Omsætning: {revenue_label}
- Land: {country_code}

VSME DATAPUNKTER DER SKAL VURDERES:
{{
{datapoints_text}
}}

Returner PRÆCIS dette JSON-format (ingen markdown, ingen forklaring udenfor JSON):
{{
  "assessment": {{
    "<field_id>": {{
      "materiality": "<required|recommended|not_relevant>",
      "reason": "<1 sætning på dansk>"
    }},
    ... (alle {len(VSME_DATAPOINTS)} felter)
  }}
}}
"""

    logger.info(
        "Running materiality assessment for industry=%s size=%s country=%s",
        industry_code, size_label, country_code,
    )

    # Claude call with retry
    import asyncio
    last_err = None
    for attempt in range(1, 5):
        try:
            response = await client.messages.create(
                model=model,
                max_tokens=4000,
                temperature=0.2,   # Low temp for consistent classification
                system=_SYSTEM,
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw = response.content[0].text.strip() if response.content else ""
            break
        except (anthropic.RateLimitError, anthropic.InternalServerError) as e:
            logger.warning("Materiality agent attempt %d failed: %s", attempt, e)
            last_err = e
            await asyncio.sleep(5 * attempt)
    else:
        raise RuntimeError(f"Materiality agent failed after retries: {last_err}")

    # Parse JSON — handle markdown code blocks if Claude adds them
    assessment = _parse_json_response(raw)

    # Validate all expected fields are present, fill missing with "recommended"
    for field_id in VSME_DATAPOINTS:
        if field_id not in assessment:
            assessment[field_id] = {
                "materiality": "recommended",
                "reason": "Automatisk tilføjet — manglende klassificering.",
            }

    logger.info("Materiality assessment complete: %d fields classified", len(assessment))

    return MaterialityResult(
        assessment=assessment,
        model_used=model,
        prompt_version=PROMPT_VERSION,
    )


def _size_label(employee_count: int | None) -> str:
    if not employee_count:
        return "ukendt størrelse"
    if employee_count <= 10:
        return "mikrovirksomhed"
    if employee_count <= 50:
        return "lille virksomhed"
    if employee_count <= 250:
        return "mellemstor virksomhed"
    return "stor virksomhed"


def _parse_json_response(raw: str) -> dict[str, DatapointAssessment]:
    """Parse Claude's JSON response, handling markdown code blocks."""
    # Strip markdown code blocks if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip()
    cleaned = cleaned.rstrip("`").strip()

    try:
        data = json.loads(cleaned)
        return data.get("assessment", data)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse materiality JSON: %s\nRaw: %s", e, raw[:500])
        # Return safe fallback — all recommended
        return {
            field_id: {"materiality": "recommended", "reason": "JSON-parsing fejl — brug standardværdi."}
            for field_id in VSME_DATAPOINTS
        }
