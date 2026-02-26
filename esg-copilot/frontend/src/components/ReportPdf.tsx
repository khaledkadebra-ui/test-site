/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReportPdf.tsx — Professional VSME ESG Report PDF template
 * Uses @react-pdf/renderer — rendered entirely in the browser, no server needed.
 *
 * Layout inspired by professional ESG/sustainability reports:
 * Cover → ToC → B1 Ledelse → B3 CO₂ → ESG Scores → Mangler → Tiltag → Handlingsplan → Disclaimer
 */
import {
  Document, Page, Text, View, StyleSheet, Svg, Circle, Rect, G,
  Font,
} from "@react-pdf/renderer"

// ── Register font ─────────────────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hiJ-Ek-_EeA.woff", fontWeight: 800 },
  ],
})

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  green:       "#16a34a",
  greenLight:  "#dcfce7",
  greenMid:    "#22c55e",
  emerald:     "#059669",
  blue:        "#0284c7",
  blueLight:   "#e0f2fe",
  violet:      "#7c3aed",
  violetLight: "#ede9fe",
  orange:      "#f97316",
  orangeLight: "#ffedd5",
  amber:       "#d97706",
  amberLight:  "#fef9c3",
  red:         "#dc2626",
  redLight:    "#fee2e2",
  gray50:      "#f8fafc",
  gray100:     "#f1f5f9",
  gray200:     "#e2e8f0",
  gray400:     "#94a3b8",
  gray600:     "#475569",
  gray700:     "#334155",
  gray900:     "#0f172a",
  white:       "#ffffff",
  sidebar:     "#0d1f2d",
}

const RATING_COLOR: Record<string, string> = {
  A: C.emerald, B: C.green, C: C.amber, D: C.orange, E: C.red,
}
const RATING_LABEL: Record<string, string> = {
  A: "Fremragende", B: "Godt", C: "Middel", D: "Under middel", E: "Kritisk",
}
const DIM_COLOR = { E: C.emerald, S: C.blue, G: C.violet }
const PRIO_COLOR: Record<string, string> = { high: C.red, medium: C.amber, low: C.green }

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: C.gray700, backgroundColor: C.white, paddingTop: 0, paddingBottom: 48 },

  // Cover
  coverPage: { fontFamily: "Inter", backgroundColor: C.sidebar, padding: 0 },
  coverTop:  { backgroundColor: C.sidebar, flex: 1, padding: 56, justifyContent: "space-between" },
  coverBrand:{ fontSize: 10, fontWeight: 600, color: C.green, letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 8 },
  coverTitle:{ fontSize: 32, fontWeight: 800, color: C.white, lineHeight: 1.2, marginBottom: 8 },
  coverSub:  { fontSize: 13, color: "#94a3b8", marginBottom: 32 },
  coverRatingBox: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, marginBottom: 24, maxWidth: 280 },
  coverRatingNum: { fontSize: 48, fontWeight: 800, marginBottom: 4 },
  coverRatingLabel: { fontSize: 12, color: "#94a3b8", fontWeight: 400 },
  coverMeta: { fontSize: 10, color: "#64748b", marginTop: 4 },
  coverBottom: { backgroundColor: "#0a1825", padding: 24, paddingLeft: 56, flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  coverBottomText: { fontSize: 9, color: "#475569" },

  // Page chrome
  pageHeader: { backgroundColor: C.green, height: 4 },
  pageFooter: { position: "absolute" as const, bottom: 0, left: 0, right: 0, paddingHorizontal: 40, paddingVertical: 14, flexDirection: "row" as const, justifyContent: "space-between" as const, borderTopWidth: 1, borderTopColor: C.gray200 },
  pageFooterText: { fontSize: 7.5, color: C.gray400 },
  pageBody: { paddingHorizontal: 40, paddingTop: 28 },

  // Section headers
  sectionBadge: { fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: C.green, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 800, color: C.gray900, marginBottom: 12 },
  sectionSub:   { fontSize: 9, color: C.gray400, marginBottom: 14 },

  // Cards
  card:         { backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.gray200, padding: 14, marginBottom: 12 },
  cardTitle:    { fontSize: 9, fontWeight: 700, color: C.gray900, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  cardHighlight:{ backgroundColor: C.gray50, borderRadius: 8, padding: 12, marginBottom: 10 },

  // Text
  body:    { fontSize: 9, color: C.gray700, lineHeight: 1.6 },
  bodyMd:  { fontSize: 9.5, color: C.gray700, lineHeight: 1.65 },
  small:   { fontSize: 8, color: C.gray400 },
  caption: { fontSize: 7.5, color: C.gray400, fontStyle: "italic" as const },

  // KPI grid
  kpiGrid: { flexDirection: "row" as const, gap: 10, marginBottom: 20 },
  kpiBox:  { flex: 1, backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, padding: 14, alignItems: "center" as const },
  kpiNum:  { fontSize: 26, fontWeight: 800, color: C.gray900, marginBottom: 2 },
  kpiLabel:{ fontSize: 7.5, color: C.gray400, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" as const, textAlign: "center" as const },

  // Scope bar
  scopeRow:   { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 8 },
  scopeLabel: { width: 120, fontSize: 8.5, color: C.gray700, fontWeight: 600 },
  scopeTrack: { flex: 1, height: 7, backgroundColor: C.gray100, borderRadius: 4, overflow: "hidden" as const },
  scopeFill:  { height: 7, borderRadius: 4 },
  scopeValue: { width: 46, fontSize: 8.5, color: C.gray700, fontWeight: 700, textAlign: "right" as const },

  // Rec card
  recCard:      { borderRadius: 8, borderWidth: 1, borderColor: C.gray200, marginBottom: 10, overflow: "hidden" as const },
  recHeader:    { padding: 10, paddingLeft: 12 },
  recTitle:     { fontSize: 9.5, fontWeight: 700, color: C.gray900, marginBottom: 4 },
  recDesc:      { fontSize: 8.5, color: C.gray600, lineHeight: 1.5 },
  recMeta:      { flexDirection: "row" as const, gap: 8, marginTop: 6 },
  recBadge:     { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 7.5, fontWeight: 700 },
  recSteps:     { backgroundColor: C.gray50, padding: 10, paddingLeft: 14 },
  recStep:      { flexDirection: "row" as const, gap: 8, marginBottom: 5 },
  recStepNum:   { width: 14, height: 14, backgroundColor: C.green, borderRadius: 7, alignItems: "center" as const, justifyContent: "center" as const, flexShrink: 0, marginTop: 1 },
  recStepNumTxt:{ fontSize: 7, color: C.white, fontWeight: 700 },
  recStepTxt:   { fontSize: 8, color: C.gray700, lineHeight: 1.5, flex: 1 },
  recSmartBox:  { backgroundColor: "#f0fdf4", borderRadius: 4, padding: 8, marginTop: 8 },
  recSmartLabel:{ fontSize: 7.5, fontWeight: 700, color: C.emerald, marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.6 },
  recSmartTxt:  { fontSize: 8, color: "#166534", lineHeight: 1.4 },

  // Gap
  gapRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  gapDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3, marginRight: 10, flexShrink: 0 },
  gapTitle: { fontSize: 9, fontWeight: 700, color: C.gray900, marginBottom: 2 },
  gapDesc:  { fontSize: 8, color: C.gray600, lineHeight: 1.5 },

  // Q roadmap
  qGrid: { flexDirection: "row" as const, gap: 8 },
  qCol:  { flex: 1, borderRadius: 8, overflow: "hidden" as const, borderWidth: 1, borderColor: C.gray200 },
  qHead: { padding: 8, paddingHorizontal: 10 },
  qHeadTitle: { fontSize: 8.5, fontWeight: 800, color: C.white, marginBottom: 1 },
  qHeadSub:   { fontSize: 7, color: "rgba(255,255,255,0.7)" },
  qBody: { padding: 8, backgroundColor: C.white },
  qItem: { flexDirection: "row" as const, gap: 5, marginBottom: 6 },
  qDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green, marginTop: 3, flexShrink: 0 },
  qItemText: { fontSize: 7.5, color: C.gray700, lineHeight: 1.4, flex: 1 },
  qTotal: { backgroundColor: C.gray50, padding: 6, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.gray100 },
  qTotalText: { fontSize: 7.5, color: C.green, fontWeight: 700, textAlign: "right" as const },

  // ToC
  tocRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-end" as const, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  tocTitle: { fontSize: 10, color: C.gray700 },
  tocPage:  { fontSize: 8, color: C.gray400 },

  // Divider
  divider: { borderTopWidth: 1, borderTopColor: C.gray200, marginVertical: 16 },
  spacer:  { height: 16 },
})

// ── Helper components ─────────────────────────────────────────────────────────

function PageHeader({ companyName, section }: { companyName: string; section: string }) {
  return (
    <>
      <View style={s.pageHeader} />
      <View style={{ paddingHorizontal: 40, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.gray50 }}>
        <Text style={{ fontSize: 8, color: C.gray400, fontWeight: 600 }}>{companyName} · VSME ESG-rapport</Text>
        <Text style={{ fontSize: 8, color: C.green, fontWeight: 700 }}>{section}</Text>
      </View>
    </>
  )
}

function PageFooter({ page, companyName, year }: { page: string; companyName: string; year: number }) {
  return (
    <View style={s.pageFooter}>
      <Text style={s.pageFooterText}>© {year} {companyName} · Genereret af ESG Copilot AI</Text>
      <Text style={s.pageFooterText}>{page}</Text>
    </View>
  )
}

function SectionHeading({ badge, title, sub }: { badge: string; title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.sectionBadge}>{badge}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      {sub && <Text style={s.sectionSub}>{sub}</Text>}
    </View>
  )
}

function ScopeBar({ label, tonnes, max, color }: { label: string; tonnes: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((tonnes / max) * 100, 100) : 0
  return (
    <View style={s.scopeRow}>
      <Text style={s.scopeLabel}>{label}</Text>
      <View style={s.scopeTrack}>
        <View style={[s.scopeFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.scopeValue}>{tonnes.toFixed(1)} t</Text>
    </View>
  )
}

function DimBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100)
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: 700, color: C.gray700 }}>{label}</Text>
        <Text style={{ fontSize: 9, fontWeight: 800, color }}>{score.toFixed(1)} / {max}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: C.gray100, borderRadius: 4, overflow: "hidden" }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${pct}%` }} />
      </View>
    </View>
  )
}

function ScoreRingSvg({ score, max, color, size = 80 }: { score: number; max: number; color: string; size?: number }) {
  const sw = 8
  const r  = (size - sw * 2) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(score / max, 1) * circ
  const gap  = circ - dash
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cx} r={r} stroke={C.gray100} strokeWidth={sw} fill="none" />
      <G transform={`rotate(-90, ${cx}, ${cx})`}>
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
}

type Rec = {
  id: string; title: string; description: string; effort: string; category: string;
  priority: string; timeline: string; smart_goal: string; action_steps: string[];
  score_improvement_pts: number; estimated_co2_reduction_pct: number;
}

function RecCard({ rec }: { rec: Rec }) {
  const dimColor = (DIM_COLOR as any)[rec.category] || C.green
  const prioColor = (PRIO_COLOR as any)[rec.priority] || C.green
  const effortLabel: Record<string, string> = { low: "Lav indsats", medium: "Middel indsats", high: "Høj indsats" }
  const timelineHeader = { Q1: "#22c55e", Q2: "#0284c7", Q3: "#7c3aed", Q4: "#f97316" }
  const headerBg = (timelineHeader as any)[rec.timeline] || C.green

  return (
    <View style={s.recCard}>
      <View style={[s.recHeader, { borderLeftWidth: 3, borderLeftColor: dimColor }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            <View style={[s.recBadge, { backgroundColor: dimColor + "20", borderWidth: 1, borderColor: dimColor + "40" }]}>
              <Text style={{ fontSize: 7.5, fontWeight: 700, color: dimColor }}>
                { rec.category === "E" ? "Miljø" : rec.category === "S" ? "Sociale" : "Ledelse" }
              </Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: prioColor + "15", borderWidth: 1, borderColor: prioColor + "40" }]}>
              <Text style={{ fontSize: 7.5, fontWeight: 700, color: prioColor }}>
                { rec.priority === "high" ? "Høj" : rec.priority === "medium" ? "Middel" : "Lav" }
              </Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: headerBg + "20", borderWidth: 1, borderColor: headerBg + "30" }]}>
              <Text style={{ fontSize: 7.5, fontWeight: 700, color: headerBg }}>{rec.timeline}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: C.green }}>+{rec.score_improvement_pts} pt</Text>
            {rec.estimated_co2_reduction_pct > 0 && (
              <Text style={{ fontSize: 8, fontWeight: 700, color: C.emerald }}>-{rec.estimated_co2_reduction_pct}% CO₂</Text>
            )}
            <Text style={{ fontSize: 8, color: C.gray400 }}>{effortLabel[rec.effort] || rec.effort}</Text>
          </View>
        </View>
        <Text style={s.recTitle}>{rec.title}</Text>
        <Text style={s.recDesc}>{rec.description}</Text>
        {rec.smart_goal && (
          <View style={s.recSmartBox}>
            <Text style={s.recSmartLabel}>SMART-mål</Text>
            <Text style={s.recSmartTxt}>{rec.smart_goal}</Text>
          </View>
        )}
      </View>
      {rec.action_steps?.length > 0 && (
        <View style={s.recSteps}>
          <Text style={{ fontSize: 7.5, fontWeight: 700, color: C.gray400, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>Handlingstrin</Text>
          {rec.action_steps.slice(0, 5).map((step, i) => (
            <View key={i} style={s.recStep}>
              <View style={s.recStepNum}><Text style={s.recStepNumTxt}>{i + 1}</Text></View>
              <Text style={s.recStepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ── Main PDF Document ─────────────────────────────────────────────────────────

export interface ReportPdfProps {
  companyName:   string
  reportYear:    number
  reportDate:    string
  esgRating:     string
  esgScoreTotal: number
  esgScoreE:     number
  esgScoreS:     number
  esgScoreG:     number
  industryPercentile: number
  totalCo2Tonnes:   number
  scope1Co2Tonnes:  number
  scope2Co2Tonnes:  number
  scope3Co2Tonnes:  number
  executiveSummary: string
  co2Narrative:     string
  esgNarrative:     string
  improvementsNarrative: string
  roadmapNarrative: string
  identifiedGaps: string[]
  recommendations: Rec[]
  disclaimer:     string
  industryCode?:  string
  countryCode?:   string
}

export function ReportPdfDocument(props: ReportPdfProps) {
  const {
    companyName, reportYear, reportDate, esgRating, esgScoreTotal,
    esgScoreE, esgScoreS, esgScoreG, industryPercentile,
    totalCo2Tonnes, scope1Co2Tonnes, scope2Co2Tonnes, scope3Co2Tonnes,
    executiveSummary, co2Narrative, esgNarrative, improvementsNarrative,
    identifiedGaps, recommendations, disclaimer, industryCode, countryCode,
  } = props

  const rColor = RATING_COLOR[esgRating] || C.gray600
  const year   = reportYear
  const dateStr = reportDate ? new Date(reportDate).toLocaleDateString("da-DK", { year: "numeric", month: "long", day: "numeric" }) : ""
  const maxCo2  = Math.max(scope1Co2Tonnes, scope2Co2Tonnes, scope3Co2Tonnes, 0.01)

  const gapsByPrio = {
    high:   identifiedGaps.filter((_, i) => recommendations[i]?.priority === "high").slice(0, 3),
    medium: identifiedGaps.slice(0, 8),
    low:    [],
  }
  // Simple gap list
  const gapList = identifiedGaps.slice(0, 14)

  const recsHigh   = recommendations.filter(r => r.priority === "high").slice(0, 6)
  const recsOthers = recommendations.filter(r => r.priority !== "high").slice(0, 4)

  const qColors: Record<string, string> = { Q1: "#22c55e", Q2: "#0284c7", Q3: "#7c3aed", Q4: "#f97316" }
  const qLabels: Record<string, string> = { Q1: "Kvartal 1\nJan–Mar", Q2: "Kvartal 2\nApr–Jun", Q3: "Kvartal 3\nJul–Sep", Q4: "Kvartal 4\nOkt–Dec" }

  return (
    <Document
      title={`${companyName} VSME ESG-rapport ${year}`}
      author="ESG Copilot"
      subject="VSME Basic Module ESG-rapport"
      keywords="ESG VSME bæredygtighed CO2 klimaaftryk"
    >

      {/* ── PAGE 1: Cover ──────────────────────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          {/* Brand */}
          <View>
            <Text style={s.coverBrand}>ESG Copilot · AI-genereret rapport</Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 48 }}>
              {industryCode || "Virksomhed"} · {countryCode || "DK"}
            </Text>

            {/* Rating badge */}
            <View style={[s.coverRatingBox, { borderLeftWidth: 4, borderLeftColor: rColor }]}>
              <Text style={[s.coverRatingNum, { color: rColor }]}>{esgRating}</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 4 }}>
                {RATING_LABEL[esgRating] || "ESG-vurdering"}
              </Text>
              <Text style={s.coverRatingLabel}>
                ESG Score: {esgScoreTotal.toFixed(1)} / 100 · {totalCo2Tonnes.toFixed(1)} tCO₂e total
              </Text>
              {industryPercentile > 0 && (
                <Text style={[s.coverRatingLabel, { marginTop: 4 }]}>
                  Bedre end {industryPercentile.toFixed(0)}% i branchen
                </Text>
              )}
            </View>

            {/* Titles */}
            <Text style={s.coverTitle}>{companyName}</Text>
            <Text style={s.coverSub}>VSME Bæredygtighedsrapport {year}</Text>
            <Text style={{ fontSize: 11, color: "#64748b" }}>
              iht. VSME Basic Module · EFRAG 2024
            </Text>
          </View>

          {/* Bottom metadata */}
          <View>
            <Text style={s.coverMeta}>Genereret: {dateStr}</Text>
            <Text style={s.coverMeta}>Rapportperiode: {year} (1. jan – 31. dec)</Text>
          </View>
        </View>

        <View style={s.coverBottom}>
          <View>
            <Text style={[s.coverBottomText, { fontWeight: 700, color: "#94a3b8" }]}>ESG Copilot</Text>
            <Text style={s.coverBottomText}>AI-drevet ESG-rapportering og klimaanalyse</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.coverBottomText}>esg-copilot-app.vercel.app</Text>
            <Text style={s.coverBottomText}>{dateStr}</Text>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2: Table of contents ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Indholdsfortegnelse" />
        <View style={s.pageBody}>
          <SectionHeading badge="Indholdsfortegnelse" title="Oversigt over rapporten" />

          {[
            { num: "B1",  title: "Ledelsesoversigt og virksomhedsprofil",                  pg: 3  },
            { num: "B3",  title: "Klimaaftryk og CO₂-emissioner (Scope 1, 2 og 3)",        pg: 4  },
            { num: "B2",  title: "ESG-score og præstationsoversigt",                       pg: 5  },
            { num: "B8–10", title: "Medarbejderforhold og sociale indikatorer",            pg: 6  },
            { num: "B11", title: "Governance og politikker",                               pg: 6  },
            { num: "—",   title: "Identificerede mangler",                                 pg: 7  },
            { num: "—",   title: "Anbefalede tiltag og forbedringer",                      pg: 8  },
            { num: "—",   title: "12-måneders handlingsplan",                              pg: 9  },
            { num: "—",   title: "Ansvarsfraskrivelse og metode",                          pg: 10 },
          ].map((row, i) => (
            <View key={i} style={s.tocRow}>
              <View style={{ flexDirection: "row", gap: 14, flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: C.green, minWidth: 30 }}>{row.num}</Text>
                <Text style={s.tocTitle}>{row.title}</Text>
              </View>
              <Text style={s.tocPage}>{row.pg}</Text>
            </View>
          ))}

          <View style={[s.cardHighlight, { marginTop: 24 }]}>
            <Text style={[s.sectionBadge, { marginBottom: 6 }]}>Om denne rapport</Text>
            <Text style={s.bodyMd}>
              Denne rapport er udarbejdet i henhold til VSME Basic Module (EFRAG, 2024) og dækker
              indberetningsperioden 1. januar – 31. december {year}. CO₂-beregninger er foretaget
              iht. GHG Protocol Corporate Standard med emissionsfaktorer fra Energistyrelsen 2024
              (el, fjernvarme) og DEFRA 2024 (brændstoffer, transport).
            </Text>
          </View>
        </View>
        <PageFooter page="Side 2" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 3: B1 Ledelsesoversigt ───────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="B1 — Ledelsesoversigt" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="B1 · Ledelsesoversigt"
            title="Virksomhedsprofil og sammenfatning"
            sub="VSME Basic Module, afsnit B1 — Generelle oplysninger og kontekst"
          />

          {/* KPI grid */}
          <View style={s.kpiGrid}>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: rColor }]}>
              <View style={{ marginBottom: 6 }}>
                <ScoreRingSvg score={esgScoreTotal} max={100} color={rColor} size={72} />
              </View>
              <Text style={[s.kpiNum, { color: rColor, fontSize: 20 }]}>{esgRating}</Text>
              <Text style={s.kpiLabel}>ESG Rating</Text>
            </View>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: C.green }]}>
              <Text style={s.kpiNum}>{esgScoreTotal.toFixed(1)}</Text>
              <Text style={s.kpiLabel}>Score / 100</Text>
            </View>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: C.blue }]}>
              <Text style={s.kpiNum}>{totalCo2Tonnes.toFixed(1)}</Text>
              <Text style={s.kpiLabel}>Total tCO₂e</Text>
            </View>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: C.violet }]}>
              <Text style={s.kpiNum}>{industryPercentile.toFixed(0)}</Text>
              <Text style={s.kpiLabel}>Branche-percentil</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Ledelsesresumé</Text>
            <Text style={s.bodyMd}>{executiveSummary || `${companyName} har gennemført en ESG-dataindberetning for ${year}. Rapporten er udarbejdet i overensstemmelse med VSME Basic Module og dokumenterer virksomhedens miljø-, sociale og ledelsesmæssige præstation.`}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>ESG-scorefordeling pr. dimension</Text>
            <DimBar label="Miljø (E)"   score={esgScoreE} max={40} color={C.emerald} />
            <DimBar label="Sociale (S)" score={esgScoreS} max={35} color={C.blue}    />
            <DimBar label="Ledelse (G)" score={esgScoreG} max={25} color={C.violet}  />
          </View>
        </View>
        <PageFooter page="Side 3" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 4: B3 CO₂ ────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="B3 — Klimaaftryk" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="B3 · Klimaaftryk og GHG-opgørelse"
            title={`CO₂-emissioner ${year} — ${totalCo2Tonnes.toFixed(1)} tCO₂e`}
            sub="GHG Protocol Corporate Standard · Scope 1, 2 og 3"
          />

          {/* Scope overview boxes */}
          <View style={[s.kpiGrid, { marginBottom: 16 }]}>
            {[
              { label: "Scope 1\nDirekte emissioner",  val: scope1Co2Tonnes,  color: C.orange, sub: "Forbr., natur gas, diesel" },
              { label: "Scope 2\nIndkøbt energi",       val: scope2Co2Tonnes,  color: C.amber,  sub: "El, fjernvarme" },
              { label: "Scope 3\nVærdikæde",            val: scope3Co2Tonnes,  color: C.violet, sub: "Rejser, indkøb (frivillig)" },
            ].map((sc, i) => (
              <View key={i} style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: sc.color }]}>
                <Text style={[s.kpiNum, { fontSize: 18, color: sc.color }]}>{sc.val.toFixed(2)}</Text>
                <Text style={[s.kpiLabel, { marginBottom: 4 }]}>{sc.label}</Text>
                <Text style={[s.small, { textAlign: "center" }]}>{sc.sub}</Text>
              </View>
            ))}
          </View>

          {/* Bar chart */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Emissioner pr. scope (tCO₂e)</Text>
            <ScopeBar label="Scope 1 — Direkte"     tonnes={scope1Co2Tonnes} max={maxCo2} color={C.orange} />
            <ScopeBar label="Scope 2 — Energi"      tonnes={scope2Co2Tonnes} max={maxCo2} color={C.amber}  />
            <ScopeBar label="Scope 3 — Værdikæde"   tonnes={scope3Co2Tonnes} max={maxCo2} color={C.violet} />
            <View style={[s.divider, { marginVertical: 10 }]} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.body, { fontWeight: 700 }]}>Total</Text>
              <Text style={[s.body, { fontWeight: 800, color: C.green }]}>{totalCo2Tonnes.toFixed(2)} tCO₂e</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Analyse og vurdering</Text>
            <Text style={s.bodyMd}>{co2Narrative || `${companyName}s samlede GHG-aftryk for ${year} udgør ${totalCo2Tonnes.toFixed(1)} tCO₂e.`}</Text>
          </View>

          <View style={[s.cardHighlight]}>
            <Text style={s.sectionBadge}>Emissionsfaktorer og metode</Text>
            <Text style={s.body}>
              El (DK): 0,136 kg CO₂e/kWh · Kilde: Energistyrelsen 2024 {"\n"}
              Fjernvarme (DK): 0,066 kg CO₂e/kWh · Kilde: DEA 2024 {"\n"}
              Naturgas: 2,04 kg CO₂e/m³ · Kilde: DEFRA 2024 {"\n"}
              Transport (fly, bil, tog): DEFRA 2024 {"\n"}
              Opgørelsesmetode: GHG Protocol Corporate Standard (WRI/WBCSD)
            </Text>
          </View>
        </View>
        <PageFooter page="Side 4" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 5: ESG + Social + Governance ────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="B2–B11 — ESG Præstation" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="ESG · Samlet præstationsoversigt"
            title="Miljø, Sociale & Governance"
          />

          {/* 3 dimension cards side by side */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {[
              { key: "E", label: "Miljø", score: esgScoreE, max: 40, color: C.emerald, lightBg: "#d1fae5",
                desc: "Inkluderer energiforbrug, CO₂-emissioner, affald og vandudtræk. Scorer iht. VSME B3–B7." },
              { key: "S", label: "Sociale", score: esgScoreS, max: 35, color: C.blue, lightBg: "#e0f2fe",
                desc: "Medarbejderforhold, arbejdsmiljø, diversitet, uddannelse og løn. VSME B8–B10." },
              { key: "G", label: "Ledelse", score: esgScoreG, max: 25, color: C.violet, lightBg: "#ede9fe",
                desc: "ESG-politik, adfærdskodeks, anti-korruption, GDPR og bestyrelsesansvar. VSME B2/B11." },
            ].map(dim => (
              <View key={dim.key} style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, overflow: "hidden" }}>
                <View style={{ backgroundColor: dim.lightBg, padding: 12, alignItems: "center" }}>
                  <ScoreRingSvg score={dim.score} max={dim.max} color={dim.color} size={72} />
                  <Text style={{ fontSize: 18, fontWeight: 800, color: dim.color, marginTop: 4 }}>
                    {dim.score.toFixed(1)}
                    <Text style={{ fontSize: 10, color: C.gray400, fontWeight: 400 }}> / {dim.max}</Text>
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 700, color: dim.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{dim.label}</Text>
                </View>
                <View style={{ padding: 10, backgroundColor: C.white }}>
                  <Text style={[s.body, { fontSize: 8, lineHeight: 1.5 }]}>{dim.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>ESG-vurdering og analyse</Text>
            <Text style={s.bodyMd}>{esgNarrative || `${companyName} har opnået en samlet ESG-score på ${esgScoreTotal.toFixed(1)} / 100 (Rating: ${esgRating}). Der er identificeret ${identifiedGaps.length} forbedringsområder.`}</Text>
          </View>
        </View>
        <PageFooter page="Side 5" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 6: Gaps ─────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Identificerede mangler" />
        <View style={s.pageBody}>
          <SectionHeading
            badge={`${identifiedGaps.length} Mangler identificeret`}
            title="Identificerede mangler & prioriteter"
            sub="Baseret på VSME Basic Module krav og best practice"
          />

          <View style={s.card}>
            <Text style={[s.cardTitle, { marginBottom: 12 }]}>
              {identifiedGaps.length} identificerede mangler
            </Text>
            {gapList.map((gap, i) => {
              // Categorize gap for dot color
              const l = gap.toLowerCase()
              const isE = l.includes("electricity") || l.includes("energy") || l.includes("waste") || l.includes("renewable") || l.includes("emission")
              const isS = l.includes("health") || l.includes("safety") || l.includes("training") || l.includes("employee") || l.includes("diversity")
              const dotColor = isE ? C.emerald : isS ? C.blue : C.violet
              return (
                <View key={i} style={[s.gapRow, i === gapList.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <View style={[s.gapDot, { backgroundColor: dotColor }]} />
                  <Text style={[s.body, { flex: 1 }]}>{gap}</Text>
                </View>
              )
            })}
            {identifiedGaps.length > 14 && (
              <Text style={[s.caption, { marginTop: 8 }]}>
                + {identifiedGaps.length - 14} yderligere mangler — se fuld rapport online
              </Text>
            )}
          </View>
        </View>
        <PageFooter page="Side 6" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 7+: Recommendations ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Anbefalede tiltag" />
        <View style={s.pageBody}>
          <SectionHeading
            badge={`${recommendations.length} Anbefalinger · Potentiel score-gevinst: +${recommendations.reduce((s, r) => s + (r.score_improvement_pts || 0), 0)} pt`}
            title="Anbefalede tiltag og forbedringer"
            sub="SMART-mål, handlingstrin og estimeret effekt"
          />
          {recsHigh.map(rec => <RecCard key={rec.id} rec={rec} />)}
        </View>
        <PageFooter page="Side 7" companyName={companyName} year={year} />
      </Page>

      {recsOthers.length > 0 && (
        <Page size="A4" style={s.page}>
          <PageHeader companyName={companyName} section="Anbefalede tiltag (fortsat)" />
          <View style={s.pageBody}>
            <SectionHeading badge="Yderligere anbefalinger" title="Middel og lav prioritet" />
            {recsOthers.map(rec => <RecCard key={rec.id} rec={rec} />)}
          </View>
          <PageFooter page="Side 8" companyName={companyName} year={year} />
        </Page>
      )}

      {/* ── PAGE: 12-month roadmap ────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="12-måneders handlingsplan" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="12-måneders handlingsplan"
            title="Prioriterede tiltag pr. kvartal"
            sub="Start med Q1 quick wins — se forventet score-gevinst pr. kvartal"
          />

          <View style={s.qGrid}>
            {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
              const qColor = qColors[q]
              const qLabel = qLabels[q]
              const qRecs  = recommendations.filter(r => r.timeline === q)
              const qPts   = qRecs.reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
              return (
                <View key={q} style={s.qCol}>
                  <View style={[s.qHead, { backgroundColor: qColor }]}>
                    <Text style={s.qHeadTitle}>{qLabel.split("\n")[0]}</Text>
                    <Text style={s.qHeadSub}>{qLabel.split("\n")[1]}</Text>
                  </View>
                  <View style={s.qBody}>
                    {qRecs.length === 0 ? (
                      <Text style={[s.small, { textAlign: "center", paddingVertical: 10 }]}>—</Text>
                    ) : (
                      qRecs.map((rec, i) => (
                        <View key={i} style={s.qItem}>
                          <View style={[s.qDot, { backgroundColor: qColor }]} />
                          <Text style={s.qItemText}>{rec.title}</Text>
                        </View>
                      ))
                    )}
                  </View>
                  {qPts > 0 && (
                    <View style={s.qTotal}>
                      <Text style={[s.qTotalText, { color: qColor }]}>+{qPts} pt</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>

          {/* Score accumulation visual */}
          <View style={[s.card, { marginTop: 16 }]}>
            <Text style={s.cardTitle}>Forventet score-fremgang</Text>
            <View style={{ height: 12, flexDirection: "row", borderRadius: 6, overflow: "hidden" }}>
              {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                const total = recommendations.reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
                const qPts  = recommendations.filter(r => r.timeline === q).reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
                const pct   = total > 0 ? (qPts / total) * 100 : 25
                return (
                  <View key={q} style={{ flex: pct, backgroundColor: qColors[q], minWidth: pct > 0 ? 2 : 0 }} />
                )
              })}
            </View>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                const qPts = recommendations.filter(r => r.timeline === q).reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
                return (
                  <View key={q} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, color: qColors[q], fontWeight: 700 }}>+{qPts} pt</Text>
                    <Text style={[s.small, { textAlign: "center" }]}>{qLabels[q].split("\n")[1]}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
        <PageFooter page="Side 9" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE: Disclaimer ──────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Ansvarsfraskrivelse" />
        <View style={s.pageBody}>
          <SectionHeading badge="Metode & Ansvarsfraskrivelse" title="Beregningsgrundlag og begrænsninger" />

          <View style={s.card}>
            <Text style={s.cardTitle}>Emissionsfaktorer og datakilder</Text>
            <Text style={[s.bodyMd, { marginBottom: 8 }]}>
              Rapporten anvender følgende emissionsfaktorer og datakilder:
            </Text>
            {[
              ["El (DK)",            "0,136 kg CO₂e/kWh",   "Energistyrelsen 2024"],
              ["Fjernvarme (DK)",     "0,066 kg CO₂e/kWh",   "DEA 2024"],
              ["Naturgas",           "2,04 kg CO₂e/m³",     "DEFRA 2024"],
              ["Diesel",             "2,68 kg CO₂e/l",      "DEFRA 2024"],
              ["Benzin",             "2,31 kg CO₂e/l",      "DEFRA 2024"],
              ["Kortdistancefly",    "0,255 kg CO₂e/km/pax","DEFRA 2024"],
              ["Langdistancefly",    "0,195 kg CO₂e/km/pax","DEFRA 2024"],
            ].map(([cat, val, src], i) => (
              <View key={i} style={[s.scopeRow, { marginBottom: 6 }]}>
                <Text style={{ width: 120, fontSize: 8, fontWeight: 700, color: C.gray700 }}>{cat}</Text>
                <Text style={{ flex: 1, fontSize: 8, color: C.gray600 }}>{val}</Text>
                <Text style={{ width: 120, fontSize: 8, color: C.gray400 }}>{src}</Text>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Ansvarsfraskrivelse</Text>
            <Text style={s.bodyMd}>{disclaimer}</Text>
          </View>

          <View style={[s.cardHighlight, { borderLeftWidth: 3, borderLeftColor: C.green }]}>
            <Text style={s.sectionBadge}>Standardreferencer</Text>
            <Text style={s.body}>
              · VSME Basic Module — EFRAG, 2024{"\n"}
              · GHG Protocol Corporate Standard — WRI/WBCSD, 2015{"\n"}
              · IPCC AR6 — Global Warming Potentials{"\n"}
              · EU Taksonomiforordning (EU) 2020/852
            </Text>
          </View>
        </View>
        <PageFooter page="Side 10" companyName={companyName} year={year} />
      </Page>

    </Document>
  )
}
