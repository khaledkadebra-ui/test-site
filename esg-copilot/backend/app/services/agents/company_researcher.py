"""
CompanyResearcherAgent
======================
Researches a Danish company using:
  1. CVR API (free, cvrapi.dk) — name, industry, employees, address
  2. Optional: company website headline extraction via httpx

Used by the Orchestrator when a user provides a CVR number and wants
automatic company profile population.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from .base import BaseAgent

logger = logging.getLogger("agents.company_researcher")

_INDUSTRY_MAP = {
    "fremstilling":        "manufacturing",
    "handel":              "retail",
    "service":             "retail",
    "byggeri":             "construction",
    "anlæg":               "construction",
    "transport":           "logistics",
    "landbrug":            "agriculture",
    "skovbrug":            "agriculture",
    "fiskeri":             "agriculture",
    "hotel":               "hospitality",
    "restauration":        "hospitality",
    "sundhed":             "healthcare",
    "social":              "healthcare",
    "finans":              "finance",
    "forsikring":          "finance",
    "it":                  "technology",
    "telekommunikation":   "technology",
    "information":         "technology",
}


class CompanyResearcherAgent(BaseAgent):
    name = "CompanyResearcherAgent"

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          cvr: str  — 8-digit Danish CVR number
        """
        cvr = str(inputs.get("cvr", "")).replace(" ", "").replace("-", "")
        if len(cvr) < 8:
            return {"ok": False, "error": "CVR-nummer skal være 8 cifre"}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://cvrapi.dk/api",
                    params={"search": cvr, "country": "dk"},
                    headers={"User-Agent": "ESG-Copilot/1.0"},
                )
                if resp.status_code == 404:
                    return {"ok": False, "error": f"CVR {cvr} ikke fundet i CVR-registret"}
                resp.raise_for_status()
                data = resp.json()
        except httpx.TimeoutException:
            return {"ok": False, "error": "CVR-opslag timeout"}
        except Exception as exc:
            logger.warning("CVR lookup error: %s", exc)
            return {"ok": False, "error": str(exc)}

        raw_industry = (data.get("industrydesc") or "").lower()
        industry_code = "technology"
        for dk_word, code in _INDUSTRY_MAP.items():
            if dk_word in raw_industry:
                industry_code = code
                break

        return {
            "ok":            True,
            "cvr":           cvr,
            "name":          data.get("name", ""),
            "industry_code": industry_code,
            "industry_desc": data.get("industrydesc", ""),
            "city":          data.get("city", ""),
            "zipcode":       data.get("zipcode", ""),
            "country_code":  "DK",
            "employee_count": data.get("employees") or None,
            "founded_year":  data.get("startdate", "")[:4] if data.get("startdate") else None,
        }
