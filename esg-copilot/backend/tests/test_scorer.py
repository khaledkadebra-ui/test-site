"""
Unit tests for ESG Scorer — verify scoring logic and edge cases.
Run: pytest tests/test_scorer.py -v
"""

import pytest
from app.services.esg_engine.scorer import ESGScorer, ScorerInput


@pytest.fixture(scope="module")
def scorer():
    return ESGScorer()


def _base_input(**overrides) -> ScorerInput:
    defaults = dict(
        industry_code="technology",
        employee_count=30,
        country_code="DK",
        revenue_eur=3_000_000,
        reporting_year=2025,
        total_co2e_tonnes=25.0,
        scope2_co2e_tonnes=10.0,
        electricity_kwh=65000,
    )
    defaults.update(overrides)
    return ScorerInput(**defaults)


class TestEnvironmentalScoring:
    def test_low_intensity_gets_high_score(self, scorer):
        # 25t / 3M EUR = 8.3 t/M — well under tech benchmark of 18
        s = scorer.score(_base_input(total_co2e_tonnes=25.0, revenue_eur=3_000_000))
        assert s.environmental.breakdown["ghg_intensity"]["score"] == 30

    def test_100pct_renewable_gets_full_points(self, scorer):
        s = scorer.score(_base_input(renewable_electricity_pct=100.0))
        assert s.environmental.breakdown["renewable_energy"]["score"] == 20

    def test_no_renewable_gets_zero_and_gap(self, scorer):
        s = scorer.score(_base_input(renewable_electricity_pct=0.0))
        assert s.environmental.breakdown["renewable_energy"]["score"] == 0
        assert any("renewable" in g.lower() for g in s.environmental.gaps)

    def test_net_zero_target_gets_full_climate_points(self, scorer):
        s = scorer.score(_base_input(has_net_zero_target=True))
        assert s.environmental.breakdown["climate_targets"]["score"] == 25

    def test_no_target_gets_zero_and_gap(self, scorer):
        s = scorer.score(_base_input(has_net_zero_target=False, has_energy_reduction_target=False))
        assert s.environmental.breakdown["climate_targets"]["score"] == 0


class TestSocialScoring:
    def test_full_hs_policy_and_zero_ltir(self, scorer):
        s = scorer.score(_base_input(has_health_safety_policy=True, lost_time_injury_rate=0.0))
        assert s.social.breakdown["health_safety"]["score"] == 35

    def test_missing_hs_policy_creates_gap(self, scorer):
        s = scorer.score(_base_input(has_health_safety_policy=False))
        assert any("health" in g.lower() for g in s.social.gaps)

    def test_high_training_hours(self, scorer):
        s = scorer.score(_base_input(has_training_program=True, avg_training_hours_per_employee=40))
        assert s.social.breakdown["training_development"]["score"] == 25


class TestGovernanceScoring:
    def test_all_policies_gives_high_g_score(self, scorer):
        s = scorer.score(_base_input(
            has_esg_policy=True,
            has_code_of_conduct=True,
            has_anti_corruption_policy=True,
            has_data_privacy_policy=True,
            has_board_esg_oversight=True,
            esg_reporting_year=2024,
            supply_chain_code_of_conduct=True,
        ))
        assert s.governance.score == 100.0

    def test_no_gdpr_policy_creates_gap(self, scorer):
        s = scorer.score(_base_input(has_data_privacy_policy=False))
        assert any("gdpr" in g.lower() or "privacy" in g.lower() for g in s.governance.gaps)


class TestWeighting:
    def test_total_is_weighted_average(self, scorer):
        s = scorer.score(_base_input(
            renewable_electricity_pct=100,
            has_net_zero_target=True,
            has_waste_policy=True,
            has_health_safety_policy=True,
            has_esg_policy=True,
            has_data_privacy_policy=True,
        ))
        expected = s.environmental.score * 0.5 + s.social.score * 0.3 + s.governance.score * 0.2
        assert s.total == pytest.approx(expected, abs=0.1)

    def test_rating_scale(self, scorer):
        # A company with all policies should get at least a C
        s = scorer.score(_base_input(
            has_esg_policy=True, has_data_privacy_policy=True, has_code_of_conduct=True,
            has_health_safety_policy=True, renewable_electricity_pct=50,
        ))
        assert s.rating in ("A", "B", "C")

    def test_empty_company_gets_e_rating(self, scorer):
        s = scorer.score(_base_input(total_co2e_tonnes=9999))
        assert s.rating in ("D", "E")
