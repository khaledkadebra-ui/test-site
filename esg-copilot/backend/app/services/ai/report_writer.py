"""
AI-rapportskriver — ESG Copilot (VSME Basic Modul)
Genererer narrative tekstafsnit til VSME-rapporten på dansk.

Alle afsnit følger VSME Basic Module (EFRAG 2024) strukturen:
  B1  — Generelle oplysninger og ledelsesoversigt
  B3  — Energi og drivhusgasemissioner
  B4  — Forurening og vand
  B8–B10 — Medarbejderforhold
  B11 — Governance og politikker
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
    "5. Vær konkret: henvis til faktiske tal, procenter og identificerede mangler.\n"
    "6. Skriv udelukkende på dansk.\n"
    "7. Brug overskrifter (##) til hvert underafsnit for bedre læsbarhed.\n"
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
            f"(faktor: {v['factor_value']} {v['factor_unit']}, kilde: {v.get('factor_source', 'DEFRA 2024')})"
        )
    return "\n".join(lines)


def _fmt_policy(policy_data: dict) -> str:
    if not policy_data:
        return "  Ingen politikdata indberettet."
    items = []
    labels = {
        "has_anti_bribery_policy": "Anti-bestikkelsespolitik",
        "has_data_protection_policy": "Databeskyttelsespolitik (GDPR)",
        "has_whistleblower_policy": "Whistleblower-ordning",
        "has_environmental_policy": "Miljøpolitik",
        "has_human_rights_policy": "Menneskerettighedspolitik",
        "has_supplier_code_of_conduct": "Leverandøradfærdskodeks",
        "net_zero_target_year": "Netto-nul målår",
        "science_based_target": "SBTi-klimamål",
        "has_health_safety_policy": "Arbejdsmiljøpolitik",
    }
    for k, label in labels.items():
        v = policy_data.get(k)
        if v is not None:
            if isinstance(v, bool):
                items.append(f"  {label}: {'Ja ✓' if v else 'Nej ✗'}")
            elif isinstance(v, int) and v > 2000:
                items.append(f"  {label}: {v}")
            elif v:
                items.append(f"  {label}: {v}")
    return "\n".join(items) if items else "  Ingen politikdata."


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
        industry_code: str = "",
        country_code: str = "DK",
        policy_data: dict | None = None,
        workforce_data: dict | None = None,
    ) -> str:
        ghg_intensity = ""
        if revenue_dkk and revenue_dkk > 0:
            intensity = calc.total_tonnes / (revenue_dkk / 1_000_000)
            ghg_intensity = f"GHG-intensitet: {intensity:.2f} tCO2e pr. mio. DKK omsætning\n"

        employee_txt = f"Medarbejdere: {employee_count}" if employee_count else ""
        revenue_txt = f"Omsætning: {revenue_dkk/1_000_000:.1f} mio. DKK" if revenue_dkk > 0 else ""
        industry_txt = f"Branche: {industry_code} | Land: {country_code}" if industry_code else f"Land: {country_code}"

        # Top 3 gaps
        top_gaps = [g.title for g in gaps.actions[:3]] if gaps.actions else []
        gap_txt = "; ".join(top_gaps) if top_gaps else "Ingen kritiske mangler"

        # Key policies
        pol = policy_data or {}
        pol_summary = []
        if pol.get("has_environmental_policy"): pol_summary.append("miljøpolitik")
        if pol.get("has_anti_bribery_policy"): pol_summary.append("anti-bestikkelsespolitik")
        if pol.get("has_data_protection_policy"): pol_summary.append("GDPR-politik")
        if pol.get("has_whistleblower_policy"): pol_summary.append("whistleblower-ordning")
        pol_txt = ", ".join(pol_summary) if pol_summary else "ingen politikker registreret"

        prompt = (
            f"Skriv ledelsesoversigten (B1) til VSME-bæredygtighedsrapporten "
            f"for **{company_name}** for rapporteringsåret **{reporting_year}**.\n\n"
            f"=== VIRKSOMHEDSPROFIL ===\n"
            f"{industry_txt}\n"
            f"{employee_txt}\n"
            f"{revenue_txt}\n\n"
            f"=== KLIMAREGNSKAB (B3) ===\n"
            f"Scope 1 (direkte emissioner): {calc.scope1_tonnes:.2f} tCO2e\n"
            f"  Vigtigste kilder: {', '.join(list(calc.scope1_breakdown.keys())[:3]) if calc.scope1_breakdown else 'ingen'}\n"
            f"Scope 2 (indkøbt energi): {calc.scope2_tonnes:.2f} tCO2e\n"
            f"  Vigtigste kilder: {', '.join(list(calc.scope2_breakdown.keys())[:2]) if calc.scope2_breakdown else 'ingen'}\n"
            f"Scope 3 (værdikæde): {calc.scope3_tonnes:.2f} tCO2e\n"
            f"  Vigtigste kilder: {', '.join(list(calc.scope3_breakdown.keys())[:3]) if calc.scope3_breakdown else 'ingen'}\n"
            f"TOTAL: {calc.total_tonnes:.2f} tCO2e\n"
            f"{ghg_intensity}\n"
            f"=== ESG-SCORECARD ===\n"
            f"Samlet ESG-score: {score.total:.1f}/100 — Rating: {score.rating}\n"
            f"Miljø (E, vægt 40%): {score.environmental.score:.1f}/100 — {score.environmental.rating}\n"
            f"Sociale (S, vægt 35%): {score.social.score:.1f}/100 — {score.social.rating}\n"
            f"Lederskab (G, vægt 25%): {score.governance.score:.1f}/100 — {score.governance.rating}\n"
            f"Branchepercentil: {score.industry_percentile}. percentil\n\n"
            f"=== MANGLER OG FORBEDRINGSMULIGHEDER ===\n"
            f"Identificerede mangler: {gaps.total_gaps} i alt ({gaps.high_priority_count} højprioriterede)\n"
            f"Vigtigste forbedringsområder: {gap_txt}\n"
            f"Potentiel score-forbedring ved implementering: +{gaps.total_potential_score_gain:.0f} point\n"
            f"Potentiel projiceret score: ~{min(score.total + gaps.total_potential_score_gain, 100):.0f}/100\n\n"
            f"=== GOVERNANCE ===\n"
            f"Politikker implementeret: {pol_txt}\n\n"
            f"=== FORMAT (OBLIGATORISK) ===\n"
            f"Skriv præcis 5 afsnit med disse overskrifter (450-550 ord total):\n"
            f"## Virksomhedsprofil og rapportens omfang\n"
            f"## Klimaaftryk og drivhusgasemissioner\n"
            f"## ESG-score — styrker og forbedringsområder\n"
            f"## Governance og politikker\n"
            f"## De 3 vigtigste næste skridt\n\n"
            f"Afslut med den obligatoriske ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=1000)

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
        if employee_count and employee_count > 0:
            ghg_txt += f"\nGHG pr. medarbejder: {calc.total_tonnes / employee_count:.2f} tCO2e/medarbejder"

        scope1_pct = (calc.scope1_tonnes / calc.total_tonnes * 100) if calc.total_tonnes > 0 else 0
        scope2_pct = (calc.scope2_tonnes / calc.total_tonnes * 100) if calc.total_tonnes > 0 else 0
        scope3_pct = (calc.scope3_tonnes / calc.total_tonnes * 100) if calc.total_tonnes > 0 else 0

        warnings_txt = "; ".join(calc.warnings) if calc.warnings else "Ingen"

        prompt = (
            f"Skriv afsnittet 'B3 — Energi og drivhusgasemissioner' for **{company_name}** ({reporting_year}).\n\n"
            f"=== SCOPE 1 — DIREKTE EMISSIONER: {calc.scope1_tonnes:.2f} tCO2e ({scope1_pct:.1f}% af total) ===\n"
            f"{_fmt_breakdown(calc.scope1_breakdown)}\n\n"
            f"=== SCOPE 2 — INDKØBT ENERGI: {calc.scope2_tonnes:.2f} tCO2e ({scope2_pct:.1f}% af total) ===\n"
            f"{_fmt_breakdown(calc.scope2_breakdown)}\n\n"
            f"=== SCOPE 3 — VÆRDIKÆDE (frivillig): {calc.scope3_tonnes:.2f} tCO2e ({scope3_pct:.1f}% af total) ===\n"
            f"{_fmt_breakdown(calc.scope3_breakdown)}\n\n"
            f"TOTAL: {calc.total_tonnes:.2f} tCO2e{ghg_txt}\n"
            f"Branche: {industry_code} | Land: {country_code}\n"
            f"Dataadvarsler: {warnings_txt}\n\n"
            f"=== EMISSIONSFAKTORER BRUGT ===\n"
            f"El (DK): 0,136 kg CO2e/kWh — Energistyrelsen 2024\n"
            f"Fjernvarme (DK): 0,066 kg CO2e/kWh — DEA 2024\n"
            f"Naturgas: 2,04 kg CO2e/m³ — DEFRA 2024\n"
            f"Diesel/benzin/fly: DEFRA 2024\n"
            f"Opgørelsesmetode: GHG Protocol Corporate Standard (WRI/WBCSD)\n\n"
            f"=== FORMAT (OBLIGATORISK) ===\n"
            f"Skriv 4 afsnit med disse overskrifter (380-460 ord total):\n"
            f"## Metode og systemgrænser\n"
            f"## Scope 1 — direkte emissioner\n"
            f"## Scope 2 — energirelaterede emissioner\n"
            f"## Scope 3 og databegrænsninger\n\n"
            f"Inkluder de faktiske tal fra ovenstående i hvert afsnit. "
            f"Beregn og nævn procentandele for de vigtigste emissionskilder. "
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=800)

    async def write_esg_narrative(
        self,
        company_name: str,
        score: ESGScore,
        workforce_data: dict | None = None,
        policy_data: dict | None = None,
        environment_data: dict | None = None,
    ) -> str:
        wf = ""
        if workforce_data:
            t = workforce_data.get("employees_total", 0)
            m = workforce_data.get("employees_male", 0)
            f = workforce_data.get("employees_female", 0)
            acc = workforce_data.get("work_related_accidents", workforce_data.get("accident_count", 0))
            train = workforce_data.get("training_hours_total", 0)
            turnover = workforce_data.get("employee_turnover_pct", None)
            female_mgmt = workforce_data.get("female_management_pct", None)
            if t:
                wf = (
                    f"\nMEDARBEJDERDATA (B8-B10):\n"
                    f"  Ansatte i alt: {t} ({m} mænd, {f} kvinder)\n"
                    f"  Arbejdsulykker: {acc}\n"
                    f"  Uddannelsestimer: {train}\n"
                )
                if turnover is not None:
                    wf += f"  Medarbejderomsætning: {turnover}%\n"
                if female_mgmt is not None:
                    wf += f"  Kvinder i ledelse: {female_mgmt}%\n"

        env_txt = ""
        if environment_data:
            water = environment_data.get("water_withdrawal_m3", None)
            waste = environment_data.get("total_waste_tonnes", None)
            recycled = environment_data.get("waste_recycled_pct", None)
            if water is not None:
                env_txt += f"\n  Vandforbrug: {water} m³"
            if waste is not None:
                env_txt += f"\n  Samlet affald: {waste} tonnes"
            if recycled is not None:
                env_txt += f"\n  Genanvendelsesrate: {recycled}%"

        pol_txt = _fmt_policy(policy_data or {})

        e_gaps = "; ".join(score.environmental.gaps[:4]) or "Ingen identificeret"
        s_gaps = "; ".join(score.social.gaps[:4]) or "Ingen identificeret"
        g_gaps = "; ".join(score.governance.gaps[:4]) or "Ingen identificeret"

        prompt = (
            f"Skriv det samlede ESG-scoreafsnit for **{company_name}**.\n\n"
            f"=== ESG-SCORECARD ===\n"
            f"Samlet: {score.total:.1f}/100 ({score.rating}) | Branchepercentil: {score.industry_percentile}.\n\n"
            f"MILJØ (E) — {score.environmental.score:.1f}/100 ({score.environmental.rating}):\n"
            f"  Mangler: {e_gaps}\n"
            f"{env_txt}\n\n"
            f"SOCIALE (S) — {score.social.score:.1f}/100 ({score.social.rating}):\n"
            f"  Mangler: {s_gaps}\n"
            f"{wf}\n"
            f"LEDERSKAB (G) — {score.governance.score:.1f}/100 ({score.governance.rating}):\n"
            f"  Mangler: {g_gaps}\n"
            f"  Politikker:\n{pol_txt}\n\n"
            f"=== FORMAT (OBLIGATORISK) ===\n"
            f"Skriv 4 afsnit med disse overskrifter (350-420 ord total):\n"
            f"## ESG-score — samlet vurdering og branchekontekst\n"
            f"## Miljøpræstation (E) — styrker og kritiske mangler\n"
            f"## Sociale forhold (S) — medarbejdere og arbejdsmiljø\n"
            f"## Governance og politikker (G)\n\n"
            f"Henvis til konkrete tal og procenter i hvert afsnit. "
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=750)

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
            f"(prioritet: {a.priority}, tidsplan: {a.timeline}, +{a.score_improvement_pts:.1f}pt, "
            f"{a.estimated_co2_reduction_pct:.0f}% CO2-reduktion)"
            for a in gaps.actions[:8]
        ]
        qw = [a.title for a in gaps.quick_wins]
        proj = min(score.total + gaps.total_potential_score_gain, 100)

        # Dominant emission source
        all_sources = {**calc.scope1_breakdown, **calc.scope2_breakdown, **calc.scope3_breakdown}
        top_source = max(all_sources.items(), key=lambda x: x[1]["kg_co2e"])[0] if all_sources else None
        top_label = _LABELS.get(top_source, top_source) if top_source else "energiforbrug"

        prompt = (
            f"Skriv afsnittet 'Foreslåede tiltag og forbedringer' for **{company_name}**.\n\n"
            f"=== NUVÆRENDE STATUS ===\n"
            f"ESG-score: {score.total:.1f}/100 ({score.rating})\n"
            f"CO2-emissioner: {calc.total_tonnes:.2f} tCO2e (største kilde: {top_label})\n"
            f"Projiceret score ved fuld implementering: ~{proj:.0f}/100\n\n"
            f"=== IDENTIFICEREDE FORBEDRINGSTILTAG (sorteret efter prioritet) ===\n"
            + "\n".join(lines) + "\n\n"
            f"Hurtige gevinster (< 30 dage): {', '.join(qw) if qw else 'Se Q1-tiltag'}\n\n"
            f"=== FORMAT (OBLIGATORISK) ===\n"
            f"Skriv struktureret (600-750 ord) med disse overskrifter:\n\n"
            f"## Klimatiltag — SMART-mål og handlingstrin\n"
            f"For de 2 vigtigste miljøtiltag, hvert med:\n"
            f"  - SMART-mål (Specifikt, Målbart, Opnåeligt, Relevant, Tidsbestemt — angiv konkrete tal)\n"
            f"  - 3-4 konkrete handlingstrin med ansvarlig funktion\n"
            f"  - Forventet CO2-reduktion i tCO2e og procent\n\n"
            f"## Sociale forbedringer\n"
            f"  - SMART-mål med måltal\n"
            f"  - 3 handlingstrin + KPI'er\n\n"
            f"## Governance og politikker\n"
            f"  - Konkrete politikker der skal implementeres\n"
            f"  - SMART-mål + deadlines\n\n"
            f"## Hurtige gevinster (inden for 30 dage)\n"
            f"  - 3-5 konkrete handlinger med estimeret effekt\n\n"
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=1100)

    async def write_roadmap_narrative(
        self,
        company_name: str,
        score: ESGScore,
        gaps: GapReport,
        reporting_year: int = 2024,
    ) -> str:
        def qt(q: str) -> list:
            return [a.title for a in gaps.roadmap_by_quarter.get(q, [])]

        def qpts(q: str) -> float:
            return sum(a.score_improvement_pts for a in gaps.roadmap_by_quarter.get(q, []))

        proj = min(score.total + gaps.total_potential_score_gain, 100.0)

        prompt = (
            f"Skriv '12-måneders ESG-handlingsplan' for **{company_name}** ({reporting_year}).\n\n"
            f"=== UDGANGSPUNKT ===\n"
            f"Nuværende score: {score.total:.1f}/100 ({score.rating})\n"
            f"Projiceret score: ~{proj:.0f}/100\n"
            f"Potentiel forbedring: +{gaps.total_potential_score_gain:.0f} point\n\n"
            f"=== HANDLINGSPLAN PR. KVARTAL ===\n"
            f"Q1 (Jan–Mar) — +{qpts('Q1'):.0f} pt: {', '.join(qt('Q1')) or 'Ingen planlagte tiltag'}\n"
            f"Q2 (Apr–Jun) — +{qpts('Q2'):.0f} pt: {', '.join(qt('Q2')) or 'Ingen planlagte tiltag'}\n"
            f"Q3 (Jul–Sep) — +{qpts('Q3'):.0f} pt: {', '.join(qt('Q3')) or 'Ingen planlagte tiltag'}\n"
            f"Q4 (Okt–Dec) — +{qpts('Q4'):.0f} pt: {', '.join(qt('Q4')) or 'Ingen planlagte tiltag'}\n"
            f"Hurtige gevinster: {', '.join(a.title for a in gaps.quick_wins) or 'Se Q1'}\n\n"
            f"=== FORMAT (OBLIGATORISK) ===\n"
            f"Skriv 5 afsnit med disse overskrifter (480-580 ord total):\n"
            f"## Kvartal 1 (Jan–Mar) — Fundament og hurtige gevinster\n"
            f"## Kvartal 2 (Apr–Jun) — Systematisering og dokumentation\n"
            f"## Kvartal 3 (Jul–Sep) — Implementering og måling\n"
            f"## Kvartal 4 (Okt–Dec) — Verifikation og næste cyklus\n"
            f"## Forventet effekt og fremtidsperspektiv\n\n"
            f"Angiv konkrete tiltag fra ovenstående liste i hvert kvartal. "
            f"Nævn forventet score-gevinst pr. kvartal. "
            f"Afslut med ansvarsfraskrivelse."
        )
        return await self.llm.generate(_SYSTEM_PROMPT, prompt, max_tokens=900)
