"""
BenchmarkAgent
==============
Compares a company's ESG score and CO2 intensity against industry averages
for Danish SMEs. Uses built-in benchmark data (updated annually).

Data sources: ESRS SME pilot data 2024, Statistics Denmark, DEFRA.
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent

# ---------------------------------------------------------------------------
# Industry benchmark data — Danish SME averages (50-249 employees)
# Source: ESRS pilot, Statistics Denmark, own estimates
# Values: avg_esg_score (0-100), avg_co2e_per_employee (tCO2e/year/FTE)
# ---------------------------------------------------------------------------

_BENCHMARKS: dict[str, dict] = {
    "technology":    {"avg_esg": 58, "p75_esg": 72, "avg_co2_per_fte": 2.1,  "top_quartile_co2": 1.2},
    "manufacturing": {"avg_esg": 44, "p75_esg": 60, "avg_co2_per_fte": 8.4,  "top_quartile_co2": 4.5},
    "retail":        {"avg_esg": 49, "p75_esg": 63, "avg_co2_per_fte": 3.2,  "top_quartile_co2": 1.8},
    "construction":  {"avg_esg": 41, "p75_esg": 57, "avg_co2_per_fte": 6.8,  "top_quartile_co2": 3.5},
    "logistics":     {"avg_esg": 43, "p75_esg": 59, "avg_co2_per_fte": 12.1, "top_quartile_co2": 6.2},
    "agriculture":   {"avg_esg": 38, "p75_esg": 54, "avg_co2_per_fte": 18.5, "top_quartile_co2": 9.0},
    "finance":       {"avg_esg": 61, "p75_esg": 75, "avg_co2_per_fte": 1.8,  "top_quartile_co2": 0.9},
    "healthcare":    {"avg_esg": 55, "p75_esg": 69, "avg_co2_per_fte": 2.5,  "top_quartile_co2": 1.4},
    "hospitality":   {"avg_esg": 45, "p75_esg": 61, "avg_co2_per_fte": 4.8,  "top_quartile_co2": 2.5},
}
_DEFAULT_BENCHMARK = {"avg_esg": 50, "p75_esg": 65, "avg_co2_per_fte": 4.0, "top_quartile_co2": 2.0}


class BenchmarkAgent(BaseAgent):
    name = "BenchmarkAgent"

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          industry_code:     str
          esg_score_total:   float
          total_co2e_tonnes: float  (optional)
          employee_count:    int    (optional)
        """
        industry    = inputs.get("industry_code", "technology")
        esg_score   = inputs.get("esg_score_total", 50)
        co2_total   = inputs.get("total_co2e_tonnes", 0) or 0
        employees   = inputs.get("employee_count", 25) or 25

        bench = _BENCHMARKS.get(industry, _DEFAULT_BENCHMARK)
        avg_esg    = bench["avg_esg"]
        p75_esg    = bench["p75_esg"]
        avg_co2_fte = bench["avg_co2_per_fte"]
        top_co2_fte = bench["top_quartile_co2"]

        # ESG percentile estimate
        if esg_score >= p75_esg:
            esg_percentile = 75 + round((esg_score - p75_esg) / (100 - p75_esg) * 25)
        elif esg_score >= avg_esg:
            esg_percentile = 50 + round((esg_score - avg_esg) / (p75_esg - avg_esg) * 25)
        else:
            esg_percentile = max(5, round(esg_score / avg_esg * 50))

        esg_vs_avg = esg_score - avg_esg

        # CO2 intensity
        co2_per_fte = co2_total / employees if employees > 0 else 0
        co2_vs_avg  = co2_per_fte - avg_co2_fte
        co2_pct_diff = round((co2_vs_avg / avg_co2_fte) * 100, 0) if avg_co2_fte > 0 else 0

        potential_score = min(100, round(p75_esg + (esg_score - avg_esg) * 0.3 + 5))

        return {
            "ok":                True,
            "industry":          industry,
            "esg_score":         esg_score,
            "industry_avg_esg":  avg_esg,
            "industry_p75_esg":  p75_esg,
            "esg_percentile":    min(99, esg_percentile),
            "esg_vs_avg":        round(esg_vs_avg, 1),
            "esg_position":      "over" if esg_vs_avg >= 0 else "under",
            "co2_per_fte":       round(co2_per_fte, 2),
            "industry_avg_co2":  avg_co2_fte,
            "top_quartile_co2":  top_co2_fte,
            "co2_vs_avg_pct":    co2_pct_diff,
            "co2_position":      "bedre" if co2_vs_avg <= 0 else "højere",
            "summary": (
                f"ESG-score {esg_score}/100 placerer jer i toppen af de {100 - esg_percentile}% "
                f"i {industry}-branchen (branchegennemsnit: {avg_esg}). "
                + (
                    f"CO2-intensitet: {co2_per_fte:.1f} tCO2e/mda. vs. branchegennemsnit {avg_co2_fte:.1f}."
                    if co2_total > 0 else ""
                )
            ),
        }
