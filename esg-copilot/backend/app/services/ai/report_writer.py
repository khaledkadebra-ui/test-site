"""
AI Report Writer — ESG Copilot
================================
Generates narrative text sections for the ESG report.

CRITICAL RULES (enforced in every system prompt):
1. All numbers must come from the calculation engine — never invented by AI.
2. Never claim CSRD compliance or certification.
3. Always include the AI-generated draft disclaimer.
4. Write factually; avoid marketing language.
"""

from .llm_client import LLMClient
from ..esg_engine.calculator import CalculationReport
from ..esg_engine.scorer import ESGScore
from ..esg_engine.gap_analyzer import GapReport

_SYSTEM_PROMPT = """You are an expert ESG analyst writing a professional sustainability screening \
report for a small or medium-sized business.

MANDATORY RULES — violation is not acceptable:
1. Use ONLY the exact figures provided in the user message. Never round, estimate, or invent numbers.
2. Never state or imply that this report constitutes CSRD compliance, regulatory assurance, or \
independent verification.
3. Always end every section with this disclaimer on a new line:
   "⚠ This report is an AI-generated draft. Figures are based on data provided by the company \
and have not been independently verified."
4. Write in a professional, factual tone. Avoid superlatives and marketing language.
5. Be specific: reference actual figures and identified gaps, not generic ESG advice.
6. Acknowledge data limitations where inputs were estimated or not provided.
"""


class ReportWriter:
    """Generates all narrative sections of the ESG report using the LLM."""

    def __init__(self):
        self.llm = LLMClient()

    async def write_executive_summary(
        self,
        company_name: str,
        reporting_year: int,
        calc: CalculationReport,
        score: ESGScore,
        gaps: GapReport,
    ) -> str:
        prompt = f"""Write an executive summary for the ESG screening report of **{company_name}** \
for the reporting year **{reporting_year}**.

=== CALCULATED DATA (use exact figures) ===
GHG Emissions:
  Scope 1:  {calc.scope1_tonnes:.1f} tCO2e
  Scope 2:  {calc.scope2_tonnes:.1f} tCO2e
  Scope 3:  {calc.scope3_tonnes:.1f} tCO2e
  TOTAL:    {calc.total_tonnes:.1f} tCO2e

ESG Score:  {score.total}/100  (Rating: {score.rating})
  Environmental: {score.environmental.score:.1f}/100  ({score.environmental.rating})
  Social:        {score.social.score:.1f}/100  ({score.social.rating})
  Governance:    {score.governance.score:.1f}/100  ({score.governance.rating})

Industry Percentile: {score.industry_percentile}th percentile

Gaps Identified: {gaps.total_gaps} total ({gaps.high_priority_count} high-priority)
Quick Wins Available: {len(gaps.quick_wins)} low-effort, high-impact actions
Potential Score Improvement: +{gaps.total_potential_score_gain:.0f} points with recommended actions

=== FORMAT ===
Write exactly 4 paragraphs (350–420 words total):
1. Company overview and scope of this report
2. GHG emissions performance and key drivers
3. ESG score highlights — what's strong, what needs work
4. Top 3 recommended next steps

End with the mandatory disclaimer."""

        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=600)

    async def write_co2_narrative(
        self,
        company_name: str,
        reporting_year: int,
        calc: CalculationReport,
        industry_code: str,
    ) -> str:
        def _format_breakdown(bd: dict) -> str:
            if not bd:
                return "  No data provided."
            return "\n".join(
                f"  {k}: {v['kg_co2e'] / 1000:.2f} tCO2e "
                f"(factor: {v['factor_value']} {v['factor_unit']}, source: {v['source_citation']})"
                for k, v in bd.items()
            )

        prompt = f"""Write the GHG Emissions Analysis section for **{company_name}** ({reporting_year}).

=== CALCULATED EMISSIONS ===
SCOPE 1 — {calc.scope1_tonnes:.1f} tCO2e (direct emissions):
{_format_breakdown(calc.scope1_breakdown)}

SCOPE 2 — {calc.scope2_tonnes:.1f} tCO2e (purchased energy):
{_format_breakdown(calc.scope2_breakdown)}

SCOPE 3 — {calc.scope3_tonnes:.1f} tCO2e (value chain, estimated):
{_format_breakdown(calc.scope3_breakdown)}

TOTAL: {calc.total_tonnes:.1f} tCO2e

Data quality warnings: {'; '.join(calc.warnings) if calc.warnings else 'None'}

Industry: {industry_code}

=== FORMAT ===
Write 3 paragraphs (280–350 words total):
1. Methodology note — GHG Protocol scopes, emission factor sources (cite IPCC/DEFRA/IEA by name), \
location-based Scope 2 method used
2. Breakdown analysis — biggest sources, scope proportions, what drives the footprint
3. Data limitations — what was estimated, what was not provided, uncertainty in Scope 3

End with the mandatory disclaimer."""

        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=500)

    async def write_esg_narrative(
        self,
        company_name: str,
        score: ESGScore,
    ) -> str:
        e_gaps = "; ".join(score.environmental.gaps) or "None identified"
        s_gaps = "; ".join(score.social.gaps) or "None identified"
        g_gaps = "; ".join(score.governance.gaps) or "None identified"

        prompt = f"""Write the ESG Score Analysis section for **{company_name}**.

=== ESG SCORES ===
Overall Score: {score.total}/100 (Rating: {score.rating})
Industry Percentile: {score.industry_percentile}th

Environmental ({score.environmental.rating}): {score.environmental.score:.1f}/100
  Gaps: {e_gaps}

Social ({score.social.rating}): {score.social.score:.1f}/100
  Gaps: {s_gaps}

Governance ({score.governance.rating}): {score.governance.score:.1f}/100
  Gaps: {g_gaps}

=== FORMAT ===
Write 3 paragraphs (250–320 words total):
1. Overall score interpretation and industry context
2. Environmental performance — strengths and gaps
3. Social and Governance performance — strengths and key gaps to address

Be specific about each gap. Do not pad with generic ESG definitions.
End with the mandatory disclaimer."""

        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=500)

    async def write_roadmap_narrative(
        self,
        company_name: str,
        score: ESGScore,
        gaps: GapReport,
    ) -> str:
        def _quarter_titles(q: str) -> list[str]:
            return [a.title for a in gaps.roadmap_by_quarter.get(q, [])]

        projected_score = min(score.total + gaps.total_potential_score_gain, 100.0)

        prompt = f"""Write the 12-Month ESG Improvement Roadmap for **{company_name}**.

=== CURRENT STATE ===
ESG Score: {score.total}/100 (Rating: {score.rating})
Projected Score (all actions complete): ~{projected_score:.0f}/100

=== RECOMMENDED ACTIONS BY QUARTER ===
Q1 (Months 1–3 — Foundation): {', '.join(_quarter_titles('Q1')) or 'No actions'}
Q2 (Months 4–6 — Structure): {', '.join(_quarter_titles('Q2')) or 'No actions'}
Q3 (Months 7–9 — Deepen): {', '.join(_quarter_titles('Q3')) or 'No actions'}
Q4 (Months 10–12 — Verify): {', '.join(_quarter_titles('Q4')) or 'No actions'}

QUICK WINS (low effort, high impact):
{', '.join(a.title for a in gaps.quick_wins) or 'None identified'}

=== FORMAT ===
Write 5 paragraphs (420–500 words total):
1. Q1 — Focus and rationale (why these actions first)
2. Q2 — Building on Q1 foundations
3. Q3 — Deepening commitments
4. Q4 — Measurement and verification
5. CSRD Readiness — what this roadmap achieves toward future CSRD obligations \
(note: this report is NOT CSRD certification)

Be practical and specific. Name the actual actions.
End with the mandatory disclaimer."""

        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=700)
