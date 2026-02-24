"""
Gap Analyzer & 12-Month Roadmap Generator — ESG Copilot
=========================================================
Takes ESGScore and produces a prioritized action roadmap.
Actions are deterministic — no LLM involved.
The LLM receives this structured output to generate narrative roadmap text.
"""

from dataclasses import dataclass, field
from typing import List
from .scorer import ESGScore


@dataclass
class Action:
    id: str
    priority: str        # "high" | "medium" | "low"
    category: str        # "E" | "S" | "G"
    title: str
    description: str
    effort: str          # "low" | "medium" | "high"
    timeline: str        # "Q1" | "Q2" | "Q3" | "Q4"
    kpis: List[str]
    estimated_co2_reduction_pct: float = 0.0
    score_improvement_pts: float = 0.0

    def to_dict(self) -> dict:
        return self.__dict__


@dataclass
class GapReport:
    total_gaps: int
    high_priority_count: int
    actions: List[Action]
    quick_wins: List[Action]          # low effort + high priority
    roadmap_by_quarter: dict          # {"Q1": [...], "Q2": [...], ...}
    total_potential_score_gain: float

    def to_dict(self) -> dict:
        return {
            "total_gaps": self.total_gaps,
            "high_priority_count": self.high_priority_count,
            "actions": [a.to_dict() for a in self.actions],
            "quick_wins": [a.to_dict() for a in self.quick_wins],
            "roadmap_by_quarter": {
                q: [a.to_dict() for a in acts]
                for q, acts in self.roadmap_by_quarter.items()
            },
            "total_potential_score_gain": self.total_potential_score_gain,
        }


# ─────────────────────────────────────────────────────────────────────────────
# ACTION LIBRARY — every possible recommended action
# ─────────────────────────────────────────────────────────────────────────────

_ACTIONS: List[Action] = [
    # ── ENVIRONMENTAL ──────────────────────────────────────────────────────
    Action(
        id="E001", priority="high", category="E",
        title="Switch to 100% renewable electricity tariff",
        description="Contract a certified renewable electricity tariff (Guarantees of Origin / RECs). No infrastructure required — fastest way to reduce Scope 2 emissions.",
        effort="low", timeline="Q1",
        kpis=["Renewable electricity %", "Scope 2 CO2e tonnes"],
        estimated_co2_reduction_pct=12.0, score_improvement_pts=12.0,
    ),
    Action(
        id="E002", priority="high", category="E",
        title="Set a science-based GHG reduction target",
        description="Commit to a measurable reduction target aligned with a 1.5°C pathway. Register with SBTi or document an internally validated target with a base year.",
        effort="medium", timeline="Q2",
        kpis=["Target reduction % vs base year", "Target year", "Baseline tCO2e"],
        score_improvement_pts=15.0,
    ),
    Action(
        id="E003", priority="medium", category="E",
        title="Commission an energy efficiency audit",
        description="Engage an accredited energy auditor (required under EU Energy Efficiency Directive for large companies). Typically reveals 10–25% energy savings opportunities.",
        effort="medium", timeline="Q1",
        kpis=["Energy intensity kWh/€M revenue", "Savings identified kWh/year"],
        estimated_co2_reduction_pct=8.0,
    ),
    Action(
        id="E004", priority="high", category="E",
        title="Document a waste management policy",
        description="Identify and document waste streams, set recycling targets, assign responsibility. Required by most ESG frameworks and CSRD ESRS E5.",
        effort="low", timeline="Q1",
        kpis=["Waste recycled %", "Total waste generated kg"],
        score_improvement_pts=5.0,
    ),
    Action(
        id="E005", priority="medium", category="E",
        title="Implement a business travel policy (virtual-first)",
        description="Mandate video calls as default and require approval for air travel. Set an annual CO2 budget per employee for travel.",
        effort="low", timeline="Q1",
        kpis=["Air travel km per employee", "Travel Scope 3 tCO2e"],
        estimated_co2_reduction_pct=5.0,
    ),
    Action(
        id="E006", priority="low", category="E",
        title="Assess on-site renewable energy (solar PV)",
        description="Get a feasibility assessment for rooftop solar. Reduces Scope 2 and energy costs over the long term.",
        effort="high", timeline="Q4",
        kpis=["On-site renewable generation kWh", "Payback period years"],
        estimated_co2_reduction_pct=6.0,
    ),
    Action(
        id="E007", priority="medium", category="E",
        title="Introduce a water use policy",
        description="Document water consumption, set a reduction target, and implement basic water efficiency measures. Required for CSRD ESRS E3.",
        effort="low", timeline="Q2",
        kpis=["Water consumption m³/year", "Water intensity m³/€M revenue"],
        score_improvement_pts=3.0,
    ),

    # ── SOCIAL ─────────────────────────────────────────────────────────────
    Action(
        id="S001", priority="high", category="S",
        title="Implement a formal Health & Safety policy",
        description="Document H&S procedures, conduct workplace risk assessments, establish incident reporting. Required under EU OSH Framework Directive and CSRD ESRS S1.",
        effort="medium", timeline="Q1",
        kpis=["Lost time injury rate (LTIR)", "Near-miss reports", "H&S training hours"],
        score_improvement_pts=20.0,
    ),
    Action(
        id="S002", priority="high", category="S",
        title="Launch a structured employee training programme",
        description="Implement onboarding, role-specific training, and annual professional development. Target minimum 20 hours per employee per year.",
        effort="medium", timeline="Q2",
        kpis=["Avg training hours per employee/year", "Employee satisfaction score"],
        score_improvement_pts=12.0,
    ),
    Action(
        id="S003", priority="medium", category="S",
        title="Adopt a Diversity & Inclusion policy",
        description="Write and publish a D&I policy, set gender representation targets for management (minimum 30% target), and track progress annually.",
        effort="low", timeline="Q2",
        kpis=["Female management %", "D&I policy in place", "Pay gap analysis"],
        score_improvement_pts=15.0,
    ),
    Action(
        id="S004", priority="medium", category="S",
        title="Conduct a living wage assessment",
        description="Benchmark all roles against the local living wage. Document and commit to paying above minimum living wage thresholds.",
        effort="medium", timeline="Q3",
        kpis=["% employees paid at/above living wage"],
        score_improvement_pts=8.0,
    ),

    # ── GOVERNANCE ─────────────────────────────────────────────────────────
    Action(
        id="G001", priority="high", category="G",
        title="Publish a formal ESG policy",
        description="Document the company's ESG commitments, governance structure, targets, and reporting approach. Foundation for all ESG frameworks.",
        effort="low", timeline="Q1",
        kpis=["ESG policy published", "Policy approved by board"],
        score_improvement_pts=15.0,
    ),
    Action(
        id="G002", priority="high", category="G",
        title="Adopt a Code of Conduct",
        description="Develop a company-wide Code of Conduct covering ethics, conflicts of interest, anti-corruption, and business conduct. Required for CSRD ESRS G1.",
        effort="low", timeline="Q1",
        kpis=["Code of conduct published", "Employee sign-off %"],
        score_improvement_pts=10.0,
    ),
    Action(
        id="G003", priority="high", category="G",
        title="Implement a GDPR-compliant data privacy policy",
        description="Audit all data processing activities, complete a Record of Processing Activities (ROPA), and publish a GDPR-compliant privacy policy.",
        effort="medium", timeline="Q1",
        kpis=["Privacy policy published", "ROPA completed", "DPIA for high-risk processing"],
        score_improvement_pts=30.0,
    ),
    Action(
        id="G004", priority="medium", category="G",
        title="Assign board-level ESG responsibility",
        description="Name a board sponsor for ESG. Include ESG performance on board meeting agendas at least twice per year.",
        effort="low", timeline="Q2",
        kpis=["ESG board sponsor named", "ESG board agenda items per year"],
        score_improvement_pts=5.0,
    ),
    Action(
        id="G005", priority="medium", category="G",
        title="Implement a supplier code of conduct",
        description="Create a supplier CoC covering environmental requirements, labour standards, and anti-corruption. Required for CSRD supply chain due diligence.",
        effort="medium", timeline="Q3",
        kpis=["Suppliers signed CoC %", "Supplier ESG questionnaires completed"],
        score_improvement_pts=10.0,
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

class GapAnalyzer:
    """
    Produces a prioritized 12-month action roadmap from ESGScore gaps.
    """

    def analyze(self, score: ESGScore) -> GapReport:
        all_gaps = (
            score.environmental.gaps
            + score.social.gaps
            + score.governance.gaps
        )

        applicable = self._select_actions(score)

        # Sort: priority (high first) then score improvement (desc)
        _order = {"high": 0, "medium": 1, "low": 2}
        applicable.sort(
            key=lambda a: (_order[a.priority], -a.score_improvement_pts)
        )

        quick_wins = [
            a for a in applicable
            if a.effort == "low" and a.priority == "high"
        ]

        roadmap: dict = {"Q1": [], "Q2": [], "Q3": [], "Q4": []}
        for action in applicable:
            roadmap[action.timeline].append(action)

        total_gain = sum(a.score_improvement_pts for a in applicable)
        capped_gain = round(min(total_gain, 100.0 - score.total), 1)

        return GapReport(
            total_gaps=len(all_gaps),
            high_priority_count=sum(1 for a in applicable if a.priority == "high"),
            actions=applicable,
            quick_wins=quick_wins,
            roadmap_by_quarter=roadmap,
            total_potential_score_gain=capped_gain,
        )

    def _select_actions(self, score: ESGScore) -> List[Action]:
        """Include actions where the relevant category is below 75 or priority is high."""
        selected = []
        for action in _ACTIONS:
            include = False
            if action.category == "E" and score.environmental.score < 75:
                include = True
            if action.category == "S" and score.social.score < 75:
                include = True
            if action.category == "G" and score.governance.score < 75:
                include = True
            if action.priority == "high":
                include = True  # Always show high-priority actions

            if include and action not in selected:
                selected.append(action)

        return selected
