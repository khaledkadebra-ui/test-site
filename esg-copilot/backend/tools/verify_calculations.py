"""
Calculation verification script — ESG Copilot
=============================================
Verifies our CO2 calculator against published DEFRA 2023 and IEA 2023
reference values. Run from the backend/ directory:

    python tools/verify_calculations.py

All expected values are taken directly from:
  - DEFRA Greenhouse Gas Conversion Factors 2023 (published August 2023)
  - IEA CO2 Emissions from Fuel Combustion 2023
  - IPCC AR6 GWP100 values

Exit code 0 = all checks passed. Non-zero = failures found.
"""

import sys
import json
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Allow running from backend/ directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.esg_engine.calculator import CO2Calculator, Scope1Input, Scope2Input, Scope3Input

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m~\033[0m"


@dataclass
class Check:
    name: str
    got: float
    expected: float
    tolerance_pct: float = 1.0   # allow 1% rounding tolerance by default
    source: str = ""
    note: str = ""

    @property
    def passed(self) -> bool:
        if self.expected == 0:
            return abs(self.got) < 0.001
        return abs(self.got - self.expected) / self.expected * 100 <= self.tolerance_pct

    def render(self) -> str:
        icon = PASS if self.passed else FAIL
        diff = abs(self.got - self.expected)
        pct = diff / self.expected * 100 if self.expected != 0 else 0
        line = f"  {icon} {self.name}"
        line += f"\n       got={self.got:.4f}  expected={self.expected:.4f}  diff={diff:.4f} ({pct:.2f}%)"
        if self.source:
            line += f"\n       source: {self.source}"
        if self.note:
            line += f"\n       note: {self.note}"
        return line


def section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def run_checks(checks: list[Check]) -> int:
    failures = 0
    for c in checks:
        print(c.render())
        if not c.passed:
            failures += 1
    return failures


# ── Scope 1 — Stationary Combustion ───────────────────────────────────────────

def check_scope1() -> int:
    """
    DEFRA 2023 Table 1 — Fuels (kg CO2e per unit consumed).
    Reference: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
    """
    section("Scope 1 — Stationary Combustion (DEFRA 2023)")
    calc = CO2Calculator()

    # Natural gas: 2.04203 kg CO2e/m³ (DEFRA 2023, gross CV)
    r = calc.calculate(
        scope1=Scope1Input(natural_gas_m3=1000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    natural_gas_kg = r.scope1_total_kg

    # Diesel: 2.68740 kg CO2e/litre (DEFRA 2023)
    r2 = calc.calculate(
        scope1=Scope1Input(diesel_liters=1000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    diesel_kg = r2.scope1_total_kg

    # Petrol: 2.31380 kg CO2e/litre (DEFRA 2023)
    r3 = calc.calculate(
        scope1=Scope1Input(petrol_liters=1000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    petrol_kg = r3.scope1_total_kg

    # LPG: 1.51469 kg CO2e/litre (DEFRA 2023)
    r4 = calc.calculate(
        scope1=Scope1Input(lpg_liters=1000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    lpg_kg = r4.scope1_total_kg

    # Coal: 2.42306 kg CO2e/kg (DEFRA 2023, industrial coal)
    r5 = calc.calculate(
        scope1=Scope1Input(coal_kg=1000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    coal_kg = r5.scope1_total_kg

    checks = [
        Check("Natural gas (1,000 m³)", natural_gas_kg, 2042.03,
              source="DEFRA 2023 Table 1 — Natural gas, 2.04203 kg CO2e/m³"),
        Check("Diesel (1,000 litres)", diesel_kg, 2687.40,
              source="DEFRA 2023 Table 1 — Diesel, 2.68740 kg CO2e/litre"),
        Check("Petrol (1,000 litres)", petrol_kg, 2313.80,
              source="DEFRA 2023 Table 1 — Petrol, 2.31380 kg CO2e/litre"),
        Check("LPG (1,000 litres)", lpg_kg, 1514.69,
              source="DEFRA 2023 Table 1 — LPG, 1.51469 kg CO2e/litre"),
        Check("Coal (1,000 kg)", coal_kg, 2423.06,
              source="DEFRA 2023 Table 1 — Industrial coal, 2.42306 kg CO2e/kg"),
    ]
    return run_checks(checks)


# ── Scope 1 — Mobile Combustion (Company Vehicles) ────────────────────────────

def check_scope1_mobile() -> int:
    """
    DEFRA 2023 Table 3 — Company cars and vans (kg CO2e per km).
    """
    section("Scope 1 — Mobile Combustion / Company Vehicles (DEFRA 2023)")
    calc = CO2Calculator()

    r_car = calc.calculate(
        scope1=Scope1Input(company_car_km=10000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    r_van = calc.calculate(
        scope1=Scope1Input(company_van_km=10000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )
    r_truck = calc.calculate(
        scope1=Scope1Input(company_truck_km=10000),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(),
    )

    checks = [
        Check("Company car avg (10,000 km)", r_car.scope1_total_kg, 1710.0,
              source="DEFRA 2023 Table 3 — Average car, 0.171 kg CO2e/km"),
        Check("Company van avg (10,000 km)", r_van.scope1_total_kg, 2400.0,
              source="DEFRA 2023 Table 3 — Average van, 0.240 kg CO2e/km"),
        Check("HGV truck (10,000 km)", r_truck.scope1_total_kg, 9130.0,
              source="DEFRA 2023 Table 4 — HGV rigid >3.5t, 0.913 kg CO2e/km"),
    ]
    return run_checks(checks)


# ── Scope 2 — Purchased Electricity ───────────────────────────────────────────

def check_scope2() -> int:
    """
    IEA CO2 Emissions from Fuel Combustion 2023 — grid emission factors.
    Location-based method.
    """
    section("Scope 2 — Purchased Electricity (IEA 2023, location-based)")
    calc = CO2Calculator()

    results = {}
    for country, expected_factor in [
        ("DK", 0.154),   # IEA 2023: Denmark grid decarbonised via wind
        ("SE", 0.013),   # IEA 2023: Sweden (nuclear + hydro dominated)
        ("DE", 0.366),   # IEA 2023: Germany (coal phase-out in progress)
        ("FR", 0.052),   # IEA 2023: France (nuclear dominated)
        ("PL", 0.773),   # IEA 2023: Poland (coal dominated)
    ]:
        r = calc.calculate(
            scope1=Scope1Input(),
            scope2=Scope2Input(electricity_kwh=1000, country_code=country),
            scope3=Scope3Input(),
        )
        results[country] = (r.scope2_total_kg, expected_factor * 1000)

    checks = [
        Check(f"Denmark (DK) 1,000 kWh", results["DK"][0], results["DK"][1],
              source="IEA 2023 — DK grid factor 0.154 kg CO2e/kWh"),
        Check(f"Sweden (SE) 1,000 kWh", results["SE"][0], results["SE"][1],
              source="IEA 2023 — SE grid factor 0.013 kg CO2e/kWh"),
        Check(f"Germany (DE) 1,000 kWh", results["DE"][0], results["DE"][1],
              source="IEA 2023 — DE grid factor 0.366 kg CO2e/kWh"),
        Check(f"France (FR) 1,000 kWh", results["FR"][0], results["FR"][1],
              source="IEA 2023 — FR grid factor 0.052 kg CO2e/kWh"),
        Check(f"Poland (PL) 1,000 kWh", results["PL"][0], results["PL"][1],
              source="IEA 2023 — PL grid factor 0.773 kg CO2e/kWh"),
    ]
    return run_checks(checks)


# ── Scope 3 — Business Travel ─────────────────────────────────────────────────

def check_scope3_travel() -> int:
    """
    DEFRA 2023 Table 6 — Passenger travel (kg CO2e per passenger-km).
    """
    section("Scope 3 — Business Travel (DEFRA 2023 Table 6)")
    calc = CO2Calculator()

    r_air_short = calc.calculate(
        scope1=Scope1Input(),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(air_short_haul_km=1000),
    )
    r_air_long = calc.calculate(
        scope1=Scope1Input(),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(air_long_haul_km=1000),
    )
    r_rail = calc.calculate(
        scope1=Scope1Input(),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(rail_km=1000),
    )

    checks = [
        Check("Short-haul flight (1,000 pkm)", r_air_short.scope3_total_kg, 255.0,
              source="DEFRA 2023 Table 6 — Short-haul intl flight, economy, 0.255 kg CO2e/pkm"),
        Check("Long-haul flight (1,000 pkm)", r_air_long.scope3_total_kg, 195.0,
              source="DEFRA 2023 Table 6 — Long-haul intl flight, economy, 0.195 kg CO2e/pkm"),
        Check("Rail (1,000 pkm)", r_rail.scope3_total_kg, 35.0,
              source="DEFRA 2023 Table 6 — Rail (average), 0.035 kg CO2e/pkm"),
    ]
    return run_checks(checks)


# ── Scope 3 — Employee Commuting ──────────────────────────────────────────────

def check_scope3_commuting() -> int:
    """
    DEFRA 2023 — commuting calculation using mixed-mode average.
    Formula: employees × commute_km × 2 (round trip) × days × mode_factor
    """
    section("Scope 3 — Employee Commuting (DEFRA 2023 mixed-mode)")
    calc = CO2Calculator()

    # 10 employees, 10 km one-way, 220 days/year, default mode split (60/25/15)
    # Mixed-mode avg factor ≈ 0.145 kg CO2e/km
    # Total km = 10 × 10 × 2 × 220 = 44,000 km
    # Expected = 44,000 × 0.145 = 6,380 kg CO2e
    r = calc.calculate(
        scope1=Scope1Input(),
        scope2=Scope2Input(electricity_kwh=0, country_code="DK"),
        scope3=Scope3Input(
            employee_count=10,
            avg_commute_km_one_way=10,
            commute_days_per_year=220,
        ),
    )

    checks = [
        Check(
            "Commuting: 10 employees, 10 km, 220 days",
            r.scope3_total_kg,
            6380.0,
            tolerance_pct=5.0,  # wider tolerance — mixed mode approximation
            source="DEFRA 2023 — mixed mode avg 0.145 kg CO2e/km",
            note="10 emp × 10 km × 2 × 220 days × 0.145 = 6,380 kg CO2e",
        ),
    ]
    return run_checks(checks)


# ── Scope additivity check ─────────────────────────────────────────────────────

def check_additivity() -> int:
    """Total must equal sum of scopes — always."""
    section("Additivity — total == scope1 + scope2 + scope3")
    calc = CO2Calculator()

    r = calc.calculate(
        scope1=Scope1Input(natural_gas_m3=5000, diesel_liters=2000, company_car_km=50000),
        scope2=Scope2Input(electricity_kwh=80000, country_code="DK"),
        scope3=Scope3Input(
            air_short_haul_km=15000,
            employee_count=25,
            avg_commute_km_one_way=12,
            purchased_goods_spend_eur=200000,
            industry_code="technology",
        ),
    )

    expected_total = r.scope1_total_kg + r.scope2_total_kg + r.scope3_total_kg
    checks = [
        Check(
            "total_kg == scope1 + scope2 + scope3",
            r.total_kg,
            expected_total,
            tolerance_pct=0.001,
            source="Internal consistency check",
        ),
    ]
    return run_checks(checks)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 60)
    print("  ESG Copilot — Calculation Verification")
    print("  Against DEFRA 2023 & IEA 2023 reference values")
    print("═" * 60)

    total_failures = 0
    total_failures += check_scope1()
    total_failures += check_scope1_mobile()
    total_failures += check_scope2()
    total_failures += check_scope3_travel()
    total_failures += check_scope3_commuting()
    total_failures += check_additivity()

    print("\n" + "═" * 60)
    if total_failures == 0:
        print(f"  {PASS} All checks passed. Emission factors verified.")
    else:
        print(f"  {FAIL} {total_failures} check(s) failed. Review emission factors in scope*_factors.json.")
    print("═" * 60 + "\n")

    sys.exit(0 if total_failures == 0 else 1)


if __name__ == "__main__":
    main()
