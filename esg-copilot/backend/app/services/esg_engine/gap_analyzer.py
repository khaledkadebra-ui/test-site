"""
Mangelanalyse & 12-måneders handlingsplan — ESG Copilot
=========================================================
Tager ESGScore og producerer en prioriteret handlingsplan på dansk.
Handlinger er deterministiske — ingen LLM involveret.
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
    smart_goal: str
    effort: str          # "low" | "medium" | "high"
    timeline: str        # "Q1" | "Q2" | "Q3" | "Q4"
    kpis: List[str]
    action_steps: List[str]
    estimated_co2_reduction_pct: float = 0.0
    score_improvement_pts: float = 0.0

    def to_dict(self) -> dict:
        return self.__dict__


@dataclass
class GapReport:
    total_gaps: int
    high_priority_count: int
    actions: List[Action]
    quick_wins: List[Action]
    roadmap_by_quarter: dict
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


_ACTIONS: List[Action] = [
    # ── MILJØ ──────────────────────────────────────────────────────────────
    Action(
        id="E001", priority="high", category="E",
        title="Skift til 100% vedvarende el-tarif",
        description="Tegn en certificeret vedvarende el-aftale (Guarantees of Origin). Ingen infrastruktur nødvendig.",
        smart_goal="Inden udgangen af kvartal 1: Tegn aftale om 100% vedvarende el. Mål: Scope 2-emissioner reduceres med mindst 80% ift. nuværende netfaktor.",
        effort="low", timeline="Q1",
        kpis=["Andel vedvarende el %", "Scope 2 tCO2e", "Dato for aftaleindgåelse"],
        action_steps=[
            "Indhent tilbud fra 3 el-leverandører med GO-certificeret el",
            "Sammenlign priser og certificeringstyper (GO, PPA)",
            "Underskriv ny elaftale inden udgangen af måned 1",
            "Opdater ESG-data med ny elkilde fra næste rapporteringsperiode",
        ],
        estimated_co2_reduction_pct=12.0, score_improvement_pts=12.0,
    ),
    Action(
        id="E002", priority="high", category="E",
        title="Fastsæt et videnskabeligt baseret klimamål",
        description="Forpligt dig til et målbart reduktionsmål i overensstemmelse med en 1,5°C-bane. Tilmeld SBTi.",
        smart_goal="Inden udgangen af kvartal 2: Definer GHG-reduktionsmål på min. 42% inden 2030 (basisår: indeværende år). Indsend til SBTi-validering.",
        effort="medium", timeline="Q2",
        kpis=["Reduktionsmål % vs. basisår", "Målår", "Basisår tCO2e", "SBTi-status"],
        action_steps=[
            "Beregn basisårsemissioner for Scope 1+2 (og evt. Scope 3)",
            "Definer reduktionsmål i tråd med 1,5°C (min. 4,2% pr. år)",
            "Dokumenter mål i virksomhedens klimapolitik",
            "Tilmeld SBTi (gratis for SMV'er) og indsend mål til validering",
        ],
        score_improvement_pts=15.0,
    ),
    Action(
        id="E003", priority="medium", category="E",
        title="Gennemfør energieffektivitetsanalyse",
        description="Engager en akkrediteret energikonsulent. Typisk afdækkes 10-25% besparelsesmuligheder.",
        smart_goal="Inden udgangen af kvartal 1: Bestil og modtag energianalyse. Implementer min. 2 tiltag inden kvartal 2 med mål om 10% reduktion i energiintensitet.",
        effort="medium", timeline="Q1",
        kpis=["Energiintensitet kWh/mio. DKK omsætning", "Identificerede besparelser kWh/år"],
        action_steps=[
            "Indhent 2-3 tilbud fra certificerede energikonsulenter",
            "Gennemfør energianalyse af alle faciliteter",
            "Prioriter tiltag ud fra cost-benefit-analyse",
            "Implementer de 2 mest omkostningseffektive tiltag inden kvartal 2",
        ],
        estimated_co2_reduction_pct=8.0,
    ),
    Action(
        id="E004", priority="high", category="E",
        title="Udform affaldshåndteringspolitik og sæt genanvendelsesmål (B7)",
        description="Identificer og dokumenter affaldsstrømme, sæt genanvendelsesmål (VSME B7).",
        smart_goal="Inden udgangen af kvartal 1: Dokumenter alle affaldsstrømme og udform skriftlig politik. Mål: 60% genanvendelsesrate inden årets udgang.",
        effort="low", timeline="Q1",
        kpis=["Genanvendelse %", "Samlet affald genereret (tons)", "Restaffald tons"],
        action_steps=[
            "Kortlæg alle affaldstyper og mængder",
            "Skriv affaldspolitik med mål og ansvarlige",
            "Opsæt sorteringssystem og oplær medarbejdere",
            "Registrer månedlig affaldsdata og afrapporter kvartalsvist",
        ],
        score_improvement_pts=5.0,
    ),
    Action(
        id="E005", priority="medium", category="E",
        title="Indfør rejsepolitik med digital-først princip",
        description="Gør videomøder til standard og kræv godkendelse til flyrejser.",
        smart_goal="Inden udgangen af kvartal 1: Udform og implementer rejsepolitik. Mål: 20% reduktion i forretningsrejse-emissioner inden for 12 måneder.",
        effort="low", timeline="Q1",
        kpis=["Flyrejse-km per medarbejder", "Rejse Scope 3 tCO2e", "Andel digitale møder %"],
        action_steps=[
            "Skriv rejsepolitik med digital-møde som standard",
            "Indfør godkendelsesproces for flyrejser over 500 km",
            "Sæt CO2-budget per medarbejder til rejser",
            "Mål og afrapporter rejseemissioner kvartalsvist",
        ],
        estimated_co2_reduction_pct=5.0,
    ),
    Action(
        id="E006", priority="low", category="E",
        title="Undersøg muligheder for solcelleanlæg",
        description="Mulighedsanalyse for tagmonterede solceller. Reducerer Scope 2 og energiomkostninger.",
        smart_goal="Inden udgangen af kvartal 4: Indhent solcelletilbud og truf investeringsbeslutning. Mål: Producere min. 20% af elforbrug fra sol inden 2027.",
        effort="high", timeline="Q4",
        kpis=["Egenproduceret el kWh", "Tilbagebetalingstid år", "CO2-reduktion tCO2e/år"],
        action_steps=[
            "Indhent 2-3 tilbud fra solcelleinstallatører",
            "Beregn ROI og tilbagebetalingstid",
            "Undersøg statslig støtte via Energistyrelsen",
            "Truf investeringsbeslutning og planlæg installation",
        ],
        estimated_co2_reduction_pct=6.0,
    ),
    Action(
        id="E007", priority="medium", category="E",
        title="Indfør vandforbrugspolitik og mål vandtræk (B6)",
        description="Dokumenter vandtræk (VSME B6), sæt reduktionsmål og indfør vandbegrænsende foranstaltninger.",
        smart_goal="Inden udgangen af kvartal 2: Kortlæg og dokumenter vandtræk. Mål: 15% reduktion i vandintensitet inden årets udgang.",
        effort="low", timeline="Q2",
        kpis=["Vandforbrug m3/år", "Vandintensitet m3/mio. DKK omsætning"],
        action_steps=[
            "Aflæs og registrer vandmålere månedligt",
            "Identificer de største vandforbrugende processer",
            "Indfør vandbegrænsende foranstaltninger",
            "Dokumenter vandpolitik og mål",
        ],
        score_improvement_pts=3.0,
    ),

    # ── SOCIALE ────────────────────────────────────────────────────────────
    Action(
        id="S001", priority="high", category="S",
        title="Implementer formel arbejdsmiljøpolitik (B9)",
        description="Dokumenter arbejdsmiljøprocedurer, gennemfør risikovurderinger (APV), opret hændelsesindberetning.",
        smart_goal="Inden udgangen af kvartal 1: Udform og implementer skriftlig arbejdsmiljøpolitik. Mål: LTIR < 3,0 pr. 1 mio. arbejdstimer inden årets udgang.",
        effort="medium", timeline="Q1",
        kpis=["LTIR (fraværsskadefrekvens)", "Nærved-hændelsesrapporter", "Arbejdsmiljø-uddannelsestimer"],
        action_steps=[
            "Kortlæg eksisterende arbejdsmiljørisici (APV)",
            "Skriv arbejdsmiljøpolitik med klare ansvarsroller",
            "Oplær alle medarbejdere i arbejdsmiljøprocedurer (min. 4 timer)",
            "Etabler system til indberetning af ulykker og nærved-hændelser",
        ],
        score_improvement_pts=20.0,
    ),
    Action(
        id="S002", priority="high", category="S",
        title="Lancér struktureret medarbejderuddannelsesprogram (B10)",
        description="Implementer onboarding, rollerelevant uddannelse og faglig udvikling. Mål: min. 20 timer pr. medarbejder pr. år.",
        smart_goal="Inden udgangen af kvartal 2: Etabler uddannelsesprogram med min. 20 timer/medarbejder/år. Mål: 100% deltagelse inden årets udgang.",
        effort="medium", timeline="Q2",
        kpis=["Uddannelsestimer pr. medarbejder/år", "Deltagelsesprocent %"],
        action_steps=[
            "Kortlæg uddannelsesbehov per rolle",
            "Opsæt uddannelseskalender for hele året",
            "Afsæt budget til ekstern uddannelse og kurser",
            "Registrer alle gennemførte uddannelsestimer per medarbejder",
        ],
        score_improvement_pts=12.0,
    ),
    Action(
        id="S003", priority="medium", category="S",
        title="Vedtag mangfoldigheds- og inklusionspolitik (B8/B10)",
        description="Udform D&I-politik, sæt kønsrepræsentationsmål (min. 40% kvinder i ledelse).",
        smart_goal="Inden udgangen af kvartal 2: Udform og godkend D&I-politik. Mål: Min. 40% kvindeandel i lederstillinger inden 2027.",
        effort="low", timeline="Q2",
        kpis=["Kvindeandel i ledelse %", "D&I-politik vedtaget (ja/nej)", "Lønforskelanalyse"],
        action_steps=[
            "Analyser nuværende kønsfordeling på alle niveauer",
            "Udform D&I-politik med konkrete mål",
            "Gennemfør lønanalyse og identificer eventuelle lønforskelle",
            "Publicer politik internt og eksternt",
        ],
        score_improvement_pts=15.0,
    ),
    Action(
        id="S004", priority="medium", category="S",
        title="Gennemfør lønundersøgelse — sikr mindsteløn (B10)",
        description="Sammenlign alle lønninger med lovpligtig mindsteløn. Dokumenter i VSME B10.",
        smart_goal="Inden udgangen af kvartal 3: 100% af medarbejdere lønnes over lovpligtig mindsteløn. Dokumenter i VSME B10.",
        effort="medium", timeline="Q3",
        kpis=["% medarbejdere over mindsteløn", "% medarbejdere over levende løn"],
        action_steps=[
            "Indhent aktuelle mindstelønssatser (overenskomster/lovgivning)",
            "Kortlæg alle medarbejderlønninger vs. mindsteløn",
            "Juster lønninger under mindsteløn øjeblikkeligt",
            "Dokumenter resultater til VSME B10-rapportering",
        ],
        score_improvement_pts=8.0,
    ),

    # ── LEDERSKAB ──────────────────────────────────────────────────────────
    Action(
        id="G001", priority="high", category="G",
        title="Udform og publicer formel ESG-/bæredygtighedspolitik (B2)",
        description="Dokumenter virksomhedens ESG-forpligtelser, mål og rapporteringsmetode.",
        smart_goal="Inden udgangen af kvartal 1: Udform, godkend og publicer ESG-politik. 100% medarbejderkendskab inden kvartal 1.",
        effort="low", timeline="Q1",
        kpis=["ESG-politik publiceret", "Godkendt af ledelse (ja/nej)", "Medarbejderkendskab %"],
        action_steps=[
            "Udform ESG-politik med konkrete mål og ansvarlige",
            "Godkend på direktions- eller bestyrelsesniveau",
            "Kommuniker til alle medarbejdere via e-mail og møde",
            "Publicer på virksomhedens hjemmeside",
        ],
        score_improvement_pts=15.0,
    ),
    Action(
        id="G002", priority="high", category="G",
        title="Vedtag adfærdskodeks (B2/B11)",
        description="Virksomhedsdækkende kodeks om etik, anti-korruption og forretningsadfærd.",
        smart_goal="Inden udgangen af kvartal 1: Godkend og distribuer adfærdskodeks. Mål: 100% medarbejder-underskrift inden kvartal 2.",
        effort="low", timeline="Q1",
        kpis=["Adfærdskodeks publiceret (ja/nej)", "Medarbejder-underskrift %", "Antal overtrædelser"],
        action_steps=[
            "Udform kodeks (etik, anti-korruption, whistleblower)",
            "Lad juridisk rådgiver gennemse dokumentet",
            "Distribuer til alle medarbejdere og indhent underskrift",
            "Etabler whistleblowerordning",
        ],
        score_improvement_pts=10.0,
    ),
    Action(
        id="G003", priority="high", category="G",
        title="Implementer GDPR-kompatibel databeskyttelsespolitik (B2)",
        description="Udarbejd behandlingsfortegnelse (ROPA) og publicer privatlivspolitik.",
        smart_goal="Inden udgangen af kvartal 1: Udarbejd ROPA og publicer privatlivspolitik. 100% GDPR-compliance inden kvartal 2.",
        effort="medium", timeline="Q1",
        kpis=["Privatlivspolitik publiceret", "ROPA udarbejdet (ja/nej)", "GDPR-henvendelser korrekt behandlet %"],
        action_steps=[
            "Kortlæg alle persondata og databehandlingsaktiviteter",
            "Udarbejd ROPA (behandlingsfortegnelse)",
            "Publicer GDPR-kompatibel privatlivspolitik",
            "Oplær medarbejdere i databeskyttelse (min. 2 timer)",
        ],
        score_improvement_pts=30.0,
    ),
    Action(
        id="G004", priority="medium", category="G",
        title="Tildel bestyrelsesansvar for ESG",
        description="Udpeg ESG-ansvarlig i ledelse. ESG på dagsordenen min. 2 gange årligt.",
        smart_goal="Inden udgangen af kvartal 2: Udpeg navngiven ESG-ansvarlig. ESG på bestyrelsesdagsorden min. 2 gange/år.",
        effort="low", timeline="Q2",
        kpis=["ESG-ansvarlig udpeget (ja/nej)", "Antal ESG-bestyrelsespunkter/år"],
        action_steps=[
            "Beslut hvem i ledelsen der bærer ESG-ansvaret",
            "Dokumenter ansvarsfordeling i ledelseshåndbog",
            "Sæt ESG på bestyrelsesdagsorden 2 gange i år",
            "Opret ESG-statusrapport til ledelsesgennemgang",
        ],
        score_improvement_pts=5.0,
    ),
    Action(
        id="G005", priority="medium", category="G",
        title="Implementer leverandøradfærdskodeks",
        description="Leverandørkodeks med miljøkrav, arbejdsstandarder og anti-korruption.",
        smart_goal="Inden udgangen af kvartal 3: Send kodeks til top-10 leverandører. Mål: 80% af indkøbsværdi dækket af underskrevet kodeks inden årets udgang.",
        effort="medium", timeline="Q3",
        kpis=["Leverandører med underskrevet kodeks %", "Indkøbsværdi dækket %"],
        action_steps=[
            "Udform leverandørkodeks (miljø, arbejdsforhold, anti-korruption)",
            "Kortlæg top-10 leverandører efter indkøbsværdi",
            "Send kodeks til leverandørerne og bed om underskrift",
            "Integrer krav i nye leverandørkontrakter",
        ],
        score_improvement_pts=10.0,
    ),
]


class GapAnalyzer:
    """Producerer en prioriteret 12-måneders handlingsplan fra ESGScore-mangler."""

    def analyze(self, score: ESGScore) -> GapReport:
        all_gaps = (
            score.environmental.gaps
            + score.social.gaps
            + score.governance.gaps
        )

        applicable = self._select_actions(score)

        _order = {"high": 0, "medium": 1, "low": 2}
        applicable.sort(key=lambda a: (_order[a.priority], -a.score_improvement_pts))

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
        selected = []
        for action in _ACTIONS:
            include = (
                (action.category == "E" and score.environmental.score < 75) or
                (action.category == "S" and score.social.score < 75) or
                (action.category == "G" and score.governance.score < 75) or
                action.priority == "high"
            )
            if include and action not in selected:
                selected.append(action)
        return selected
