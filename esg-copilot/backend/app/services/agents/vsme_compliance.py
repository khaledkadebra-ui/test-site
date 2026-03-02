"""
VSMEComplianceAgent
====================
Checks a data submission against all 50 VSME Basic Modul datapoints and
returns a structured list of missing required fields + recommended fields.

This is deterministic — no LLM call. Maps submission data keys to VSME
requirements and identifies gaps.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent

# ---------------------------------------------------------------------------
# VSME Basic Modul — required and recommended fields
# Mapped to our wizard submission structure
# ---------------------------------------------------------------------------

_REQUIRED: list[tuple[str, str, str]] = [
    # (section, field_key, human_label)
    ("scope1", "natural_gas",      "Naturgas forbrug (Scope 1)"),
    ("scope2", "electricity_kwh",  "Elforbrug kWh (Scope 2)"),
    ("workforce", "employees_total",   "Samlet antal medarbejdere"),
    ("workforce", "employees_female",  "Antal kvindelige medarbejdere"),
    ("workforce", "employees_male",    "Antal mandlige medarbejdere"),
    ("workforce", "full_time_count",   "Antal fuldtidsansatte"),
    ("workforce", "min_wage_pct",      "Andel medarbejdere over minimalløn (%)"),
    ("governance", "has_esg_policy",   "ESG-politik eller bæredygtighedspolitik"),
    ("governance", "has_board_esg",    "Bestyrelsesansvar for bæredygtighed"),
    ("environment", "waste_total_tonnes", "Samlet affaldsmængde (tonnes)"),
]

_RECOMMENDED: list[tuple[str, str, str]] = [
    ("scope1",    "diesel",              "Dieselforbrug"),
    ("scope1",    "heating_oil",         "Fyringsolie"),
    ("scope2",    "district_heating_kwh","Fjernvarme forbrug"),
    ("scope3",    "employee_commuting",  "Medarbejderpendling (Scope 3)"),
    ("scope3",    "business_travel_km",  "Forretningsrejser (km)"),
    ("workforce", "part_time_count",     "Antal deltidsansatte"),
    ("workforce", "turnover_pct",        "Medarbejderomsætning (%)"),
    ("workforce", "training_hours_avg",  "Gennemsnitlige uddannelsestimer pr. medarbejder"),
    ("environment","water_m3",           "Vandforbrug (m³)"),
    ("environment","waste_recycled_pct", "Genanvendelsesprocent"),
    ("governance", "has_whistleblower",  "Whistleblower-ordning"),
    ("governance", "has_anti_corruption","Anti-korruptionspolitik"),
]


class VSMEComplianceAgent(BaseAgent):
    """Deterministic VSME Basic Modul compliance checker."""

    name = "VSMEComplianceAgent"

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          submission_data: dict  — wizard sections (scope1, scope2, scope3, workforce, environment, governance)
          industry_code: str     — optional, may relax some requirements
        """
        data: dict = inputs.get("submission_data", {})

        missing_required: list[str]    = []
        missing_recommended: list[str] = []

        for section, field, label in _REQUIRED:
            section_data = data.get(section, {})
            val = section_data.get(field)
            if val is None or val == "" or val == 0:
                missing_required.append(label)

        for section, field, label in _RECOMMENDED:
            section_data = data.get(section, {})
            val = section_data.get(field)
            if val is None or val == "" or val == 0:
                missing_recommended.append(label)

        total_checked = len(_REQUIRED) + len(_RECOMMENDED)
        filled = total_checked - len(missing_required) - len(missing_recommended)
        completion_pct = round(filled / total_checked * 100, 1)

        is_compliant = len(missing_required) == 0

        return {
            "ok":                  True,
            "is_compliant":        is_compliant,
            "completion_pct":      completion_pct,
            "missing_required":    missing_required,
            "missing_recommended": missing_recommended,
            "total_checked":       total_checked,
            "summary": (
                f"{'✅ Alle obligatoriske felter er udfyldt' if is_compliant else f'⚠️ {len(missing_required)} obligatoriske felter mangler'}. "
                f"Udfyldningsgrad: {completion_pct}%."
            ),
        }
