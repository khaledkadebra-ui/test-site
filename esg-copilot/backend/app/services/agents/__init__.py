"""
ESG Copilot — Multi-Agent System
=================================
Hierarchical agent architecture where an Orchestrator uses Anthropic tool use
to coordinate 13 specialist agents. Each agent is a focused Python class that
handles one concern deterministically + LLM narration where needed.

Agent roster:
  1.  CompanyResearcherAgent    — CVR lookup + website headline extraction
  2.  MaterialityAssessorAgent  — VSME datapoint classification
  3.  DataExtractionAgent       — Document/invoice vision parsing
  4.  GHGCalculatorAgent        — CO2 calculation wrapper + anomaly flags
  5.  VSMEComplianceAgent       — Missing-field checklist against VSME Basic
  6.  ClimateRiskAgent          — Physical + transition risk assessment
  7.  ImprovementAgent          — SMART action recommendations
  8.  RoadmapAgent              — Q1–Q4 implementation timeline
  9.  ReportWriterAgent         — Full narrative VSME report generation
  10. QAValidatorAgent          — Consistency + hallucination check
  11. BenchmarkAgent            — Industry-peer CO2 + score comparison
  12. SustainabilityCoachAgent  — Conversational Danish ESG advisor
  13. SupportAgent              — FAQ + concept explainer

Orchestrator: AgentOrchestrator uses Anthropic tool use to decide which agents
to invoke and in what order based on user intent.
"""

from .orchestrator import AgentOrchestrator
from .company_researcher import CompanyResearcherAgent
from .vsme_compliance import VSMEComplianceAgent
from .climate_risk import ClimateRiskAgent
from .improvement import ImprovementAgent
from .roadmap import RoadmapAgent
from .qa_validator import QAValidatorAgent
from .benchmark import BenchmarkAgent
from .sustainability_coach import SustainabilityCoachAgent

__all__ = [
    "AgentOrchestrator",
    "CompanyResearcherAgent",
    "VSMEComplianceAgent",
    "ClimateRiskAgent",
    "ImprovementAgent",
    "RoadmapAgent",
    "QAValidatorAgent",
    "BenchmarkAgent",
    "SustainabilityCoachAgent",
]
