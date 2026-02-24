"""
Tests for submission completeness logic.
No DB required — tests the _check_completeness function directly.
Run: pytest tests/test_submission_completeness.py -v
"""

import pytest
from unittest.mock import MagicMock
from app.api.v1.routes.submissions import _check_completeness


def _make_submission(
    has_energy=True, energy_nonzero=True,
    has_travel=True, has_procurement=True, has_policies=True
):
    sub = MagicMock()

    if has_energy:
        ed = MagicMock()
        ed.electricity_kwh = 5000 if energy_nonzero else 0
        ed.natural_gas_m3 = 0
        ed.diesel_liters = 0
        sub.energy_data = ed
    else:
        sub.energy_data = None

    sub.travel_data = MagicMock() if has_travel else None
    sub.procurement_data = MagicMock() if has_procurement else None
    sub.policy_data = MagicMock() if has_policies else None

    return sub


class TestCompletenessCheck:
    def test_fully_complete_submission(self):
        sub = _make_submission()
        result = _check_completeness(sub)
        assert result.is_complete is True
        assert result.completion_pct == 100
        assert len(result.blocking_issues) == 0

    def test_missing_energy_data_blocks(self):
        sub = _make_submission(has_energy=False)
        result = _check_completeness(sub)
        assert result.is_complete is False
        assert len(result.blocking_issues) > 0
        assert any("energy" in issue.lower() for issue in result.blocking_issues)

    def test_zero_energy_values_blocks(self):
        sub = _make_submission(has_energy=True, energy_nonzero=False)
        result = _check_completeness(sub)
        assert result.is_complete is False

    def test_missing_policy_data_blocks(self):
        sub = _make_submission(has_policies=False)
        result = _check_completeness(sub)
        assert result.is_complete is False
        assert any("policy" in issue.lower() for issue in result.blocking_issues)

    def test_missing_travel_is_warning_not_blocking(self):
        sub = _make_submission(has_travel=False)
        result = _check_completeness(sub)
        # Travel is not blocking — report can still generate
        assert result.is_complete is True
        assert not result.sections["travel"]["complete"]
        assert len(result.sections["travel"]["missing"]) > 0

    def test_missing_procurement_is_warning_not_blocking(self):
        sub = _make_submission(has_procurement=False)
        result = _check_completeness(sub)
        assert result.is_complete is True
        assert not result.sections["procurement"]["complete"]

    def test_completion_pct_reflects_sections(self):
        sub = _make_submission(has_travel=False, has_procurement=False)
        result = _check_completeness(sub)
        # energy + policies complete = 2/4 = 50%
        assert result.completion_pct == 50
