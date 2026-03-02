"""
GHGCalculatorAgent
==================
Wraps the deterministic CO2Calculator with:
  - Input mapping from wizard submission data dict → typed Input objects
  - Anomaly detection (unusual intensities, missing data warnings)
  - LLM explanation of any anomalies or notable patterns
  - Returns the full CalculationReport dict + anomaly commentary

The calculation itself is 100% deterministic — the LLM only comments
on the results, never modifies numbers.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.llm_client import LLMClient
from ..esg_engine.calculator import (
    CO2Calculator,
    Scope1Input,
    Scope2Input,
    Scope3Input,
)

# Anomaly thresholds
_MAX_CO2_PER_FTE_TONNES = 50     # >50 tCO2e/FTE is unusual for most sectors
_MIN_CO2_PER_FTE_TONNES = 0.05   # <0.05 may indicate missing scope 1 data
_MAX_SCOPE3_RATIO = 0.95         # if Scope 3 > 95% of total → missing S1/S2?


class GHGCalculatorAgent(BaseAgent):
    """
    Deterministic CO2 calculator + anomaly detection + LLM commentary.

    Input maps directly from the wizard submission data structure so the
    orchestrator can call this without manual field mapping.
    """

    name = "GHGCalculatorAgent"

    def __init__(self) -> None:
        super().__init__()
        self._calc = CO2Calculator()
        self._llm  = LLMClient()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          scope1:       dict  — wizard scope1 section (natural_gas_m3, diesel_liters, etc.)
          scope2:       dict  — wizard scope2 section (electricity_kwh, district_heating_kwh, country_code)
          scope3:       dict  — wizard scope3 section (avg_commute_km_one_way, employee_count, etc.)
          employee_count: int  — for intensity calculation (optional, falls back to scope3.employee_count)
          revenue_dkk:  float  — for revenue intensity (optional)
          industry_code: str   — for context in anomaly commentary
          explain_anomalies: bool  — whether to run LLM commentary (default True)
        """
        s1_data = inputs.get("scope1", {})
        s2_data = inputs.get("scope2", {})
        s3_data = inputs.get("scope3", {})
        industry = inputs.get("industry_code", "technology")
        employees = inputs.get("employee_count") or s3_data.get("employee_count") or 0
        revenue_dkk = inputs.get("revenue_dkk", 0) or 0
        explain = inputs.get("explain_anomalies", True)

        # Build typed input objects from wizard data
        scope1 = Scope1Input(
            natural_gas_m3       = float(s1_data.get("natural_gas", 0) or 0),
            diesel_liters        = float(s1_data.get("diesel", 0) or 0),
            petrol_liters        = float(s1_data.get("petrol", 0) or 0),
            lpg_liters           = float(s1_data.get("lpg", 0) or 0),
            heating_oil_liters   = float(s1_data.get("heating_oil", 0) or 0),
            coal_kg              = float(s1_data.get("coal", 0) or 0),
            biomass_wood_chips_kg= float(s1_data.get("biomass_wood_chips", 0) or 0),
            company_car_km       = float(s1_data.get("company_car_km", 0) or 0),
            company_van_km       = float(s1_data.get("company_van_km", 0) or 0),
            company_truck_km     = float(s1_data.get("company_truck_km", 0) or 0),
        )
        scope2 = Scope2Input(
            electricity_kwh      = float(s2_data.get("electricity_kwh", 0) or 0),
            district_heating_kwh = float(s2_data.get("district_heating_kwh", 0) or 0),
            country_code         = str(s2_data.get("country_code", "DK") or "DK"),
        )
        scope3 = Scope3Input(
            air_short_haul_km          = float(s3_data.get("air_short_haul_km", 0) or 0),
            air_long_haul_km           = float(s3_data.get("air_long_haul_economy_km", 0) or 0),
            air_business_class_pct     = float(s3_data.get("air_business_class_pct", 0) or 0),
            rail_km                    = float(s3_data.get("rail_km", 0) or 0),
            rental_car_km              = float(s3_data.get("rental_car_km", 0) or 0),
            taxi_km                    = float(s3_data.get("taxi_km", 0) or 0),
            employee_count             = int(employees) if employees else 0,
            avg_commute_km_one_way     = float(s3_data.get("avg_commute_km_one_way", 0) or 0),
            commute_days_per_year      = int(s3_data.get("commute_days_per_year", 220) or 220),
            purchased_goods_spend_eur  = float(s3_data.get("purchased_goods_spend_eur", 0) or 0),
            industry_code              = industry,
        )

        # Run deterministic calculation
        report = self._calc.calculate(scope1, scope2, scope3)
        result_dict = report.to_dict()

        # Intensity metrics
        co2_per_fte = report.total_tonnes / employees if employees > 0 else None
        co2_per_mDKK = report.total_tonnes / (revenue_dkk / 1_000_000) if revenue_dkk > 0 else None

        # Anomaly detection
        anomalies: list[str] = []
        if co2_per_fte is not None:
            if co2_per_fte > _MAX_CO2_PER_FTE_TONNES:
                anomalies.append(f"Meget høj CO2-intensitet: {co2_per_fte:.1f} tCO2e/mda. (forventet <{_MAX_CO2_PER_FTE_TONNES}t for de fleste brancher)")
            elif co2_per_fte < _MIN_CO2_PER_FTE_TONNES and report.total_tonnes < 1:
                anomalies.append("Ekstremt lavt CO2-aftryk — kontrollér om alle forbrug er indberettet korrekt")
        if report.total_tonnes > 0:
            scope3_ratio = report.scope3_tonnes / report.total_tonnes
            if scope3_ratio > _MAX_SCOPE3_RATIO:
                anomalies.append(f"Scope 3 udgør {scope3_ratio:.0%} af total — er Scope 1 og 2 korrekt udfyldt?")
        if scope2.electricity_kwh == 0 and scope1.natural_gas_m3 == 0:
            anomalies.append("Ingen energiforbrug indberettet i Scope 1 eller 2 — kontrollér data")

        # LLM commentary on anomalies and notable patterns
        commentary = ""
        if explain and (anomalies or report.total_tonnes > 0):
            system = (
                "Du er en dansk GHG-ekspert. Kommenter kort og professionelt på CO2-beregningsresultater. "
                "Fokusér på det mest bemærkelsesværdige. Maks 2 afsnit på dansk."
            )
            prompt = (
                f"Branche: {industry}, Medarbejdere: {employees or 'ukendt'}\n"
                f"Scope 1: {report.scope1_tonnes:.2f} tCO2e\n"
                f"Scope 2: {report.scope2_tonnes:.2f} tCO2e\n"
                f"Scope 3: {report.scope3_tonnes:.2f} tCO2e\n"
                f"Total:   {report.total_tonnes:.2f} tCO2e\n"
                + (f"CO2/mda.: {co2_per_fte:.2f} tCO2e\n" if co2_per_fte else "")
                + (f"CO2/mio.DKK: {co2_per_mDKK:.2f} tCO2e\n" if co2_per_mDKK else "")
                + (f"Anomalier: {'; '.join(anomalies)}\n" if anomalies else "")
                + "\nKommenter på de vigtigste observationer og giv 1-2 konkrete næste skridt."
            )
            commentary = await self._llm.generate(system, prompt, max_tokens=400)

        return {
            "ok":           True,
            **result_dict,
            "co2_per_fte":  round(co2_per_fte, 3) if co2_per_fte is not None else None,
            "co2_per_mDKK": round(co2_per_mDKK, 3) if co2_per_mDKK is not None else None,
            "anomalies":    anomalies,
            "commentary":   commentary,
        }
