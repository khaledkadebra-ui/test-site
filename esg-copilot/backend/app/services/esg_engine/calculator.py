"""
CO2 Emissions Calculator — ESG Copilot
=======================================
Deterministic calculation engine. All emission factors are loaded from
verified JSON files sourced from IPCC AR6, DEFRA 2023, and IEA 2023.

CRITICAL: This module must never call the LLM or accept AI-generated numbers.
All outputs feed into report_results — the LLM only reads these outputs for
narrative generation, never writes to them.
"""

import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "emission_factors"


# ─────────────────────────────────────────────────────────────────────────────
# INPUT DATA CLASSES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Scope1Input:
    """Direct emissions — stationary and mobile combustion."""
    # Stationary combustion
    natural_gas_m3: float = 0.0
    diesel_liters: float = 0.0
    petrol_liters: float = 0.0
    lpg_liters: float = 0.0
    heating_oil_liters: float = 0.0
    coal_kg: float = 0.0
    biomass_wood_chips_kg: float = 0.0

    # Mobile combustion (company-owned fleet)
    company_car_km: float = 0.0
    company_van_km: float = 0.0
    company_truck_km: float = 0.0


@dataclass
class Scope2Input:
    """Indirect energy emissions — purchased electricity and heat."""
    electricity_kwh: float = 0.0
    district_heating_kwh: float = 0.0
    country_code: str = "EU_AVERAGE"   # ISO 3166-1 alpha-2 or EU_AVERAGE


@dataclass
class Scope3Input:
    """Value chain emissions — travel, commuting, purchased goods."""
    # Category 6: Business travel
    air_short_haul_km: float = 0.0     # economy, <3700 km
    air_long_haul_km: float = 0.0      # economy, >3700 km
    air_business_class_pct: float = 0.0  # % of long-haul km in business class
    rail_km: float = 0.0
    rental_car_km: float = 0.0
    taxi_km: float = 0.0

    # Category 7: Employee commuting
    employee_count: int = 0
    avg_commute_km_one_way: float = 0.0
    commute_days_per_year: int = 220

    # Category 1: Purchased goods & services (spend-based)
    purchased_goods_spend_eur: float = 0.0
    industry_code: str = "general"


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT DATA CLASSES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class LineItem:
    """Single emission line item with full audit trail."""
    source_key: str             # e.g. "natural_gas"
    kg_co2e: float
    input_value: float
    input_unit: str             # e.g. "m3", "liters", "km", "EUR"
    factor_value: float
    factor_unit: str            # e.g. "kg_co2e_per_m3"
    source_citation: str        # e.g. "DEFRA 2023 — Natural gas, gross CV"
    scope3_category: Optional[str] = None  # e.g. "Cat 1", "Cat 6", "Cat 7"


@dataclass
class CalculationReport:
    """Full calculation output. All values in kg CO2e."""
    scope1_total_kg: float = 0.0
    scope2_total_kg: float = 0.0
    scope3_total_kg: float = 0.0
    total_kg: float = 0.0

    scope1_breakdown: dict[str, dict] = field(default_factory=dict)
    scope2_breakdown: dict[str, dict] = field(default_factory=dict)
    scope3_breakdown: dict[str, dict] = field(default_factory=dict)

    warnings: list[str] = field(default_factory=list)  # data quality flags

    @property
    def total_tonnes(self) -> float:
        return self.total_kg / 1000

    @property
    def scope1_tonnes(self) -> float:
        return self.scope1_total_kg / 1000

    @property
    def scope2_tonnes(self) -> float:
        return self.scope2_total_kg / 1000

    @property
    def scope3_tonnes(self) -> float:
        return self.scope3_total_kg / 1000

    def to_dict(self) -> dict:
        return {
            "scope1_total_kg": self.scope1_total_kg,
            "scope2_total_kg": self.scope2_total_kg,
            "scope3_total_kg": self.scope3_total_kg,
            "total_kg": self.total_kg,
            "scope1_total_tonnes": self.scope1_tonnes,
            "scope2_total_tonnes": self.scope2_tonnes,
            "scope3_total_tonnes": self.scope3_tonnes,
            "total_tonnes": self.total_tonnes,
            "scope1_breakdown": self.scope1_breakdown,
            "scope2_breakdown": self.scope2_breakdown,
            "scope3_breakdown": self.scope3_breakdown,
            "warnings": self.warnings,
        }


# ─────────────────────────────────────────────────────────────────────────────
# CALCULATOR
# ─────────────────────────────────────────────────────────────────────────────

class CO2Calculator:
    """
    Deterministic CO2 calculator using verified emission factors.

    Usage:
        calc = CO2Calculator()
        report = calc.calculate(scope1, scope2, scope3)
    """

    def __init__(self):
        self._s1 = self._load("scope1_factors.json")["factors"]
        self._s2 = self._load("scope2_factors.json")
        self._s3 = self._load("scope3_factors.json")

    @staticmethod
    def _load(filename: str) -> dict:
        path = DATA_DIR / filename
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def calculate(
        self,
        scope1: Scope1Input,
        scope2: Scope2Input,
        scope3: Scope3Input,
    ) -> CalculationReport:
        report = CalculationReport()

        self._calc_scope1(scope1, report)
        self._calc_scope2(scope2, report)
        self._calc_scope3(scope3, report)

        report.total_kg = (
            report.scope1_total_kg
            + report.scope2_total_kg
            + report.scope3_total_kg
        )
        return report

    # ── SCOPE 1 ──────────────────────────────────────────────────────────────

    def _calc_scope1(self, d: Scope1Input, report: CalculationReport) -> None:
        bd = {}

        def add(key: str, value: float, unit: str, factor_key: str, amount_key: str):
            if value <= 0:
                return
            f = self._s1[factor_key]
            factor_value = f[amount_key]
            kg = value * factor_value
            bd[key] = {
                "kg_co2e": round(kg, 4),
                "input_value": value,
                "input_unit": unit,
                "factor_value": factor_value,
                "factor_unit": amount_key,
                "source_citation": f["source"],
            }

        add("natural_gas",        d.natural_gas_m3,       "m3",     "natural_gas",        "kg_co2e_per_m3")
        add("diesel",             d.diesel_liters,         "liters", "diesel",             "kg_co2e_per_liter")
        add("petrol",             d.petrol_liters,         "liters", "petrol",             "kg_co2e_per_liter")
        add("lpg",                d.lpg_liters,            "liters", "lpg",                "kg_co2e_per_liter")
        add("heating_oil",        d.heating_oil_liters,    "liters", "heating_oil",        "kg_co2e_per_liter")
        add("coal",               d.coal_kg,               "kg",     "coal",               "kg_co2e_per_kg")
        add("biomass_wood_chips", d.biomass_wood_chips_kg, "kg",     "biomass_wood_chips", "kg_co2e_per_kg")
        add("company_car",        d.company_car_km,        "km",     "company_car_avg",    "kg_co2e_per_km")
        add("company_van",        d.company_van_km,        "km",     "company_van_avg",    "kg_co2e_per_km")
        add("company_truck",      d.company_truck_km,      "km",     "company_truck_hgv_avg", "kg_co2e_per_km")

        report.scope1_breakdown = bd
        report.scope1_total_kg = round(sum(v["kg_co2e"] for v in bd.values()), 4)

    # ── SCOPE 2 ──────────────────────────────────────────────────────────────

    def _calc_scope2(self, d: Scope2Input, report: CalculationReport) -> None:
        bd = {}
        country = d.country_code.upper()
        grid_factors = self._s2["grid_emission_factors"]

        # Fall back to EU average if country not found
        if country not in grid_factors:
            country = "EU_AVERAGE"
            report.warnings.append(
                f"Grid emission factor not found for country '{d.country_code}'. "
                f"EU average (0.296 kg CO2e/kWh) applied."
            )
        gf = grid_factors[country]

        if d.electricity_kwh > 0:
            kg = d.electricity_kwh * gf["kg_co2e_per_kwh"]
            bd["electricity"] = {
                "kg_co2e": round(kg, 4),
                "input_value": d.electricity_kwh,
                "input_unit": "kWh",
                "factor_value": gf["kg_co2e_per_kwh"],
                "factor_unit": "kg_co2e_per_kwh",
                "source_citation": gf["source"],
                "country_applied": country,
            }

        if d.district_heating_kwh > 0:
            dh_factors = self._s2["district_heating"]
            dh_country = country if country in dh_factors else "EU_AVERAGE"
            dhf = dh_factors[dh_country]
            kg = d.district_heating_kwh * dhf["kg_co2e_per_kwh"]
            bd["district_heating"] = {
                "kg_co2e": round(kg, 4),
                "input_value": d.district_heating_kwh,
                "input_unit": "kWh",
                "factor_value": dhf["kg_co2e_per_kwh"],
                "factor_unit": "kg_co2e_per_kwh",
                "source_citation": dhf["source"],
                "country_applied": dh_country,
            }

        report.scope2_breakdown = bd
        report.scope2_total_kg = round(sum(v["kg_co2e"] for v in bd.values()), 4)

    # ── SCOPE 3 ──────────────────────────────────────────────────────────────

    def _calc_scope3(self, d: Scope3Input, report: CalculationReport) -> None:
        bd = {}
        bt = self._s3["business_travel"]
        ec = self._s3["employee_commuting"]
        pg = self._s3["purchased_goods"]["spend_based"]

        # Category 6: Business travel — flights
        if d.air_short_haul_km > 0:
            f = bt["short_haul_flight"]
            kg = d.air_short_haul_km * f["kg_co2e_per_pkm"]
            bd["air_short_haul"] = _s3_item("air_short_haul", kg, d.air_short_haul_km, "pkm", f["kg_co2e_per_pkm"], "kg_co2e_per_pkm", f["source"], "Cat 6")

        if d.air_long_haul_km > 0:
            # Split by cabin class
            business_km = d.air_long_haul_km * (d.air_business_class_pct / 100)
            economy_km = d.air_long_haul_km - business_km

            if economy_km > 0:
                f = bt["long_haul_flight"]
                kg = economy_km * f["kg_co2e_per_pkm"]
                bd["air_long_haul_economy"] = _s3_item("air_long_haul_economy", kg, economy_km, "pkm", f["kg_co2e_per_pkm"], "kg_co2e_per_pkm", f["source"], "Cat 6")

            if business_km > 0:
                f = bt["long_haul_flight_business"]
                kg = business_km * f["kg_co2e_per_pkm"]
                bd["air_long_haul_business"] = _s3_item("air_long_haul_business", kg, business_km, "pkm", f["kg_co2e_per_pkm"], "kg_co2e_per_pkm", f["source"], "Cat 6")

        if d.rail_km > 0:
            f = bt["rail"]
            kg = d.rail_km * f["kg_co2e_per_pkm"]
            bd["rail"] = _s3_item("rail", kg, d.rail_km, "pkm", f["kg_co2e_per_pkm"], "kg_co2e_per_pkm", f["source"], "Cat 6")

        if d.rental_car_km > 0:
            f = bt["rental_car"]
            kg = d.rental_car_km * f["kg_co2e_per_km"]
            bd["rental_car"] = _s3_item("rental_car", kg, d.rental_car_km, "km", f["kg_co2e_per_km"], "kg_co2e_per_km", f["source"], "Cat 6")

        if d.taxi_km > 0:
            f = bt["taxi"]
            kg = d.taxi_km * f["kg_co2e_per_km"]
            bd["taxi"] = _s3_item("taxi", kg, d.taxi_km, "km", f["kg_co2e_per_km"], "kg_co2e_per_km", f["source"], "Cat 6")

        # Category 7: Employee commuting
        if d.employee_count > 0 and d.avg_commute_km_one_way > 0:
            f = ec["avg_mixed_mode"]
            # Round trip × commute days × employees
            total_km = d.employee_count * d.avg_commute_km_one_way * 2 * d.commute_days_per_year
            kg = total_km * f["kg_co2e_per_km"]
            bd["employee_commuting"] = _s3_item(
                "employee_commuting", kg, total_km, "total_km",
                f["kg_co2e_per_km"], "kg_co2e_per_km", f["source"], "Cat 7"
            )
            bd["employee_commuting"]["commuting_details"] = {
                "employees": d.employee_count,
                "avg_one_way_km": d.avg_commute_km_one_way,
                "commute_days": d.commute_days_per_year,
            }

        # Category 1: Purchased goods (spend-based)
        if d.purchased_goods_spend_eur > 0:
            industry_key = d.industry_code if d.industry_code in pg else "general"
            if industry_key != d.industry_code:
                report.warnings.append(
                    f"Industry code '{d.industry_code}' not found in spend-based factors. "
                    f"'general' factor applied (0.42 kg CO2e/EUR)."
                )
            f = pg[industry_key]
            kg = d.purchased_goods_spend_eur * f["kg_co2e_per_eur"]
            bd["purchased_goods"] = _s3_item(
                "purchased_goods", kg, d.purchased_goods_spend_eur, "EUR",
                f["kg_co2e_per_eur"], "kg_co2e_per_eur", f["source"], "Cat 1"
            )
            bd["purchased_goods"]["uncertainty"] = "±50% — spend-based EEIO method"

        report.scope3_breakdown = bd
        report.scope3_total_kg = round(sum(v["kg_co2e"] for v in bd.values()), 4)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _s3_item(
    source_key: str,
    kg: float,
    input_value: float,
    input_unit: str,
    factor_value: float,
    factor_unit: str,
    source_citation: str,
    scope3_category: str,
) -> dict:
    return {
        "kg_co2e": round(kg, 4),
        "input_value": input_value,
        "input_unit": input_unit,
        "factor_value": factor_value,
        "factor_unit": factor_unit,
        "source_citation": source_citation,
        "scope3_category": scope3_category,
    }
