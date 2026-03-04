/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReportPdf.tsx — VSME ESG Report PDF
 * Safe subset of @react-pdf/renderer:
 *  - No SVG (ScoreRingSvg removed, DimBar/ScoreBar used instead)
 *  - No `gap` shorthand — use marginRight on items instead
 *  - fontWeight max 700 (Helvetica only supports 400 and 700)
 *  - No textTransform, no letterSpacing
 *  - No rgba() or 8-digit hex colors — solid 6-digit hex only
 */
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer"

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  green:       "#16a34a",
  greenLight:  "#dcfce7",
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
  sidebarMid:  "#1a2f40",
  sidebarDark: "#0a1825",
}

const RATING_COLOR: Record<string, string> = {
  A: C.emerald, B: C.green, C: C.amber, D: C.orange, E: C.red,
}
const RATING_LABEL: Record<string, string> = {
  A: "Fremragende", B: "Godt", C: "Middel", D: "Under middel", E: "Kritisk",
}
const PRIO_COLOR:  Record<string, string> = { high: C.red,     medium: C.amber,     low: C.green     }
const PRIO_BG:     Record<string, string> = { high: C.redLight, medium: C.amberLight, low: C.greenLight }
const PRIO_LABEL:  Record<string, string> = { high: "Hoj",     medium: "Middel",    low: "Lav"       }
const Q_COLOR:     Record<string, string> = { Q1: "#22c55e", Q2: "#0284c7", Q3: "#7c3aed", Q4: "#f97316" }
const Q_SUB:       Record<string, string> = { Q1: "Jan-Mar", Q2: "Apr-Jun", Q3: "Jul-Sep", Q4: "Okt-Dec" }
const Q_TITLE:     Record<string, string> = { Q1: "Kvartal 1", Q2: "Kvartal 2", Q3: "Kvartal 3", Q4: "Kvartal 4" }
const DIM_COLOR:   Record<string, string> = { E: C.emerald, S: C.blue, G: C.violet }
const DIM_BG:      Record<string, string> = { E: C.greenLight, S: C.blueLight, G: C.violetLight }
const DIM_LABEL:   Record<string, string> = { E: "Miljo", S: "Sociale", G: "Ledelse" }

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray700,
    backgroundColor: C.white,
    paddingBottom: 48,
  },
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: C.sidebar,
  },
  coverTop: {
    flex: 1,
    padding: 56,
    justifyContent: "space-between",
  },
  coverBrand: {
    fontSize: 10,
    fontWeight: 600,
    color: C.green,
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  coverSub: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 32,
  },
  coverRatingBox: {
    backgroundColor: C.sidebarMid,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  coverRatingNum: {
    fontSize: 48,
    fontWeight: 700,
    marginBottom: 4,
  },
  coverRatingLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 400,
  },
  coverMeta: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  coverBottom: {
    backgroundColor: C.sidebarDark,
    padding: 24,
    paddingLeft: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverBottomText: {
    fontSize: 9,
    color: "#475569",
  },
  pageHeader: {
    backgroundColor: C.green,
    height: 4,
  },
  pageSubHeader: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    backgroundColor: C.gray50,
  },
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
  },
  pageFooterText: {
    fontSize: 7,
    color: C.gray400,
  },
  pageBody: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },
  sectionBadge: {
    fontSize: 7,
    fontWeight: 700,
    color: C.green,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: C.gray900,
    marginBottom: 12,
  },
  sectionSub: {
    fontSize: 9,
    color: C.gray400,
    marginBottom: 14,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.gray900,
    marginBottom: 6,
  },
  cardHighlight: {
    backgroundColor: C.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  body: {
    fontSize: 9,
    color: C.gray700,
    lineHeight: 1.6,
  },
  bodyMd: {
    fontSize: 9,
    color: C.gray700,
    lineHeight: 1.65,
  },
  small: {
    fontSize: 8,
    color: C.gray400,
  },
  caption: {
    fontSize: 7,
    color: C.gray400,
    fontStyle: "italic",
  },
  // KPI grid — no gap; use marginRight on kpiBox, kpiBoxLast for the final item
  kpiGrid: {
    flexDirection: "row",
    marginBottom: 20,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    padding: 14,
    alignItems: "center",
    marginRight: 10,
  },
  kpiBoxLast: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    padding: 14,
    alignItems: "center",
  },
  kpiNum: {
    fontSize: 26,
    fontWeight: 700,
    color: C.gray900,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 7,
    color: C.gray400,
    fontWeight: 600,
    textAlign: "center",
  },
  scopeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scopeLabel: {
    width: 120,
    fontSize: 8,
    color: C.gray700,
    fontWeight: 600,
  },
  scopeTrack: {
    flex: 1,
    height: 7,
    backgroundColor: C.gray100,
    borderRadius: 4,
    overflow: "hidden",
  },
  scopeFill: {
    height: 7,
    borderRadius: 4,
  },
  scopeValue: {
    width: 46,
    fontSize: 8,
    color: C.gray700,
    fontWeight: 700,
    textAlign: "right",
  },
  recCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    marginBottom: 10,
  },
  recHeader: {
    padding: 10,
    paddingLeft: 12,
  },
  recTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.gray900,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 8,
    color: C.gray600,
    lineHeight: 1.5,
  },
  recBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recSteps: {
    backgroundColor: C.gray50,
    padding: 10,
    paddingLeft: 14,
  },
  recStepRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  recStepNum: {
    width: 14,
    height: 14,
    backgroundColor: C.green,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
    marginRight: 8,
  },
  recStepNumTxt: {
    fontSize: 7,
    color: C.white,
    fontWeight: 700,
  },
  recStepTxt: {
    fontSize: 8,
    color: C.gray700,
    lineHeight: 1.5,
    flex: 1,
  },
  recSmartBox: {
    backgroundColor: C.greenLight,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  recSmartLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.emerald,
    marginBottom: 2,
  },
  recSmartTxt: {
    fontSize: 8,
    color: "#166534",
    lineHeight: 1.4,
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  gapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
    marginRight: 10,
    flexShrink: 0,
  },
  // Quarterly grid — no gap; use marginRight on qCol, qColLast for the final item
  qGrid: {
    flexDirection: "row",
  },
  qCol: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    marginRight: 8,
    overflow: "hidden",
  },
  qColLast: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    overflow: "hidden",
  },
  qHead: {
    padding: 8,
    paddingHorizontal: 10,
  },
  qHeadTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: C.white,
    marginBottom: 1,
  },
  qHeadSub: {
    fontSize: 7,
    color: "#dddddd",
  },
  qBody: {
    padding: 8,
    backgroundColor: C.white,
  },
  qItemRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  qDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
    flexShrink: 0,
    marginRight: 5,
  },
  qItemText: {
    fontSize: 7,
    color: C.gray700,
    lineHeight: 1.4,
    flex: 1,
  },
  qTotal: {
    backgroundColor: C.gray50,
    padding: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: C.gray100,
  },
  qTotalText: {
    fontSize: 7,
    fontWeight: 700,
    textAlign: "right",
  },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tocTitle: {
    fontSize: 10,
    color: C.gray700,
  },
  tocPage: {
    fontSize: 8,
    color: C.gray400,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    marginVertical: 16,
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripMd(text: string): string {
  if (!text) return ""
  return text
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim()
}

function PageHeader({ companyName, section }: { companyName: string; section: string }) {
  return (
    <>
      <View style={s.pageHeader} />
      <View style={s.pageSubHeader}>
        <Text style={{ fontSize: 8, color: C.gray400, fontWeight: 600 }}>
          {companyName} · VSME Basic Module ESG-rapport
        </Text>
        <Text style={{ fontSize: 8, color: C.green, fontWeight: 700 }}>{section}</Text>
      </View>
    </>
  )
}

function PageFooter({ page, companyName, year }: { page: string; companyName: string; year: number }) {
  return (
    <View style={s.pageFooter}>
      <Text style={s.pageFooterText}>
        {year} {companyName} · ESG Copilot AI · iht. VSME Basic Module (EFRAG 2024)
      </Text>
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

/** Simple View-based horizontal progress bar */
function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((score / max) * 100, 100) : 0
  return (
    <View style={{ height: 6, backgroundColor: C.gray100, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${pct}%` }} />
    </View>
  )
}

function ScopeBar({ label, tonnes, max, color }: { label: string; tonnes: number; max: number; color: string }) {
  const safe = tonnes ?? 0
  const pct  = max > 0 ? Math.min((safe / max) * 100, 100) : 0
  return (
    <View style={s.scopeRow}>
      <Text style={s.scopeLabel}>{label}</Text>
      <View style={s.scopeTrack}>
        <View style={[s.scopeFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.scopeValue}>{safe.toFixed(2)} t</Text>
    </View>
  )
}

function DimBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const safe = score ?? 0
  const pct  = Math.min((safe / max) * 100, 100)
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: 700, color: C.gray700 }}>{label}</Text>
        <Text style={{ fontSize: 9, fontWeight: 700, color }}>{safe.toFixed(1)} / {max}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: C.gray100, borderRadius: 4, overflow: "hidden" }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${pct}%` }} />
      </View>
    </View>
  )
}

type Rec = {
  id: string; title: string; description: string; effort: string; category: string;
  priority: string; timeline: string; smart_goal: string; action_steps: string[];
  score_improvement_pts: number; estimated_co2_reduction_pct: number; kpis?: string[];
}

function RecCard({ rec, index }: { rec: Rec; index: number }) {
  const prioColor = PRIO_COLOR[rec.priority] || C.green
  const prioBg    = PRIO_BG[rec.priority]    || C.greenLight
  const prioLabel = PRIO_LABEL[rec.priority] || "Lav"
  const dimColor  = DIM_COLOR[rec.category]  || C.green
  const dimBg     = DIM_BG[rec.category]     || C.greenLight
  const dimLabel  = DIM_LABEL[rec.category]  || rec.category
  const tlColor   = Q_COLOR[rec.timeline]    || C.green

  return (
    <View style={s.recCard}>
      <View style={[s.recHeader, { borderLeftWidth: 3, borderLeftColor: dimColor }]}>
        {/* Top row: badges + impact numbers */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.green, alignItems: "center", justifyContent: "center", marginRight: 5 }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: C.white }}>{index + 1}</Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: dimBg, marginRight: 4 }]}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: dimColor }}>{dimLabel}</Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: prioBg, marginRight: 4 }]}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: prioColor }}>{prioLabel}</Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: C.gray100 }]}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: tlColor }}>{rec.timeline}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {(rec.score_improvement_pts ?? 0) > 0 && (
              <Text style={{ fontSize: 8, fontWeight: 700, color: C.green, marginRight: 8 }}>
                +{(rec.score_improvement_pts ?? 0).toFixed(1)} pt
              </Text>
            )}
            {(rec.estimated_co2_reduction_pct ?? 0) > 0 && (
              <Text style={{ fontSize: 8, fontWeight: 700, color: C.emerald }}>
                -{rec.estimated_co2_reduction_pct}% CO2
              </Text>
            )}
          </View>
        </View>
        <Text style={s.recTitle}>{rec.title}</Text>
        {rec.description && <Text style={s.recDesc}>{rec.description}</Text>}
        {rec.smart_goal && (
          <View style={s.recSmartBox}>
            <Text style={s.recSmartLabel}>SMART-mal</Text>
            <Text style={s.recSmartTxt}>{rec.smart_goal}</Text>
          </View>
        )}
        {rec.kpis && rec.kpis.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {rec.kpis.slice(0, 4).map((kpi, i) => (
              <View key={i} style={{ backgroundColor: C.gray100, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4, marginBottom: 3 }}>
                <Text style={{ fontSize: 7, color: C.gray600 }}>{kpi}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {rec.action_steps && rec.action_steps.length > 0 && (
        <View style={s.recSteps}>
          <Text style={{ fontSize: 7, fontWeight: 700, color: C.gray400, marginBottom: 6 }}>Handlingstrin</Text>
          {rec.action_steps.slice(0, 5).map((step, i) => (
            <View key={i} style={s.recStepRow}>
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
    companyName, reportYear, reportDate, esgRating,
    executiveSummary, co2Narrative, esgNarrative, disclaimer,
    industryCode, countryCode,
  } = props

  const esgScoreTotal      = props.esgScoreTotal      ?? 0
  const esgScoreE          = props.esgScoreE          ?? 0
  const esgScoreS          = props.esgScoreS          ?? 0
  const esgScoreG          = props.esgScoreG          ?? 0
  const industryPercentile = props.industryPercentile  ?? 0
  const totalCo2Tonnes     = props.totalCo2Tonnes     ?? 0
  const scope1Co2Tonnes    = props.scope1Co2Tonnes    ?? 0
  const scope2Co2Tonnes    = props.scope2Co2Tonnes    ?? 0
  const scope3Co2Tonnes    = props.scope3Co2Tonnes    ?? 0
  const identifiedGaps     = props.identifiedGaps     ?? []
  const recommendations    = props.recommendations    ?? []

  const rColor  = RATING_COLOR[esgRating] || C.gray600
  const year    = reportYear
  const dateStr = reportDate
    ? new Date(reportDate).toLocaleDateString("da-DK", { year: "numeric", month: "long", day: "numeric" })
    : ""
  const maxCo2 = Math.max(scope1Co2Tonnes, scope2Co2Tonnes, scope3Co2Tonnes, 0.01)

  const gapList    = identifiedGaps.slice(0, 14)
  const recsHigh   = recommendations.filter(r => r.priority === "high").slice(0, 5)
  const recsOthers = recommendations.filter(r => r.priority !== "high").slice(0, 5)

  return (
    <Document
      title={`${companyName} VSME ESG-rapport ${year}`}
      author="ESG Copilot"
      subject="VSME Basic Module (EFRAG 2024)"
    >

      {/* ── PAGE 1: Cover ──────────────────────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          <View>
            <Text style={s.coverBrand}>ESG Copilot · VSME Basic Module · EFRAG 2024</Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 48 }}>
              {industryCode || "Virksomhed"} · {countryCode || "DK"}
            </Text>
            <View style={[s.coverRatingBox, { borderLeftWidth: 4, borderLeftColor: rColor }]}>
              <Text style={[s.coverRatingNum, { color: rColor }]}>{esgRating}</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 4 }}>
                {RATING_LABEL[esgRating] || "ESG-vurdering"}
              </Text>
              <Text style={s.coverRatingLabel}>
                ESG Score: {esgScoreTotal.toFixed(1)} / 100  ·  {totalCo2Tonnes.toFixed(1)} tCO2e
              </Text>
              {industryPercentile > 0 && (
                <Text style={[s.coverRatingLabel, { marginTop: 4 }]}>
                  Bedre end {industryPercentile.toFixed(0)}% i branchen
                </Text>
              )}
            </View>
            <Text style={s.coverTitle}>{companyName}</Text>
            <Text style={s.coverSub}>VSME Baeredygtighedsrapport {year}</Text>
            <Text style={{ fontSize: 11, color: "#64748b" }}>iht. VSME Basic Module · EFRAG 2024 · GHG Protocol</Text>
          </View>
          <View>
            <Text style={s.coverMeta}>Genereret: {dateStr}</Text>
            <Text style={s.coverMeta}>Rapportperiode: {year} (1. jan - 31. dec)</Text>
          </View>
        </View>
        <View style={s.coverBottom}>
          <View>
            <Text style={[s.coverBottomText, { fontWeight: 700, color: "#94a3b8" }]}>ESG Copilot</Text>
            <Text style={s.coverBottomText}>AI-drevet VSME ESG-rapportering</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.coverBottomText}>esg-copilot-app.vercel.app</Text>
            <Text style={s.coverBottomText}>{dateStr}</Text>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2: ToC ────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Indholdsfortegnelse" />
        <View style={s.pageBody}>
          <SectionHeading badge="Indholdsfortegnelse" title="Oversigt over rapporten" />
          {[
            { num: "B1", title: "Ledelsesoversigt og virksomhedsprofil",           pg: 3 },
            { num: "B3", title: "Klimaaftryk og CO2-emissioner (Scope 1, 2, 3)",   pg: 4 },
            { num: "B2", title: "Samlet ESG-scorecard",                             pg: 5 },
            { num: "—",  title: "Identificerede mangler og compliance-gaps",        pg: 6 },
            { num: "—",  title: "Anbefalede tiltag — hoj prioritet",               pg: 7 },
            { num: "—",  title: "Anbefalede tiltag — middel og lav prioritet",     pg: 8 },
            { num: "—",  title: "12-maneders handlingsplan pr. kvartal",            pg: 9 },
            { num: "—",  title: "Emissionsfaktorer, metode og ansvarsfraskrivelse", pg: 10 },
          ].map((row, i) => (
            <View key={i} style={s.tocRow}>
              <View style={{ flexDirection: "row", flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: C.green, minWidth: 36, marginRight: 14 }}>{row.num}</Text>
                <Text style={s.tocTitle}>{row.title}</Text>
              </View>
              <Text style={s.tocPage}>{row.pg}</Text>
            </View>
          ))}
          <View style={[s.cardHighlight, { marginTop: 24 }]}>
            <Text style={[s.sectionBadge, { marginBottom: 6 }]}>Om denne rapport</Text>
            <Text style={s.bodyMd}>
              Rapporten er udarbejdet iht. VSME Basic Module (EFRAG, 2024) og daekker
              1. januar - 31. december {year}. CO2-beregninger folger GHG Protocol Corporate Standard
              med emissionsfaktorer fra Energistyrelsen 2024 (el, fjernvarme) og DEFRA 2024
              (braendstoffer, transport, fly).
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
          <View style={s.kpiGrid}>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: rColor }]}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: rColor, marginBottom: 4 }}>{esgRating}</Text>
              <ScoreBar score={esgScoreTotal} max={100} color={rColor} />
              <Text style={s.kpiLabel}>ESG Rating</Text>
            </View>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: C.green }]}>
              <Text style={s.kpiNum}>{esgScoreTotal.toFixed(1)}</Text>
              <Text style={s.kpiLabel}>Score / 100</Text>
            </View>
            <View style={[s.kpiBox, { borderTopWidth: 3, borderTopColor: C.blue }]}>
              <Text style={s.kpiNum}>{totalCo2Tonnes.toFixed(1)}</Text>
              <Text style={s.kpiLabel}>Total tCO2e</Text>
            </View>
            <View style={[s.kpiBoxLast, { borderTopWidth: 3, borderTopColor: C.violet }]}>
              <Text style={s.kpiNum}>{industryPercentile.toFixed(0)}</Text>
              <Text style={s.kpiLabel}>Branche-%il</Text>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Ledelsesresume (B1)</Text>
            <Text style={s.bodyMd}>
              {stripMd(executiveSummary) || `${companyName} har gennemfort VSME-baeredygtighedsrapportering for ${year}.`}
            </Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>ESG-scorefordeling pr. dimension</Text>
            <DimBar label="Miljo (E) — vaegt 40%"     score={esgScoreE} max={40} color={C.emerald} />
            <DimBar label="Sociale (S) — vaegt 35%"   score={esgScoreS} max={35} color={C.blue}    />
            <DimBar label="Lederskab (G) — vaegt 25%" score={esgScoreG} max={25} color={C.violet}  />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.gray100 }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: C.gray700 }}>Samlet ESG-score</Text>
              <Text style={{ fontSize: 9, fontWeight: 700, color: rColor }}>
                {esgScoreTotal.toFixed(1)} / 100 · Rating {esgRating}
              </Text>
            </View>
          </View>
        </View>
        <PageFooter page="Side 3" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 4: B3 CO₂ ────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="B3 — Energi og Klimaaftryk" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="B3 · Energi og drivhusgasemissioner"
            title={`GHG-opgorelse ${year} — ${totalCo2Tonnes.toFixed(2)} tCO2e`}
            sub="GHG Protocol Corporate Standard · Scope 1 (direkte), 2 (energi) og 3 (vaerdikjaede)"
          />
          <View style={s.kpiGrid}>
            {[
              { label: "Scope 1", sub: "Direkte emissioner",    val: scope1Co2Tonnes, color: C.orange },
              { label: "Scope 2", sub: "Indkobt energi",         val: scope2Co2Tonnes, color: C.amber  },
              { label: "Scope 3", sub: "Vaerdikjaede",           val: scope3Co2Tonnes, color: C.violet },
            ].map((sc, i) => {
              const pct = totalCo2Tonnes > 0 ? (sc.val / totalCo2Tonnes * 100).toFixed(0) : "0"
              return (
                <View key={i} style={[i < 2 ? s.kpiBox : s.kpiBoxLast, { borderTopWidth: 3, borderTopColor: sc.color }]}>
                  <Text style={[s.kpiNum, { fontSize: 18, color: sc.color }]}>{sc.val.toFixed(2)}</Text>
                  <Text style={[s.kpiLabel, { marginBottom: 2 }]}>{sc.label} tCO2e</Text>
                  <Text style={[s.small, { textAlign: "center" }]}>{sc.sub}</Text>
                  <Text style={{ fontSize: 8, color: sc.color, fontWeight: 700, marginTop: 2 }}>{pct}% af total</Text>
                </View>
              )
            })}
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Emissioner pr. scope (tCO2e)</Text>
            <ScopeBar label="Scope 1 — Direkte"     tonnes={scope1Co2Tonnes} max={maxCo2} color={C.orange} />
            <ScopeBar label="Scope 2 — Energi"      tonnes={scope2Co2Tonnes} max={maxCo2} color={C.amber}  />
            <ScopeBar label="Scope 3 — Vaerdikjaede" tonnes={scope3Co2Tonnes} max={maxCo2} color={C.violet} />
            <View style={[s.divider, { marginVertical: 10 }]} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.body, { fontWeight: 700 }]}>Total GHG-aftryk</Text>
              <Text style={[s.body, { fontWeight: 700, color: C.green }]}>{totalCo2Tonnes.toFixed(2)} tCO2e</Text>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Klimaanalyse (B3)</Text>
            <Text style={s.bodyMd}>
              {stripMd(co2Narrative) || `${companyName}s samlede GHG-aftryk for ${year} udgor ${totalCo2Tonnes.toFixed(2)} tCO2e.`}
            </Text>
          </View>
          <View style={s.cardHighlight}>
            <Text style={s.sectionBadge}>Emissionsfaktorer og metode</Text>
            <Text style={s.body}>
              El (DK): 0,136 kg CO2e/kWh · Energistyrelsen 2024 | Fjernvarme: 0,066 kg CO2e/kWh · DEA 2024{"\n"}
              Naturgas: 2,04 kg CO2e/m3 · DEFRA 2024 | Diesel: 2,68 kg CO2e/l · DEFRA 2024{"\n"}
              Transport/fly: DEFRA 2024 | Metode: GHG Protocol Corporate Standard
            </Text>
          </View>
        </View>
        <PageFooter page="Side 4" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 5: B2 ESG Scorecard ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="B2 — ESG Scorecard" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="B2 · Samlet ESG-praestation"
            title="Miljo, Sociale og Governance"
            sub="Scoringsvaegt: Miljo 40% · Sociale 35% · Governance 25% | Max 100 point"
          />
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            {[
              { key: "E", label: "Miljo",     score: esgScoreE, max: 40, color: C.emerald, bg: C.greenLight,
                desc: "Energiforbrug, CO2-emissioner, vedvarende energi, affald og vand. VSME B3-B7." },
              { key: "S", label: "Sociale",   score: esgScoreS, max: 35, color: C.blue, bg: C.blueLight,
                desc: "Medarbejderforhold, arbejdsmiljo, uddannelse, diversitet og lon. VSME B8-B10." },
              { key: "G", label: "Lederskab", score: esgScoreG, max: 25, color: C.violet, bg: C.violetLight,
                desc: "ESG-politik, adfaerdskodeks, anti-korruption, GDPR og bestyrelsesansvar. VSME B2/B11." },
            ].map((dim, i) => (
              <View key={dim.key} style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, marginRight: i < 2 ? 10 : 0 }}>
                <View style={{ backgroundColor: dim.bg, padding: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: 700, color: dim.color, marginBottom: 4 }}>
                    {dim.score.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 9, color: C.gray400, marginBottom: 6 }}>/ {dim.max} point</Text>
                  <ScoreBar score={dim.score} max={dim.max} color={dim.color} />
                  <Text style={{ fontSize: 9, fontWeight: 700, color: dim.color }}>{dim.label}</Text>
                </View>
                <View style={{ padding: 10, backgroundColor: C.white }}>
                  <Text style={[s.body, { fontSize: 8, lineHeight: 1.5 }]}>{dim.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>ESG-vurdering og analyse</Text>
            <Text style={s.bodyMd}>
              {stripMd(esgNarrative) || `${companyName} opnaede ESG-score ${esgScoreTotal.toFixed(1)}/100 (Rating: ${esgRating}).`}
            </Text>
          </View>
        </View>
        <PageFooter page="Side 5" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 6: Gaps ─────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Identificerede mangler" />
        <View style={s.pageBody}>
          <SectionHeading
            badge={`${identifiedGaps.length} mangler identificeret`}
            title="Compliance-gaps og forbedringsomrader"
            sub="Baseret pa VSME Basic Module krav — prioriteret efter ESG-pavirkning"
          />
          <View style={s.card}>
            <Text style={[s.cardTitle, { marginBottom: 12 }]}>{identifiedGaps.length} identificerede mangler</Text>
            {gapList.map((gap, i) => {
              const l   = gap.toLowerCase()
              const isE = l.includes("energy") || l.includes("waste") || l.includes("emission") || l.includes("co2") || l.includes("energi")
              const isS = l.includes("health") || l.includes("safety") || l.includes("training") || l.includes("employee") || l.includes("medarbejder")
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
          <View style={{ flexDirection: "row" }}>
            {[{ color: C.emerald, label: "Miljo (E)" }, { color: C.blue, label: "Sociale (S)" }, { color: C.violet, label: "Governance (G)" }].map(({ color, label }) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 5 }} />
                <Text style={s.small}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <PageFooter page="Side 6" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 7: Recommendations (high priority) ───────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Anbefalede tiltag — hoj prioritet" />
        <View style={s.pageBody}>
          <SectionHeading
            badge={`${recommendations.length} anbefalinger · +${recommendations.reduce((acc, r) => acc + (r.score_improvement_pts ?? 0), 0).toFixed(0)} pt potentiale`}
            title="Anbefalede tiltag og SMART-mal"
            sub="Hoj prioritet — implementer i Q1-Q2 for hurtigste ESG-gevinst"
          />
          {recsHigh.map((rec, i) => <RecCard key={rec.id || String(i)} rec={rec} index={i} />)}
        </View>
        <PageFooter page="Side 7" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 8: Recommendations (medium + low priority) ──────────────── */}
      {recsOthers.length > 0 && (
        <Page size="A4" style={s.page}>
          <PageHeader companyName={companyName} section="Anbefalede tiltag — middel/lav prioritet" />
          <View style={s.pageBody}>
            <SectionHeading
              badge="Middel og lav prioritet"
              title="Yderligere forbedringstiltag"
              sub="Implementer i Q2-Q4 som supplement til hoj-prioritetstiltagene"
            />
            {recsOthers.map((rec, i) => <RecCard key={rec.id || String(i)} rec={rec} index={recsHigh.length + i} />)}
          </View>
          <PageFooter page="Side 8" companyName={companyName} year={year} />
        </Page>
      )}

      {/* ── PAGE 9: 12-month roadmap ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="12-maneders handlingsplan" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="12-maneders handlingsplan"
            title="Prioriterede tiltag pr. kvartal"
            sub={`Nuvaerende score: ${esgScoreTotal.toFixed(1)}/100 — Start med Q1 for hurtigste gevinst`}
          />
          <View style={s.qGrid}>
            {(["Q1", "Q2", "Q3", "Q4"] as const).map((q, qi) => {
              const qColor = Q_COLOR[q]
              const qRecs  = recommendations.filter(r => r.timeline === q)
              const qPts   = qRecs.reduce((acc, r) => acc + (r.score_improvement_pts ?? 0), 0)
              return (
                <View key={q} style={qi < 3 ? s.qCol : s.qColLast}>
                  <View style={[s.qHead, { backgroundColor: qColor }]}>
                    <Text style={s.qHeadTitle}>{Q_TITLE[q]}</Text>
                    <Text style={s.qHeadSub}>{Q_SUB[q]}</Text>
                  </View>
                  <View style={s.qBody}>
                    {qRecs.length === 0
                      ? <Text style={[s.small, { textAlign: "center", paddingVertical: 10 }]}>—</Text>
                      : qRecs.map((rec, i) => (
                          <View key={i} style={s.qItemRow}>
                            <View style={[s.qDot, { backgroundColor: qColor }]} />
                            <Text style={s.qItemText}>{rec.title}</Text>
                          </View>
                        ))
                    }
                  </View>
                  {qPts > 0 && (
                    <View style={s.qTotal}>
                      <Text style={[s.qTotalText, { color: qColor }]}>+{qPts.toFixed(0)} pt</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>

          <View style={[s.card, { marginTop: 16 }]}>
            <Text style={s.cardTitle}>Forventet score-fremgang over 12 maneder</Text>
            <View style={{ height: 12, flexDirection: "row", borderRadius: 6, overflow: "hidden" }}>
              {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                const total = recommendations.reduce((acc, r) => acc + (r.score_improvement_pts ?? 0), 0)
                const qPts  = recommendations.filter(r => r.timeline === q).reduce((acc, r) => acc + (r.score_improvement_pts ?? 0), 0)
                const pct   = total > 0 ? (qPts / total) * 100 : 25
                return <View key={q} style={{ flex: pct, backgroundColor: Q_COLOR[q], minWidth: pct > 0 ? 2 : 0 }} />
              })}
            </View>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                const qPts = recommendations.filter(r => r.timeline === q).reduce((acc, r) => acc + (r.score_improvement_pts ?? 0), 0)
                return (
                  <View key={q} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: Q_COLOR[q], fontWeight: 700 }}>+{qPts.toFixed(0)} pt</Text>
                    <Text style={[s.small, { textAlign: "center" }]}>{Q_SUB[q]}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
        <PageFooter page="Side 9" companyName={companyName} year={year} />
      </Page>

      {/* ── PAGE 10: Disclaimer ───────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageHeader companyName={companyName} section="Metode og ansvarsfraskrivelse" />
        <View style={s.pageBody}>
          <SectionHeading
            badge="Metode og Ansvarsfraskrivelse"
            title="Beregningsgrundlag, emissionsfaktorer og begraensninger"
          />
          <View style={s.card}>
            <Text style={s.cardTitle}>Emissionsfaktorer og datakilder</Text>
            {[
              ["El (DK)",             "0,136 kg CO2e/kWh",    "Energistyrelsen 2024"],
              ["Fjernvarme (DK)",     "0,066 kg CO2e/kWh",    "DEA 2024"],
              ["Naturgas",            "2,04 kg CO2e/m3",      "DEFRA 2024"],
              ["Diesel",              "2,68 kg CO2e/l",       "DEFRA 2024"],
              ["Benzin",              "2,31 kg CO2e/l",       "DEFRA 2024"],
              ["Kortdistancefly",     "0,255 kg CO2e/km/pax", "DEFRA 2024"],
              ["Langdistancefly",     "0,195 kg CO2e/km/pax", "DEFRA 2024"],
              ["Firmabiler (diesel)", "0,171 kg CO2e/km",     "DEFRA 2024"],
            ].map(([cat, val, src], i) => (
              <View key={i} style={[s.scopeRow, { marginBottom: 6 }]}>
                <Text style={{ width: 130, fontSize: 8, fontWeight: 700, color: C.gray700 }}>{cat}</Text>
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
            <Text style={s.sectionBadge}>Standardreferencer og metode</Text>
            <Text style={s.body}>
              · VSME Basic Module — EFRAG, 2024{"\n"}
              · GHG Protocol Corporate Standard — WRI/WBCSD, 2015{"\n"}
              · IPCC AR6 — Global Warming Potentials (GWP100){"\n"}
              · EU Taksonomiforordning (EU) 2020/852{"\n"}
              · CSRD/ESRS — indfasning 2024-2028
            </Text>
          </View>
        </View>
        <PageFooter page="Side 10" companyName={companyName} year={year} />
      </Page>

    </Document>
  )
}
