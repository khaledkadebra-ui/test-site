"""
AgentOrchestrator
==================
Uses Anthropic tool use so Claude can decide which specialist agents to invoke
and in what order, based on the user's request and available data.

The orchestrator exposes each specialist agent as a "tool" that Claude can call.
Claude reasons about what's needed, calls tools, gets results, and synthesises
a final Danish response.

Usage:
    orchestrator = AgentOrchestrator()
    result = await orchestrator.run({
        "user_message": "Hvad mangler vi for at færdiggøre VSME-rapporten?",
        "context": {
            "company_name": "Acme ApS",
            "submission_data": {...},   # optional — current wizard data
            "report_data": {...},       # optional — latest report
        }
    })
    # result["answer"]  — final Danish response
    # result["trace"]   — list of agent calls made
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import anthropic

logger = logging.getLogger("agents.orchestrator")

# ---------------------------------------------------------------------------
# Tool definitions — one per specialist capability
# ---------------------------------------------------------------------------

_TOOLS: list[dict] = [
    {
        "name": "check_vsme_compliance",
        "description": (
            "Kontrollerer om virksomhedens VSME-dataindberetning er komplet i henhold til VSME Basic Modul. "
            "Returnerer liste over manglende obligatoriske felter og anbefalede felter."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "submission_data": {
                    "type": "object",
                    "description": "Den aktuelle dataindberetning fra wizarden (scope1, scope2, scope3, workforce, environment, governance)"
                },
                "industry_code": {"type": "string", "description": "Branchekode, f.eks. 'manufacturing'"}
            },
            "required": ["submission_data"],
        },
    },
    {
        "name": "assess_climate_risks",
        "description": (
            "Identificerer fysiske klimarisici (oversvømmelse, tørke, ekstremvarme) og transitionsrisici "
            "(CO2-afgifter, regulering, markedsændringer) baseret på virksomhedens profil og branche."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "industry_code":  {"type": "string"},
                "country_code":   {"type": "string", "description": "ISO-2, f.eks. 'DK'"},
                "employee_count": {"type": "integer"},
                "scope1_co2e":    {"type": "number", "description": "Scope 1 CO2e i tCO2e"},
                "scope2_co2e":    {"type": "number"},
                "scope3_co2e":    {"type": "number"},
            },
            "required": ["industry_code"],
        },
    },
    {
        "name": "generate_improvement_actions",
        "description": (
            "Genererer konkrete, prioriterede SMART-handlingsplaner for at forbedre ESG-scoren "
            "baseret på den aktuelle score og de identificerede mangler."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "esg_score_total": {"type": "number"},
                "esg_score_e":     {"type": "number"},
                "esg_score_s":     {"type": "number"},
                "esg_score_g":     {"type": "number"},
                "gap_areas":       {"type": "array", "items": {"type": "string"},
                                   "description": "Liste over svage områder fra gap-analysen"},
                "industry_code":   {"type": "string"},
            },
            "required": ["esg_score_total", "gap_areas"],
        },
    },
    {
        "name": "build_roadmap",
        "description": (
            "Bygger en Q1–Q4 handlingsplan med konkrete milepæle, ejere og tidsfrister "
            "for at implementere forbedringerne fra handlingsplanen."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "improvement_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Liste over anbefalede forbedringstiltag"
                },
                "reporting_year": {"type": "integer"},
                "company_size":   {"type": "string", "enum": ["micro", "small", "medium"]},
            },
            "required": ["improvement_actions"],
        },
    },
    {
        "name": "validate_report_quality",
        "description": (
            "Gennemgår en genereret ESG-rapport for konsistens, manglende afsnit, "
            "interne modsigelser og potentielle faktuelle fejl. Returnerer en kvalitetsscore og liste over problemer."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "report_sections": {
                    "type": "object",
                    "description": "Rapportafsnittene som nøgle-værdi-par (section_name → text)"
                },
                "co2_data":    {"type": "object", "description": "CO2-beregningsdata til krydsvalidering"},
                "esg_scores":  {"type": "object", "description": "ESG-scorer til krydsvalidering"},
            },
            "required": ["report_sections"],
        },
    },
    {
        "name": "benchmark_vs_peers",
        "description": (
            "Sammenligner virksomhedens ESG-score og CO2-aftryk med branchegennemsnittet "
            "for SMV'er i Danmark. Returnerer percentilplacering og nøgleforskelle."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "industry_code":      {"type": "string"},
                "esg_score_total":    {"type": "number"},
                "total_co2e_tonnes":  {"type": "number"},
                "employee_count":     {"type": "integer"},
            },
            "required": ["industry_code", "esg_score_total"],
        },
    },
    {
        "name": "research_company",
        "description": (
            "Slår en dansk virksomhed op via CVR-nummer og henter grundlæggende offentlige oplysninger: "
            "navn, branche, medarbejderantal og adresse."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "cvr": {"type": "string", "description": "8-cifret CVR-nummer"}
            },
            "required": ["cvr"],
        },
    },
]

# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class AgentOrchestrator:
    """
    Master orchestrator: Claude with tool use routes to specialist agents.
    Each specialist agent is imported lazily to avoid circular imports.
    """

    def __init__(self) -> None:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Run the orchestration loop.

        inputs:
          user_message: str    — the user's question or request in Danish
          context: dict        — optional background data (company, submission, report)
          history: list        — optional prior conversation turns [{role, content}]
        """
        user_message: str   = inputs.get("user_message", "")
        context: dict       = inputs.get("context", {})
        history: list       = inputs.get("history", [])

        system_prompt = self._build_system(context)
        messages = list(history) + [{"role": "user", "content": user_message}]

        trace: list[dict] = []
        MAX_TURNS = 8

        for _turn in range(MAX_TURNS):
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=4096,
                temperature=0.2,
                system=system_prompt,
                tools=_TOOLS,  # type: ignore[arg-type]
                messages=messages,
            )

            # Append assistant response to message history
            messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "end_turn":
                # Extract final text answer
                answer = next(
                    (block.text for block in response.content if hasattr(block, "text")),
                    ""
                )
                return {"answer": answer, "trace": trace, "ok": True}

            if response.stop_reason == "tool_use":
                # Process all tool calls in this turn
                tool_results = []
                for block in response.content:
                    if block.type != "tool_use":
                        continue
                    tool_name: str = block.name
                    tool_input: dict = block.input  # type: ignore[assignment]
                    tool_use_id: str = block.id

                    logger.info("Orchestrator → calling tool: %s", tool_name)
                    agent_result = await self._dispatch(tool_name, tool_input)
                    trace.append({"tool": tool_name, "input": tool_input, "output": agent_result})

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": json.dumps(agent_result, ensure_ascii=False, default=str),
                    })

                messages.append({"role": "user", "content": tool_results})
            else:
                # Unexpected stop reason
                break

        # Fallback if we hit max turns
        last_text = ""
        if messages and messages[-1]["role"] == "assistant":
            content = messages[-1]["content"]
            if isinstance(content, list):
                last_text = next((b.text for b in content if hasattr(b, "text")), "")
            elif isinstance(content, str):
                last_text = content
        return {"answer": last_text or "Beklager, kunne ikke fuldføre analysen.", "trace": trace, "ok": True}

    # ------------------------------------------------------------------
    # Tool dispatch
    # ------------------------------------------------------------------

    async def _dispatch(self, tool_name: str, tool_input: dict) -> dict:
        """Route a tool call to the correct specialist agent."""
        # Lazy imports to avoid circular dependencies
        if tool_name == "check_vsme_compliance":
            from .vsme_compliance import VSMEComplianceAgent
            return await VSMEComplianceAgent().safe_run(tool_input)

        elif tool_name == "assess_climate_risks":
            from .climate_risk import ClimateRiskAgent
            return await ClimateRiskAgent().safe_run(tool_input)

        elif tool_name == "generate_improvement_actions":
            from .improvement import ImprovementAgent
            return await ImprovementAgent().safe_run(tool_input)

        elif tool_name == "build_roadmap":
            from .roadmap import RoadmapAgent
            return await RoadmapAgent().safe_run(tool_input)

        elif tool_name == "validate_report_quality":
            from .qa_validator import QAValidatorAgent
            return await QAValidatorAgent().safe_run(tool_input)

        elif tool_name == "benchmark_vs_peers":
            from .benchmark import BenchmarkAgent
            return await BenchmarkAgent().safe_run(tool_input)

        elif tool_name == "research_company":
            from .company_researcher import CompanyResearcherAgent
            return await CompanyResearcherAgent().safe_run(tool_input)

        else:
            return {"ok": False, "error": f"Unknown tool: {tool_name}"}

    # ------------------------------------------------------------------
    # System prompt
    # ------------------------------------------------------------------

    @staticmethod
    def _build_system(context: dict) -> str:
        company_name = context.get("company_name", "virksomheden")
        lines = [
            "Du er ESG Copilot Orchestrator — en intelligent dansk ESG-rådgiver for SMV'er.",
            "Du hjælper virksomheder med VSME Basic Modul (EFRAG 2024) rapportering og bæredygtighedsstrategi.",
            "",
            "REGLER:",
            "1. Svar ALTID på dansk, professionelt og konkret.",
            "2. Brug de tilgængelige værktøjer til at hente præcise data, inden du svarer.",
            "3. Opfind aldrig tal — brug kun data fra værktøjsresultater eller den medfølgende kontekst.",
            "4. Hold svar fokuserede og handlingsorienterede.",
            "5. Afslut altid med et klart næste skridt eller en anbefaling.",
        ]
        if company_name != "virksomheden":
            lines.append(f"\nDu arbejder aktuelt med: {company_name}")

        # Inject key context fields
        if context.get("esg_score_total"):
            lines.append(f"Seneste ESG-score: {context['esg_score_total']}/100 ({context.get('esg_rating', '?')})")
        if context.get("total_co2e_tonnes"):
            lines.append(f"Seneste CO2-aftryk: {context['total_co2e_tonnes']:.1f} tCO2e/år")
        if context.get("industry_code"):
            lines.append(f"Branche: {context['industry_code']}")

        return "\n".join(lines)
