"""
Unit tests for CO2 Calculator — verify all factors load and compute correctly.
Run: pytest tests/test_calculator.py -v
"""

import pytest
from app.services.esg_engine.calculator import (
    CO2Calculator, Scope1Input, Scope2Input, Scope3Input,
)


@pytest.fixture(scope="module")
def calc():
    return CO2Calculator()


class TestScope1:
    def test_natural_gas(self, calc):
        r = calc.calculate(
            Scope1Input(natural_gas_m3=1000),
            Scope2Input(),
            Scope3Input(),
        )
        assert r.scope1_total_kg == pytest.approx(2040.0, rel=0.01)
        assert "natural_gas" in r.scope1_breakdown
        assert r.scope1_breakdown["natural_gas"]["source_citation"].startswith("DEFRA")

    def test_diesel(self, calc):
        r = calc.calculate(Scope1Input(diesel_liters=1000), Scope2Input(), Scope3Input())
        assert r.scope1_total_kg == pytest.approx(2680.0, rel=0.01)

    def test_zero_inputs_give_zero(self, calc):
        r = calc.calculate(Scope1Input(), Scope2Input(), Scope3Input())
        assert r.total_kg == 0.0

    def test_multiple_fuels_sum(self, calc):
        r = calc.calculate(
            Scope1Input(natural_gas_m3=100, diesel_liters=100),
            Scope2Input(), Scope3Input(),
        )
        expected = 100 * 2.04 + 100 * 2.68
        assert r.scope1_total_kg == pytest.approx(expected, rel=0.01)


class TestScope2:
    def test_dk_electricity(self, calc):
        r = calc.calculate(Scope1Input(), Scope2Input(electricity_kwh=10000, country_code="DK"), Scope3Input())
        assert r.scope2_total_kg == pytest.approx(10000 * 0.154, rel=0.01)

    def test_unknown_country_falls_back_to_eu(self, calc):
        r = calc.calculate(Scope1Input(), Scope2Input(electricity_kwh=10000, country_code="XX"), Scope3Input())
        assert r.scope2_total_kg == pytest.approx(10000 * 0.296, rel=0.01)
        assert len(r.warnings) > 0

    def test_de_higher_than_dk(self, calc):
        r_dk = calc.calculate(Scope1Input(), Scope2Input(electricity_kwh=10000, country_code="DK"), Scope3Input())
        r_de = calc.calculate(Scope1Input(), Scope2Input(electricity_kwh=10000, country_code="DE"), Scope3Input())
        assert r_de.scope2_total_kg > r_dk.scope2_total_kg


class TestScope3:
    def test_short_haul_flight(self, calc):
        r = calc.calculate(Scope1Input(), Scope2Input(), Scope3Input(air_short_haul_km=1000))
        assert r.scope3_total_kg == pytest.approx(1000 * 0.255, rel=0.01)

    def test_employee_commuting(self, calc):
        r = calc.calculate(
            Scope1Input(), Scope2Input(),
            Scope3Input(employee_count=10, avg_commute_km_one_way=10, commute_days_per_year=220),
        )
        expected = 10 * 10 * 2 * 220 * 0.145
        assert r.scope3_total_kg == pytest.approx(expected, rel=0.01)

    def test_purchased_goods_unknown_industry_falls_back(self, calc):
        r = calc.calculate(
            Scope1Input(), Scope2Input(),
            Scope3Input(purchased_goods_spend_eur=10000, industry_code="unknown_xyz"),
        )
        assert r.scope3_total_kg == pytest.approx(10000 * 0.42, rel=0.01)
        assert any("general" in w for w in r.warnings)


class TestTotals:
    def test_total_equals_sum_of_scopes(self, calc):
        r = calc.calculate(
            Scope1Input(natural_gas_m3=500, diesel_liters=200),
            Scope2Input(electricity_kwh=5000, country_code="GB"),
            Scope3Input(air_short_haul_km=2000, employee_count=5, avg_commute_km_one_way=8),
        )
        assert r.total_kg == pytest.approx(r.scope1_total_kg + r.scope2_total_kg + r.scope3_total_kg, rel=1e-9)

    def test_tonnes_conversion(self, calc):
        r = calc.calculate(Scope1Input(diesel_liters=1000), Scope2Input(), Scope3Input())
        assert r.scope1_tonnes == pytest.approx(r.scope1_total_kg / 1000, rel=1e-9)
