"""
AI-rapportskriver — ESG Copilot (VSME Basic Modul)
Genererer narrative tekstafsnit til VSME-rapporten på dansk.
"""

from .llm_client import LLMClient
from ..esg_engine.calculator import CalculationReport
from ..esg_engine.scorer import ESGScore
from ..esg_engine.gap_analyzer import GapReport

_SYSTEM_PROMPT = (
    "Du er en erfaren ESG-analytiker, der skriver en professionel bæredygtighedsrapport "
    "på dansk for en lille eller mellemstor virksomhed i henhold til VSME Basic Modul (EFRAG, 2024).\n\n"
    "OBLIGATORISKE REGLER:\n"
    "1. Brug KUN de præcise tal fra brugerens besked. Afrund ikke, estimer ikke og opfind ikke tal.\n"
    "2. Angiv aldrig, at rapporten udgør CSRD-overholdelse eller uafhængig verifikation.\n"
    "3. Afslut hvert afsnit med: "
    '"⚠ Denne rapport er et AI-genereret udkast. Tallene er baseret på data indberettet '
    'af virksomheden og er ikke uafhængigt verificeret."\n'
    "4. Skriv i en professionel, faktabaseret tone. Undgå superlativer og markedsføringssprog.\n"
    "5. Vær konkret: henvis til faktiske tal og identificerede mangler.\n"
    "6. Skriv udelukkende på dansk.\n"
)

_LABELS = {
    "natural_gas": "Naturgas", "diesel": "Diesel", "petrol": "Benzin",
    "lpg": "Flaskegas (LPG)", "heating_oil": "Fyringsolie", "coal": "Kul",
    "biomass_wood_chips": "Biomasse", "company_car": "Firmabiler",
    "company_van": "Varevogne", "company_truck": "Lastbiler",
    "electricity": "El (net)", "district_heating": "Fjernvarme",
    "air_short_haul": "Kortdistancefly", "air_long_haul_economy": "Langdistancefly (economy)",
    "air_long_haul_business": "Langdistancefly (business)", "rail": "Tog",
    "rental_car": "Lejebil", "taxi": "Taxa",
    "employee_commuting": "Medarbejderpendling",
    "purchased_goods": "Indkøbte varer og tjenester",
}


def _fmt_breakdown(bd: dict) -> str:
    if not bd:
        return "  Ingen data indberettet."
    lines = []
    for k, v in bd.items():
        label = _LABELS.get(k, k)
        lines.append(
            f"  {label}: {v['kg_co2e'] / 1000:.2f} tCO2e "
            f"(faktor: {v['factor_value']} {v['factor_unit']})"
        )
    return "\n".join(lines)


class ReportWriter:
    """Genererer alle narrative afsnit af VSME-rapporten ved hjælp af LLM."""

    def __init__(self):
        self.llm = LLMClient()

    async def write_executive_summary(
        self,
        company_name: str,
        reporting_year: int,
        calc: CalculationReport,
        score: ESGScore,
        gaps: GapReport,
        revenue_dkk: float = 0,
        employee_count: int = 0,
    ) -> str:
        ghg_intensity = ""
        if revenue_dkk and revenue_dkk > 0:
            intensity = calc.total_tonnes / (revenue_dkk / 1_000_000)
            ghg_intensity = f"GHG-intensitet: {intensity:.2f} tCO2e pr. mio. DKK omsætning\n"

        prompt = (
            f"Skriv et sammendrag (ledelsesoversigt) til VSME-bæredygtighedsrapporten "
            f"for **{company_name}** for rapporteringsåret **{reporting_year}**.\n\n"
            f"=== BEREGNET DATA ===\n"
            f"Drivhusgasemissioner (B3):\n"
            f"  Scope 1: {calc.scope1_tonnes:.1f} tCO2e (direkte emissioner)\n"
            f"  Scope 2: {calc.scope2_tonnes:.1f} tCO2e (indkøbt energi)\n"
            f"  Scope 3: {calc.scope3_tonnes:.1f} tCO2e (værdikæde, estimeret)\n"
            f"  I ALT:   {calc.total_tonnes:.1f} tCO2e\n"
            f"{ghg_intensity}\n"
            f"ESG-score: {score.total}/100 (Vurdering: {score.rating})\n"
            f"  Miljø (E):     {score.environmental.score:.1f}/100 ({score.environmental.rating})\n"
            f"  Sociale (S):   {score.social.score:.1f}/100 ({score.social.rating})\n"
            f"  Lederskab (G): {score.governance.score:.1f}/100 ({score.governance.rating})\n\n"
            f"Branchepercentil: {score.industry_percentile}. percentil\n"
            f"Identificerede mangler: {gaps.total_gaps} i alt ({gaps.high_priority_count} højprioriterede)\n"
            f"Potentiel score-forbedring: +{gaps.total_potential_score_gain:.0f} point\n\n"
            f"=== FORMAT ===\n"
            f"Skriv præcis 4 afsnit (350-420 ord):\n"
            f"1. Virksomhedsoverview og rapportens omfang (VSME B1)\n"
            f"2. Klimaaftryk og drivhusgasemissioner\n"
            f"3. ESG-score — styrker og forbedringsområder\n"
            f"4. De 3 vigtigste næste skridt\n\n"
            f"Afslut med den obligatoriske ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=700)

    async def write_co2_narrative(
        self,
        company_name: str,
        reporting_year: int,
        calc: CalculationReport,
        industry_code: str,
        country_code: str = "DK",
        revenue_dkk: float = 0,
        employee_count: int = 0,
    ) -> str:
        ghg_txt = ""
        if revenue_dkk and revenue_dkk > 0:
            ghg_txt = f"\nGHG-intensitet: {calc.total_tonnes / (revenue_dkk / 1_000_000):.2f} tCO2e pr. mio. DKK"

        warnings_txt = "; ".join(calc.warnings) if calc.warnings else "Ingen"

        prompt = (
            f"Skriv afsnittet 'B3 — Energi og drivhusgasemissioner' for **{company_name}** ({reporting_year}).\n\n"
            f"SCOPE 1 — {calc.scope1_tonnes:.1f} tCO2e:\n{_fmt_breakdown(calc.scope1_breakdown)}\n\n"
            f"SCOPE 2 — {calc.scope2_tonnes:.1f} tCO2e:\n{_fmt_breakdown(calc.scope2_breakdown)}\n\n"
            f"SCOPE 3 — {calc.scope3_tonnes:.1f} tCO2e:\n{_fmt_breakdown(calc.scope3_breakdown)}\n\n"
            f"I ALT: {calc.total_tonnes:.1f} tCO2e{ghg_txt}\n"
            f"Advarsler: {warnings_txt}\n"
            f"Branche: {industry_code} | Land: {country_code}\n\n"
            f"Skriv 3 afsnit (280-350 ord):\n"
            f"1. Metode (GHG-protokol, Energistyrelsen 2024 for el, DEFRA 2024 for brændstoffer, VSME B3)\n"
            f"2. Emissionsanalyse — vigtigste kilder og scope-fordeling i procent\n"
            f"3. Databegrænsninger og usikkerhed i Scope 3\n\n"
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=550)

    async def write_esg_narrative(
        self,
        company_name: str,
        score: ESGScore,
        workforce_data: dict | None = None,
    ) -> str:
        wf = ""
        if workforce_data:
            t = workforce_data.get("employees_total", 0)
            if t:
                wf = (
                    f"\nMedarbejdere (B8-B10): {t} ansatte "
                    f"({workforce_data.get('employees_male', 0)} mænd, "
                    f"{workforce_data.get('employees_female', 0)} kvinder), "
                    f"{workforce_data.get('accident_count', 0)} ulykker, "
                    f"{workforce_data.get('training_hours_total', 0)} uddannelsestimer"
                )

        e_gaps = "; ".join(score.environmental.gaps) or "Ingen identificeret"
        s_gaps = "; ".join(score.social.gaps) or "Ingen identificeret"
        g_gaps = "; ".join(score.governance.gaps) or "Ingen identificeret"

        prompt = (
            f"Skriv ESG-scoreafsnittet for **{company_name}**.\n\n"
            f"Score: {score.total}/100 ({score.rating}) | Percentil: {score.industry_percentile}.{wf}\n"
            f"Miljø (E) {score.environmental.rating}: {score.environmental.score:.1f}/100 — Mangler: {e_gaps}\n"
            f"Sociale (S) {score.social.rating}: {score.social.score:.1f}/100 — Mangler: {s_gaps}\n"
            f"Lederskab (G) {score.governance.rating}: {score.governance.score:.1f}/100 — Mangler: {g_gaps}\n\n"
            f"Skriv 3 afsnit (250-320 ord):\n"
            f"1. Score-fortolkning og branchekontekst\n"
            f"2. Miljøpræstation — styrker og mangler konkret beskrevet\n"
            f"3. Sociale og ledelsesmæssige forhold (B8-B11)\n\n"
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=550)

    async def write_improvements(
        self,
        company_name: str,
        score: ESGScore,
        gaps: GapReport,
        calc: CalculationReport,
    ) -> str:
        """Foreslåede tiltag og forbedringer med SMART-mål."""
        lines = [
            f"- [{a.category}] {a.title} "
            f"(prioritet: {a.priority}, {a.timeline}, +{a.score_improvement_pts:.0f}pt, "
            f"{a.estimated_co2_reduction_pct:.0f}% CO2)"
            for a in gaps.actions[:6]
        ]
        qw = [a.title for a in gaps.quick_wins]
        proj = min(score.total + gaps.total_potential_score_gain, 100)

        prompt = (
            f"Skriv afsnittet 'Foreslåede tiltag og forbedringer' for **{company_name}**.\n\n"
            f"Nuværende ESG-score: {score.total}/100 ({score.rating}) | Emissioner: {calc.total_tonnes:.1f} tCO2e\n"
            f"Potentiel score: ~{proj:.0f}/100\n\n"
            f"ANBEFALEDE TILTAG:\n" + "\n".join(lines) + "\n\n"
            f"Hurtige gevinster: {', '.join(qw) if qw else 'Ingen'}\n\n"
            f"Skriv struktureret med 500-600 ord:\n\n"
            f"**Klimatiltag med SMART-mål:**\n"
            f"For de 2 vigtigste miljøtiltag — hvert med:\n"
            f"- SMART-mål (Specifikt, Målbart, Opnåeligt, Relevant, Tidsbestemt)\n"
            f"- 3-4 konkrete handlingstrin\n"
            f"- Forventet CO2-reduktion og tidsplan\n\n"
            f"**Sociale forbedringer:**\n"
            f"- SMART-mål + handlingstrin + KPI'er\n\n"
            f"**Ledelsesmæssige forbedringer:**\n"
            f"- SMART-mål + handlingstrin + KPI'er\n\n"
            f"**Hurtige gevinster (inden for 30 dage):**\n"
            f"- Konkrete handlinger og forventet effekt\n\n"
            f"**12-måneders handlingsplan:**\n"
            f"- Kvartal 1, 2, 3, 4: specifikke handlinger\n\n"
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=900)

    async def write_roadmap_narrative(
        self,
        company_name: str,
        score: ESGScore,
        gaps: GapReport,
    ) -> str:
        def qt(q: str) -> list:
            return [a.title for a in gaps.roadmap_by_quarter.get(q, [])]

        proj = min(score.total + gaps.total_potential_score_gain, 100.0)

        prompt = (
            f"Skriv '12-måneders ESG-forbedringsplan' for **{company_name}**.\n\n"
            f"Score: {score.total}/100 ({score.rating}) → projiceret: ~{proj:.0f}/100\n"
            f"Kvartal 1: {', '.join(qt('Q1')) or 'Ingen'}\n"
            f"Kvartal 2: {', '.join(qt('Q2')) or 'Ingen'}\n"
            f"Kvartal 3: {', '.join(qt('Q3')) or 'Ingen'}\n"
            f"Kvartal 4: {', '.join(qt('Q4')) or 'Ingen'}\n"
            f"Hurtige gevinster: {', '.join(a.title for a in gaps.quick_wins) or 'Ingen'}\n\n"
            f"Skriv 5 afsnit (400-480 ord):\n"
            f"1. Kvartal 1 — fokus og begrundelse\n"
            f"2. Kvartal 2 — bygger videre på Q1\n"
            f"3. Kvartal 3 — uddybning\n"
            f"4. Kvartal 4 — måling og verifikation\n"
            f"5. Fremtidsperspektiv\n\n"
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=700)
