/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReportPdf.tsx — VSME ESG Report PDF
 * Design: Fredensborg Kommune ESG-rapport 2025 style
 * Safe react-pdf subset:
 *  - No SVG
 *  - No `gap` shorthand — use marginRight + Last variants
 *  - fontWeight max 700 (Helvetica only supports 400 and 700)
 *  - No textTransform, no letterSpacing
 *  - No rgba() or 8-digit hex — solid 6-digit hex only
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  eColor:    "#5b8fa8",
  eLightBg:  "#eaf3f7",
  sColor:    "#c49a1b",
  sLightBg:  "#fdf5e0",
  gColor:    "#19afc1",
  gLightBg:  "#e0f7fa",
  dark:      "#2c3a45",
  darkMid:   "#38474f",
  darkLight: "#4a5f6b",
  darkText:  "#b0c4cb",
  darkSub:   "#7a9aa8",
  white:     "#ffffff",
  gray50:    "#f8fafc",
  gray100:   "#f1f5f9",
  gray200:   "#e2e8f0",
  gray300:   "#cbd5e1",
  gray400:   "#94a3b8",
  gray500:   "#64748b",
  gray600:   "#475569",
  gray700:   "#334155",
  gray900:   "#0f172a",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  amber:     "#d97706",
  amberLight:"#fef3c7",
  green:     "#16a34a",
  greenLight:"#dcfce7",
}

const DIM_COLOR:  Record<string, string> = { E: C.eColor,    S: C.sColor,    G: C.gColor    }
const DIM_BG:     Record<string, string> = { E: C.eLightBg,  S: C.sLightBg,  G: C.gLightBg  }
const DIM_FULL:   Record<string, string> = { E: "Miljomassige forhold", S: "Sociale forhold", G: "Ledelse og governance" }
const PRIO_COLOR: Record<string, string> = { high: C.red,       medium: C.amber,       low: C.green       }
const PRIO_BG:    Record<string, string> = { high: C.redLight,   medium: C.amberLight,   low: C.greenLight   }
const PRIO_LABEL: Record<string, string> = { high: "HOJ",       medium: "MIDDEL",      low: "LAV"         }
const Q_COLOR:    Record<string, string> = { Q1: "#22c55e", Q2: "#0284c7", Q3: "#7c3aed", Q4: "#f97316" }
const Q_MONTHS:   Record<string, string> = { Q1: "Jan-Mar", Q2: "Apr-Jun", Q3: "Jul-Sep", Q4: "Okt-Dec" }
const RATING_COLOR: Record<string, string> = { A: C.green, B: "#65a30d", C: C.amber, D: "#f97316", E: C.red }
const RATING_LABEL: Record<string, string> = { A: "Fremragende", B: "Godt", C: "Middel", D: "Under middel", E: "Kritisk" }

// ── Types ──────────────────────────────────────────────────────────────────────
type Rec = {
  id: string; title: string; description: string; effort: string; category: string;
  priority: string; timeline: string; smart_goal: string; action_steps: string[];
  score_improvement_pts: number; estimated_co2_reduction_pct: number; kpis?: string[];
}

export interface ReportPdfProps {
  companyName:           string
  reportYear:            number
  reportDate:            string
  esgRating:             string
  esgScoreTotal:         number
  esgScoreE:             number
  esgScoreS:             number
  esgScoreG:             number
  industryPercentile:    number
  totalCo2Tonnes:        number
  scope1Co2Tonnes:       number
  scope2Co2Tonnes:       number
  scope3Co2Tonnes:       number
  executiveSummary:      string
  co2Narrative:          string
  esgNarrative:          string
  improvementsNarrative: string
  roadmapNarrative:      string
  identifiedGaps:        string[]
  recommendations:       Rec[]
  disclaimer:            string
  industryCode?:         string
  countryCode?:          string
}

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray700,
    backgroundColor: C.white,
    paddingBottom: 52,
  },
  darkPage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.white,
    backgroundColor: C.dark,
  },
  // Page chrome
  topBar: { height: 4 },
  pageSubHeader: {
    paddingHorizontal: 40,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    backgroundColor: C.gray50,
  },
  pageFooter: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
  },
  pageFooterText: { fontSize: 7, color: C.gray400 },
  pageBody: { paddingHorizontal: 40, paddingTop: 24 },
  // Cover
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: C.dark,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverMain: { flex: 1, padding: 52 },
  coverLabel:   { fontSize: 9,  color: C.darkText, marginBottom: 40 },
  coverTitle:   { fontSize: 36, fontWeight: 700, color: C.white, lineHeight: 1.15, marginBottom: 6 },
  coverSub:     { fontSize: 14, color: C.darkText, marginBottom: 40 },
  coverCompany: { fontSize: 11, color: C.darkText, marginBottom: 4 },
  coverBottomBar: { flexDirection: "row", height: 80 },
  coverBlock: { flex: 1, padding: 16, justifyContent: "space-between" },
  coverBlockLabel: { fontSize: 8, color: C.white, fontWeight: 700 },
  coverBlockValue: { fontSize: 22, fontWeight: 700, color: C.white },
  // Section intro (dark pages)
  introBody: { flex: 1, padding: 52, justifyContent: "space-between" },
  introBadge: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  introBadgeLetter: { fontSize: 28, fontWeight: 700, color: C.white },
  introTitle: { fontSize: 30, fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: 12 },
  introDesc:  { fontSize: 11, color: C.darkText, lineHeight: 1.6 },
  introBottomLine: { borderTopWidth: 1, borderTopColor: C.darkLight, paddingTop: 16 },
  introBottomText: { fontSize: 8, color: C.darkSub },
  // Nogletalsgrid
  nokRow: { flexDirection: "row", marginBottom: 10 },
  nokCell: { flex: 1, padding: 16, borderRadius: 6, marginRight: 8 },
  nokCellLast: { flex: 1, padding: 16, borderRadius: 6 },
  nokCellLabel: { fontSize: 7, color: C.white, fontWeight: 700, marginBottom: 6 },
  nokCellValue: { fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 2 },
  nokCellUnit:  { fontSize: 7, color: C.white },
  // Two-card layout
  twoCardRow: { flexDirection: "row", marginBottom: 14 },
  leftCard: {
    flex: 1, backgroundColor: C.white,
    borderWidth: 1, borderColor: C.gray200,
    borderRadius: 6, marginRight: 10, overflow: "hidden",
  },
  leftCardAccent: { height: 3 },
  leftCardBody: { padding: 14 },
  rightCard: { flex: 1, borderRadius: 6, overflow: "hidden" },
  rightCardAccent: { height: 3 },
  rightCardBody: { padding: 14, flex: 1 },
  cardHeading: { fontSize: 8, fontWeight: 700, color: C.gray500, marginBottom: 8 },
  cardText: { fontSize: 9, color: C.gray700, lineHeight: 1.6 },
  bulletRow: { flexDirection: "row", marginBottom: 5 },
  bulletDot:  { fontSize: 9, color: C.gray500, marginRight: 5, marginTop: 1 },
  bulletText: { fontSize: 9, color: C.gray700, lineHeight: 1.5, flex: 1 },
  // Scope bars
  scopeSection: { marginBottom: 16 },
  scopeHeading: { fontSize: 8, fontWeight: 700, color: C.gray500, marginBottom: 10 },
  scopeRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  scopeLabel: { fontSize: 8, color: C.gray600, width: 56 },
  scopeTrack: { flex: 1, height: 10, backgroundColor: C.gray100, borderRadius: 5, overflow: "hidden", marginRight: 8 },
  scopeFill:  { height: 10, borderRadius: 5 },
  scopeValue: { fontSize: 8, fontWeight: 700, color: C.gray600, width: 60, textAlign: "right" },
  // Dim score bars
  dimBarRow: { marginBottom: 10 },
  dimBarHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  dimBarLabel: { fontSize: 8, fontWeight: 700, color: C.gray600 },
  dimBarValue: { fontSize: 8, fontWeight: 700 },
  dimBarTrack: { height: 8, backgroundColor: C.gray100, borderRadius: 4, overflow: "hidden" },
  dimBarFill:  { height: 8, borderRadius: 4 },
  // Gaps
  gapItem: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  gapDot:  { width: 6, height: 6, borderRadius: 3, marginTop: 3, marginRight: 8, flexShrink: 0 },
  gapText: { fontSize: 8, color: C.gray700, lineHeight: 1.5, flex: 1 },
  // Rec cards (slim)
  recCard: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200,
    borderRadius: 6, marginBottom: 10, overflow: "hidden",
  },
  recCardTop: { height: 3 },
  recCardBody: { padding: 12 },
  recCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  recCardTitle: { fontSize: 9, fontWeight: 700, color: C.gray900, flex: 1, marginRight: 8, lineHeight: 1.4 },
  recBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginLeft: 3 },
  recBadgeText: { fontSize: 7, fontWeight: 700 },
  recImpactRow: { flexDirection: "row", marginBottom: 6 },
  recImpactBadge: { backgroundColor: C.gray100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 5 },
  recImpactText: { fontSize: 7, color: C.gray600 },
  recSmartBox: { backgroundColor: C.gray50, borderRadius: 4, padding: 8, marginBottom: 6 },
  recSmartLabel: { fontSize: 7, fontWeight: 700, color: C.gray400, marginBottom: 2 },
  recSmartText:  { fontSize: 8, color: C.gray700, lineHeight: 1.5 },
  recStepRow: { flexDirection: "row", marginBottom: 4 },
  recStepNum: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: C.gray200,
    alignItems: "center", justifyContent: "center", marginRight: 5, flexShrink: 0,
  },
  recStepNumTxt: { fontSize: 7, fontWeight: 700, color: C.gray600 },
  recStepTxt: { fontSize: 8, color: C.gray600, lineHeight: 1.4, flex: 1 },
  // Quarterly plan
  qGrid: { flexDirection: "row", marginBottom: 20 },
  qCol: { flex: 1, borderWidth: 1, borderColor: C.gray200, borderRadius: 6, overflow: "hidden", marginRight: 8 },
  qColLast: { flex: 1, borderWidth: 1, borderColor: C.gray200, borderRadius: 6, overflow: "hidden" },
  qHead: { padding: 10 },
  qHeadLabel: { fontSize: 9, fontWeight: 700, color: C.white, marginBottom: 2 },
  qHeadSub:   { fontSize: 7, color: "#dddddd" },
  qBody:      { padding: 8, backgroundColor: C.white },
  qItemRow:   { flexDirection: "row", marginBottom: 5 },
  qDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3, flexShrink: 0, marginRight: 5 },
  qItemText: { fontSize: 7, color: C.gray700, lineHeight: 1.4, flex: 1 },
  // Utility
  sectionTitle: { fontSize: 13, fontWeight: 700, color: C.gray900, marginBottom: 4 },
  sectionSub:   { fontSize: 8, color: C.gray400, marginBottom: 16 },
  divider: { borderTopWidth: 1, borderTopColor: C.gray200, marginVertical: 14 },
  body:    { fontSize: 9, color: C.gray700, lineHeight: 1.6 },
  small:   { fontSize: 7, color: C.gray400 },
  sourceNote: {
    fontSize: 7, color: C.gray400, fontStyle: "italic",
    marginTop: 8, borderTopWidth: 1, borderTopColor: C.gray100, paddingTop: 8,
  },
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function stripMd(text: string): string {
  if (!text) return ""
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .trim()
}

function extractFirstParagraph(text: string, maxChars = 600): string {
  if (!text) return ""
  const clean = stripMd(text)
  const sentences = clean.split(/(?<=\.)\s+/)
  let result = ""
  for (const sent of sentences) {
    if ((result + sent).length > maxChars) break
    result += (result ? " " : "") + sent
  }
  if (!result) result = clean.slice(0, maxChars)
  if (result && !result.endsWith(".")) result += "."
  return result
}

function extractBullets(text: string, max = 5): string[] {
  if (!text) return []
  const bullets: string[] = []
  for (const line of text.split("\n")) {
    const m = line.match(/^[-*\d.]+\s+(.+)/)
    if (m) bullets.push(m[1].trim())
    if (bullets.length >= max) break
  }
  if (bullets.length === 0) {
    const sentences = stripMd(text).split(/\.\s+/)
    return sentences.slice(0, max).filter(Boolean).map(s => s.replace(/\.$/, ""))
  }
  return bullets
}

function gapText(gap: any): string {
  if (typeof gap === "string") return gap
  return gap?.description || JSON.stringify(gap)
}

// ── Shared Components ──────────────────────────────────────────────────────────
function TopBar({ color }: { color: string }) {
  return <View style={[s.topBar, { backgroundColor: color }]} />
}

function PageSubHeader({
  companyName, year, dimColor, dimLabel, pageLabel,
}: { companyName: string; year: number; dimColor: string; dimLabel: string; pageLabel: string }) {
  return (
    <View style={s.pageSubHeader}>
      <Text style={{ fontSize: 8, color: C.gray500 }}>
        {companyName} · VSME Basic Module · {year}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{
          backgroundColor: dimColor,
          paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 8,
        }}>
          <Text style={{ fontSize: 7, fontWeight: 700, color: C.white }}>{dimLabel}</Text>
        </View>
        <Text style={{ fontSize: 8, color: C.gray500 }}>{pageLabel}</Text>
      </View>
    </View>
  )
}

function PageFooter({ page, companyName, year }: { page: string; companyName: string; year: number }) {
  return (
    <View style={s.pageFooter}>
      <Text style={s.pageFooterText}>
        {companyName} · ESG-rapport {year} · ESG Copilot · VSME Basic Module (EFRAG 2024)
      </Text>
      <Text style={s.pageFooterText}>{page}</Text>
    </View>
  )
}

function ScopeBar({ label, tonnes, max }: { label: string; tonnes: number; max: number }) {
  const safe = tonnes ?? 0
  const pct  = max > 0 ? Math.min((safe / max) * 100, 100) : 0
  return (
    <View style={s.scopeRow}>
      <Text style={s.scopeLabel}>{label}</Text>
      <View style={s.scopeTrack}>
        <View style={[s.scopeFill, { width: `${pct}%`, backgroundColor: C.eColor }]} />
      </View>
      <Text style={s.scopeValue}>{safe.toFixed(2)} t</Text>
    </View>
  )
}

function DimBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const safe = score ?? 0
  const pct  = Math.min((safe / max) * 100, 100)
  return (
    <View style={s.dimBarRow}>
      <View style={s.dimBarHead}>
        <Text style={s.dimBarLabel}>{label}</Text>
        <Text style={[s.dimBarValue, { color }]}>{safe.toFixed(1)} / {max}</Text>
      </View>
      <View style={s.dimBarTrack}>
        <View style={[s.dimBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

function TwoCardLayout({
  dim, goalTitle, goalText, actionTitle, actionBullets,
}: {
  dim: string; goalTitle: string; goalText: string; actionTitle: string; actionBullets: string[]
}) {
  const color = DIM_COLOR[dim] || C.eColor
  const bg    = DIM_BG[dim]    || C.eLightBg
  return (
    <View style={s.twoCardRow}>
      {/* Left: goal card */}
      <View style={s.leftCard}>
        <View style={[s.leftCardAccent, { backgroundColor: color }]} />
        <View style={s.leftCardBody}>
          <Text style={[s.cardHeading, { color }]}>{goalTitle}</Text>
          <Text style={s.cardText}>{goalText}</Text>
        </View>
      </View>
      {/* Right: action card */}
      <View style={[s.rightCard, { backgroundColor: bg }]}>
        <View style={[s.rightCardAccent, { backgroundColor: color }]} />
        <View style={s.rightCardBody}>
          <Text style={[s.cardHeading, { color }]}>{actionTitle}</Text>
          {actionBullets.map((bullet, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={[s.bulletDot, { color }]}>•</Text>
              <Text style={s.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function SectionIntroPage({
  dim, subtitle, description, companyName, year,
}: { dim: string; subtitle: string; description: string; companyName: string; year: number }) {
  const color = DIM_COLOR[dim] || C.eColor
  return (
    <Page size="A4" style={s.darkPage}>
      <View style={s.introBody}>
        <View>
          <View style={[s.introBadge, { backgroundColor: color }]}>
            <Text style={s.introBadgeLetter}>{dim}</Text>
          </View>
          <Text style={{ fontSize: 8, color: C.darkSub, marginBottom: 8 }}>
            {DIM_FULL[dim] || dim}
          </Text>
          <Text style={s.introTitle}>{subtitle}</Text>
          <Text style={s.introDesc}>{description}</Text>
        </View>
        <View style={s.introBottomLine}>
          <Text style={s.introBottomText}>
            {companyName} · VSME Basic Module · ESG-rapport {year}
          </Text>
        </View>
      </View>
    </Page>
  )
}

function RecCardSlim({ rec, index, dim }: { rec: Rec; index: number; dim: string }) {
  const color      = DIM_COLOR[dim] || DIM_COLOR[rec.category] || C.eColor
  const prioColor  = PRIO_COLOR[rec.priority]  || C.green
  const prioBg     = PRIO_BG[rec.priority]     || C.greenLight
  const prioLabel  = PRIO_LABEL[rec.priority]  || "LAV"
  const tlColor    = Q_COLOR[rec.timeline]     || C.green

  return (
    <View style={s.recCard}>
      <View style={[s.recCardTop, { backgroundColor: color }]} />
      <View style={s.recCardBody}>
        {/* Header */}
        <View style={s.recCardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <View style={{
              width: 16, height: 16, borderRadius: 8, backgroundColor: color,
              alignItems: "center", justifyContent: "center", marginRight: 6,
            }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: C.white }}>{index + 1}</Text>
            </View>
            <Text style={s.recCardTitle}>{rec.title}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={[s.recBadge, { backgroundColor: prioBg }]}>
              <Text style={[s.recBadgeText, { color: prioColor }]}>{prioLabel}</Text>
            </View>
            <View style={[s.recBadge, { backgroundColor: C.gray100 }]}>
              <Text style={[s.recBadgeText, { color: tlColor }]}>{rec.timeline}</Text>
            </View>
          </View>
        </View>
        {/* Impact badges */}
        {((rec.score_improvement_pts ?? 0) > 0 || (rec.estimated_co2_reduction_pct ?? 0) > 0) && (
          <View style={s.recImpactRow}>
            {(rec.score_improvement_pts ?? 0) > 0 && (
              <View style={s.recImpactBadge}>
                <Text style={s.recImpactText}>+{(rec.score_improvement_pts ?? 0).toFixed(1)} ESG-pt</Text>
              </View>
            )}
            {(rec.estimated_co2_reduction_pct ?? 0) > 0 && (
              <View style={s.recImpactBadge}>
                <Text style={s.recImpactText}>-{rec.estimated_co2_reduction_pct}% CO2</Text>
              </View>
            )}
          </View>
        )}
        {/* SMART goal */}
        {rec.smart_goal && (
          <View style={s.recSmartBox}>
            <Text style={s.recSmartLabel}>SMART-MAL</Text>
            <Text style={s.recSmartText}>{rec.smart_goal}</Text>
          </View>
        )}
        {/* Action steps */}
        {rec.action_steps && rec.action_steps.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: C.gray400, marginBottom: 4 }}>Handlingstrin</Text>
            {rec.action_steps.slice(0, 4).map((step, i) => (
              <View key={i} style={s.recStepRow}>
                <View style={s.recStepNum}>
                  <Text style={s.recStepNumTxt}>{i + 1}</Text>
                </View>
                <Text style={s.recStepTxt}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

// ── Main Document ──────────────────────────────────────────────────────────────
export function ReportPdfDocument(props: ReportPdfProps) {
  const {
    companyName, reportYear, reportDate, esgRating,
    executiveSummary, co2Narrative, esgNarrative, improvementsNarrative, roadmapNarrative,
    industryCode, countryCode,
  } = props

  const year               = reportYear
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

  const rColor  = RATING_COLOR[esgRating] || C.gray500
  const rLabel  = RATING_LABEL[esgRating] || "ESG-vurdering"
  const dateStr = reportDate
    ? new Date(reportDate).toLocaleDateString("da-DK", { year: "numeric", month: "long", day: "numeric" })
    : ""
  const maxCo2 = Math.max(scope1Co2Tonnes, scope2Co2Tonnes, scope3Co2Tonnes, 0.01)

  const recsE    = recommendations.filter(r => r.category === "E").slice(0, 3)
  const recsS    = recommendations.filter(r => r.category === "S").slice(0, 3)
  const recsG    = recommendations.filter(r => r.category === "G").slice(0, 3)
  const recsHigh = recommendations.filter(r => r.priority === "high").slice(0, 6)

  // Distribute gaps across dimensions (fallback: round-robin)
  const gapsTyped = identifiedGaps.map(g => ({ text: gapText(g), category: (g as any)?.dimension || "" }))
  const gapsE = gapsTyped.filter(g => g.category === "E" || g.category === "").slice(0, 5)
  const gapsS = gapsTyped.filter(g => g.category === "S").slice(0, 4)
  const gapsG = gapsTyped.filter(g => g.category === "G").slice(0, 4)

  // Quarterly plan
  const quarterRecs: Record<string, Rec[]> = { Q1: [], Q2: [], Q3: [], Q4: [] }
  recommendations.slice(0, 16).forEach(r => {
    if (quarterRecs[r.timeline]) quarterRecs[r.timeline].push(r)
  })

  // Narrative extracts
  const co2Goal       = extractFirstParagraph(co2Narrative, 380)
  const co2Actions    = extractBullets(co2Narrative, 5)
  const socialGoal    = extractFirstParagraph(esgNarrative, 380)
  const socialActions = extractBullets(esgNarrative, 5)
  const govGoal       = extractFirstParagraph(improvementsNarrative, 380)
  const govActions    = extractBullets(improvementsNarrative, 5)

  const fallbackCo2Actions = [
    "Kortlagge og reducere Scope 1-emissioner fra direkte forbraending",
    "Skifte til vedvarende energi for at nedbringe Scope 2-emissioner",
    "Engagere leverandorer for at adressere Scope 3-emissioner",
    "Implementere energieffektiviseringstiltag i driften",
  ]
  const fallbackSocialActions = [
    "Sikre retfaerdig lon og gode arbejdsvilkar for alle medarbejdere",
    "Fremme mangfoldighed og ligestilling pa tvaers af organisationen",
    "Investere i medarbejderudvikling og efteruddannelse",
    "Gennemfore regelmaessige trivselsmalinger og handle pa resultater",
  ]
  const fallbackGovActions = [
    "Implementere antikorruptionspolitik og efterlevelsesprocedurer",
    "Styrke bestyrelses-engagement med ESG og baeredygtighed",
    "Etablere klar rapporteringsstruktur for ESG-data",
    "Sikre regelmaessig ekstern revision og transparens",
  ]

  return (
    <Document
      title={`${companyName} VSME ESG-rapport ${year}`}
      author="ESG Copilot"
      subject="VSME Basic Module (EFRAG 2024)"
    >

      {/* ── SIDE 1: FORSIDE ──────────────────────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverMain}>
          <View>
            <Text style={s.coverLabel}>ESG Copilot · VSME Basic Module · EFRAG 2024</Text>
            <Text style={s.coverTitle}>VSME{"\n"}ESG-RAPPORT</Text>
            <Text style={s.coverSub}>{year}</Text>
          </View>
          <View>
            <Text style={s.coverCompany}>{companyName}</Text>
            {industryCode && <Text style={[s.coverCompany, { fontSize: 9 }]}>Branche: {industryCode}</Text>}
            {countryCode  && <Text style={[s.coverCompany, { fontSize: 9 }]}>Land: {countryCode}</Text>}
            <Text style={{ fontSize: 9, color: C.darkText, marginTop: 8 }}>Genereret: {dateStr}</Text>
          </View>
        </View>
        {/* E / S / G / Rating blocks */}
        <View style={s.coverBottomBar}>
          <View style={[s.coverBlock, { backgroundColor: C.eColor }]}>
            <Text style={s.coverBlockLabel}>E — MILJO</Text>
            <Text style={s.coverBlockValue}>{esgScoreE.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock, { backgroundColor: C.sColor }]}>
            <Text style={s.coverBlockLabel}>S — SOCIALE</Text>
            <Text style={s.coverBlockValue}>{esgScoreS.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock, { backgroundColor: C.gColor }]}>
            <Text style={s.coverBlockLabel}>G — LEDELSE</Text>
            <Text style={s.coverBlockValue}>{esgScoreG.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock, { backgroundColor: C.darkMid }]}>
            <Text style={s.coverBlockLabel}>SAMLET RATING</Text>
            <Text style={[s.coverBlockValue, { color: rColor }]}>{esgRating}</Text>
          </View>
        </View>
      </Page>

      {/* ── SIDE 2: NOGLETALSOVERSIGT ─────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray400} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="OVERSIGT" pageLabel="Nogletalsoversigt" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Nogletalsoversigt</Text>
          <Text style={s.sectionSub}>Samlet ESG-profil for {companyName} · Rapportperiode {year}</Text>

          {/* Rating + score row */}
          <View style={s.twoCardRow}>
            <View style={[s.leftCard, { alignItems: "center", padding: 20 }]}>
              <View style={[s.leftCardAccent, { backgroundColor: rColor, width: "100%", marginBottom: 12 }]} />
              <Text style={{ fontSize: 44, fontWeight: 700, color: rColor, marginBottom: 4 }}>{esgRating}</Text>
              <Text style={{ fontSize: 10, fontWeight: 700, color: C.gray700, marginBottom: 4 }}>{rLabel}</Text>
              <Text style={{ fontSize: 8, color: C.gray400 }}>ESG Rating</Text>
            </View>
            <View style={{ flex: 2, flexDirection: "column" }}>
              {/* Total score */}
              <View style={[s.leftCard, { marginRight: 0, marginBottom: 8, padding: 14 }]}>
                <Text style={{ fontSize: 8, color: C.gray400, marginBottom: 2 }}>Samlet ESG-score</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 22, fontWeight: 700, color: C.gray900 }}>
                    {esgScoreTotal.toFixed(1)}<Text style={{ fontSize: 10, fontWeight: 400, color: C.gray400 }}> / 100</Text>
                  </Text>
                  <View style={{ height: 6, width: 80, backgroundColor: C.gray100, borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: rColor, width: `${Math.min(esgScoreTotal, 100)}%` }} />
                  </View>
                </View>
              </View>
              {/* CO2 */}
              <View style={[s.leftCard, { marginRight: 0, marginBottom: 8, padding: 14 }]}>
                <Text style={{ fontSize: 8, color: C.gray400, marginBottom: 2 }}>Total CO2-udledning</Text>
                <Text style={{ fontSize: 22, fontWeight: 700, color: C.eColor }}>
                  {totalCo2Tonnes.toFixed(1)}<Text style={{ fontSize: 10, fontWeight: 400, color: C.gray400 }}> tCO2e</Text>
                </Text>
              </View>
              {/* Percentile */}
              {industryPercentile > 0 && (
                <View style={[s.leftCard, { marginRight: 0, padding: 14 }]}>
                  <Text style={{ fontSize: 8, color: C.gray400, marginBottom: 2 }}>Branche-percentil</Text>
                  <Text style={{ fontSize: 22, fontWeight: 700, color: C.gColor }}>
                    {industryPercentile.toFixed(0)}<Text style={{ fontSize: 10, fontWeight: 400, color: C.gray400 }}>%</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* E / S / G boxes */}
          <View style={s.nokRow}>
            <View style={[s.nokCell, { backgroundColor: C.eColor }]}>
              <Text style={s.nokCellLabel}>E — MILJO</Text>
              <Text style={s.nokCellValue}>{esgScoreE.toFixed(1)}</Text>
              <Text style={s.nokCellUnit}>ESG-point</Text>
            </View>
            <View style={[s.nokCell, { backgroundColor: C.sColor }]}>
              <Text style={s.nokCellLabel}>S — SOCIALE</Text>
              <Text style={s.nokCellValue}>{esgScoreS.toFixed(1)}</Text>
              <Text style={s.nokCellUnit}>ESG-point</Text>
            </View>
            <View style={[s.nokCellLast, { backgroundColor: C.gColor }]}>
              <Text style={s.nokCellLabel}>G — LEDELSE</Text>
              <Text style={s.nokCellValue}>{esgScoreG.toFixed(1)}</Text>
              <Text style={s.nokCellUnit}>ESG-point</Text>
            </View>
          </View>

          {/* CO2 scopes */}
          <View style={s.scopeSection}>
            <Text style={s.scopeHeading}>CO2-fordeling (Scope 1, 2, 3)</Text>
            <ScopeBar label="Scope 1" tonnes={scope1Co2Tonnes} max={maxCo2} />
            <ScopeBar label="Scope 2" tonnes={scope2Co2Tonnes} max={maxCo2} />
            <ScopeBar label="Scope 3" tonnes={scope3Co2Tonnes} max={maxCo2} />
          </View>

          {/* Score bars */}
          <Text style={s.scopeHeading}>ESG-dimension scorecard</Text>
          <DimBar label="E — Miljo"   score={esgScoreE} max={40} color={C.eColor} />
          <DimBar label="S — Sociale" score={esgScoreS} max={30} color={C.sColor} />
          <DimBar label="G — Ledelse" score={esgScoreG} max={30} color={C.gColor} />

          <Text style={s.sourceNote}>
            Kilde: ESG Copilot · Beregnet iht. VSME Basic Module (EFRAG 2024) · GHG Protocol · Emissionsfaktorer: Energistyrelsen 2024, DEFRA 2024
          </Text>
        </View>
        <PageFooter page="Side 2" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 3: E INTRO ──────────────────────────────────────────────────── */}
      <SectionIntroPage
        dim="E"
        subtitle="Klimaaftryk og miljo"
        description={
          `CO2-emissioner, energiforbrug og miljopavirkning er centrale for VSME Basic Module. ` +
          `${companyName} har et samlet klimaaftryk pa ${totalCo2Tonnes.toFixed(1)} tCO2e fordelt pa ` +
          `Scope 1, 2 og 3. Nedenfor gennemgas virksomhedens klimamal og konkrete tiltag.`
        }
        companyName={companyName}
        year={year}
      />

      {/* ── SIDE 4: E — CO2 & ENERGI ─────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Klimaaftryk og energi" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Klimaaftryk og CO2-emissioner</Text>
          <Text style={s.sectionSub}>VSME B3 — Klimaaftryksoversigt · Scope 1, 2 og 3</Text>

          <TwoCardLayout
            dim="E"
            goalTitle="Virksomhedens klimamal"
            goalText={co2Goal || `${companyName} arbejder aktivt med at reducere CO2-udledningen pa tvaers af alle scopes.`}
            actionTitle="Hvad gor vi?"
            actionBullets={co2Actions.length > 0 ? co2Actions : fallbackCo2Actions}
          />

          {/* CO2 breakdown card */}
          <View style={[s.leftCard, { marginRight: 0, marginBottom: 14 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.eColor }]} />
            <View style={{ padding: 14 }}>
              <Text style={[s.cardHeading, { color: C.eColor, marginBottom: 10 }]}>CO2-fordeling (tCO2e)</Text>
              <ScopeBar label="Scope 1" tonnes={scope1Co2Tonnes} max={maxCo2} />
              <ScopeBar label="Scope 2" tonnes={scope2Co2Tonnes} max={maxCo2} />
              <ScopeBar label="Scope 3" tonnes={scope3Co2Tonnes} max={maxCo2} />
              <View style={{ flexDirection: "row", marginTop: 10, borderTopWidth: 1, borderTopColor: C.gray100, paddingTop: 8 }}>
                <Text style={{ fontSize: 8, fontWeight: 700, color: C.gray700, flex: 1 }}>Total</Text>
                <Text style={{ fontSize: 8, fontWeight: 700, color: C.eColor }}>{totalCo2Tonnes.toFixed(2)} tCO2e</Text>
              </View>
            </View>
          </View>

          {/* E recommendations */}
          {recsE.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginBottom: 8 }]}>Anbefalede tiltag — Miljo (E)</Text>
              {recsE.slice(0, 2).map((rec, i) => (
                <RecCardSlim key={rec.id || i} rec={rec} index={i} dim="E" />
              ))}
            </>
          )}

          {/* E gaps */}
          {gapsE.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginTop: 8, marginBottom: 6 }]}>Identificerede gaps — Miljo</Text>
              {gapsE.slice(0, 4).map((gap, i) => (
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot, { backgroundColor: C.amber }]} />
                  <Text style={s.gapText}>{gap.text}</Text>
                </View>
              ))}
            </>
          )}

          <Text style={s.sourceNote}>
            Kilde: GHG Protocol Corporate Standard · Emissionsfaktorer: Energistyrelsen 2024, DEFRA 2024
          </Text>
        </View>
        <PageFooter page="Side 4" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 5: S INTRO ──────────────────────────────────────────────────── */}
      <SectionIntroPage
        dim="S"
        subtitle="Sociale forhold og medarbejdere"
        description={
          `Medarbejdertrivsel, ligestilling og retfaerdige arbejdsvilkar er centrale for social ansvarlighed. ` +
          `VSME Basic Module kraever rapportering om ansaettelsesforhold, lonaendringer og sundhed og sikkerhed. ` +
          `Nedenfor gennemgas ${companyName}s sociale profil og konkrete tiltag.`
        }
        companyName={companyName}
        year={year}
      />

      {/* ── SIDE 6: S — MEDARBEJDERE & SOCIALE ──────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Sociale forhold" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Sociale forhold og medarbejdere</Text>
          <Text style={s.sectionSub}>VSME S-dimensionen — Ansaettelsesforhold, trivsel og ligestilling</Text>

          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens sociale mal"
            goalText={socialGoal || `${companyName} prioriterer medarbejdertrivsel og retfaerdige arbejdsvilkar.`}
            actionTitle="Hvad gor vi?"
            actionBullets={socialActions.length > 0 ? socialActions : fallbackSocialActions}
          />

          {/* S score */}
          <View style={[s.leftCard, { marginRight: 0, marginBottom: 14 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.sColor }]} />
            <View style={{ padding: 14 }}>
              <Text style={[s.cardHeading, { color: C.sColor, marginBottom: 10 }]}>S-dimension scorecard</Text>
              <DimBar label="Sociale forhold (samlet)" score={esgScoreS} max={30} color={C.sColor} />
            </View>
          </View>

          {/* S recommendations */}
          {recsS.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginBottom: 8 }]}>Anbefalede tiltag — Sociale (S)</Text>
              {recsS.slice(0, 2).map((rec, i) => (
                <RecCardSlim key={rec.id || i} rec={rec} index={i} dim="S" />
              ))}
            </>
          )}

          {/* S gaps */}
          {gapsS.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginTop: 8, marginBottom: 6 }]}>Identificerede gaps — Sociale</Text>
              {gapsS.map((gap, i) => (
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot, { backgroundColor: C.amber }]} />
                  <Text style={s.gapText}>{gap.text}</Text>
                </View>
              ))}
            </>
          )}

          <Text style={s.sourceNote}>
            Kilde: VSME Basic Module (EFRAG 2024) · S-dimensionen daekker ansaettelse, trivsel og ligestilling
          </Text>
        </View>
        <PageFooter page="Side 6" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 7: G INTRO ──────────────────────────────────────────────────── */}
      <SectionIntroPage
        dim="G"
        subtitle="Ledelse og governance"
        description={
          `God selskabsledelse og transparente processer er grundlaget for baeredygtig drift. ` +
          `VSME Basic Module kraever dokumentation af antikorruption, politikker og compliance. ` +
          `Nedenfor gennemgas ${companyName}s governance-profil og forbedringstiltag.`
        }
        companyName={companyName}
        year={year}
      />

      {/* ── SIDE 8: G — LEDELSE & GOVERNANCE ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gColor} dimLabel="G" pageLabel="Ledelse og governance" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ledelse og governance</Text>
          <Text style={s.sectionSub}>VSME G-dimensionen — Politikker, compliance og transparens</Text>

          <TwoCardLayout
            dim="G"
            goalTitle="Virksomhedens governance-mal"
            goalText={govGoal || `${companyName} arbejder aktivt med at styrke governance, compliance og antikorruptionspolitikker.`}
            actionTitle="Hvad gor vi?"
            actionBullets={govActions.length > 0 ? govActions : fallbackGovActions}
          />

          {/* G score */}
          <View style={[s.leftCard, { marginRight: 0, marginBottom: 14 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.gColor }]} />
            <View style={{ padding: 14 }}>
              <Text style={[s.cardHeading, { color: C.gColor, marginBottom: 10 }]}>G-dimension scorecard</Text>
              <DimBar label="Ledelse og governance (samlet)" score={esgScoreG} max={30} color={C.gColor} />
            </View>
          </View>

          {/* G recommendations */}
          {recsG.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginBottom: 8 }]}>Anbefalede tiltag — Ledelse (G)</Text>
              {recsG.slice(0, 2).map((rec, i) => (
                <RecCardSlim key={rec.id || i} rec={rec} index={i} dim="G" />
              ))}
            </>
          )}

          {/* G gaps */}
          {gapsG.length > 0 && (
            <>
              <Text style={[s.scopeHeading, { marginTop: 8, marginBottom: 6 }]}>Identificerede gaps — Ledelse</Text>
              {gapsG.map((gap, i) => (
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot, { backgroundColor: C.amber }]} />
                  <Text style={s.gapText}>{gap.text}</Text>
                </View>
              ))}
            </>
          )}

          <Text style={s.sourceNote}>
            Kilde: VSME Basic Module (EFRAG 2024) · G-dimensionen daekker ledelse, politikker og antikorruption
          </Text>
        </View>
        <PageFooter page="Side 8" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 9: LEDELSESOVERSIGT (B1) ────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="B1" pageLabel="Ledelsesoversigt" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ledelsesoversigt og sammenfatning</Text>
          <Text style={s.sectionSub}>B1 — Generelle oplysninger · VSME Basic Module (EFRAG 2024)</Text>

          {/* Executive summary */}
          <View style={[s.leftCard, { marginRight: 0, marginBottom: 16 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.gray500 }]} />
            <View style={{ padding: 16 }}>
              <Text style={[s.cardHeading, { color: C.gray500, marginBottom: 10 }]}>Ledelsens vurdering</Text>
              <Text style={s.body}>{extractFirstParagraph(executiveSummary, 1200)}</Text>
            </View>
          </View>

          {/* All gaps summary */}
          {identifiedGaps.length > 0 && (
            <View style={[s.leftCard, { marginRight: 0, marginBottom: 16, backgroundColor: "#fffbeb" }]}>
              <View style={[s.leftCardAccent, { backgroundColor: C.amber }]} />
              <View style={{ padding: 14 }}>
                <Text style={[s.cardHeading, { color: C.amber, marginBottom: 8 }]}>
                  Identificerede mangler ({identifiedGaps.length})
                </Text>
                {identifiedGaps.slice(0, 8).map((gap, i) => (
                  <View key={i} style={s.gapItem}>
                    <View style={[s.gapDot, { backgroundColor: C.amber }]} />
                    <Text style={s.gapText}>{gapText(gap)}</Text>
                  </View>
                ))}
                {identifiedGaps.length > 8 && (
                  <Text style={[s.small, { marginTop: 4 }]}>
                    + {identifiedGaps.length - 8} yderligere mangler
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* High priority recs summary */}
          {recsHigh.length > 0 && (
            <View style={[s.leftCard, { marginRight: 0 }]}>
              <View style={[s.leftCardAccent, { backgroundColor: C.red }]} />
              <View style={{ padding: 14 }}>
                <Text style={[s.cardHeading, { color: C.red, marginBottom: 8 }]}>
                  Hoj-prioritets tiltag ({recsHigh.length})
                </Text>
                {recsHigh.slice(0, 5).map((rec, i) => (
                  <View key={i} style={s.gapItem}>
                    <View style={[s.gapDot, { backgroundColor: DIM_COLOR[rec.category] || C.eColor }]} />
                    <Text style={s.gapText}>{rec.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        <PageFooter page="Side 9" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 10: ANBEFALEDE TILTAG ────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="TILTAG" pageLabel="Anbefalede tiltag" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Anbefalede tiltag og handlingsplan</Text>
          <Text style={s.sectionSub}>
            Prioriterede anbefalinger baseret pa ESG-analyse · {recommendations.length} tiltag i alt
          </Text>
          {(recsHigh.length > 0 ? recsHigh : recommendations.slice(0, 5)).map((rec, i) => (
            <RecCardSlim key={rec.id || i} rec={rec} index={i} dim={rec.category || "E"} />
          ))}
        </View>
        <PageFooter page="Side 10" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 11: 12-MANEDERS HANDLINGSPLAN ───────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="PLAN" pageLabel="12-maneders handlingsplan" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>12-maneders handlingsplan</Text>
          <Text style={s.sectionSub}>Prioriterede tiltag fordelt pa kvartaler i {year + 1}</Text>

          <View style={s.qGrid}>
            {(["Q1", "Q2", "Q3", "Q4"] as const).map((q, qi) => {
              const isLast = qi === 3
              const recs   = quarterRecs[q] || []
              const qc     = Q_COLOR[q]
              return (
                <View key={q} style={isLast ? s.qColLast : s.qCol}>
                  <View style={[s.qHead, { backgroundColor: qc }]}>
                    <Text style={s.qHeadLabel}>{q} {year + 1}</Text>
                    <Text style={s.qHeadSub}>{Q_MONTHS[q]}</Text>
                  </View>
                  <View style={s.qBody}>
                    {recs.length === 0 ? (
                      <Text style={[s.qItemText, { color: C.gray300, fontStyle: "italic" }]}>
                        Ingen tiltag planlagt
                      </Text>
                    ) : recs.map((r, ri) => (
                      <View key={ri} style={s.qItemRow}>
                        <View style={[s.qDot, { backgroundColor: DIM_COLOR[r.category] || qc }]} />
                        <Text style={s.qItemText}>{r.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            })}
          </View>

          {/* Roadmap summary */}
          {roadmapNarrative ? (
            <View style={[s.leftCard, { marginRight: 0 }]}>
              <View style={[s.leftCardAccent, { backgroundColor: C.gray500 }]} />
              <View style={{ padding: 14 }}>
                <Text style={[s.cardHeading, { color: C.gray500, marginBottom: 8 }]}>Implementeringsstrategi</Text>
                <Text style={s.body}>{extractFirstParagraph(roadmapNarrative, 600)}</Text>
              </View>
            </View>
          ) : null}
        </View>
        <PageFooter page="Side 11" companyName={companyName} year={year} />
      </Page>

      {/* ── SIDE 12: METODE & ANSVARSFRASKRIVELSE ───────────────────────────── */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray300} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray400} dimLabel="METODE" pageLabel="Metode og ansvarsfraskrivelse" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Metode og ansvarsfraskrivelse</Text>
          <Text style={s.sectionSub}>Datagrundlag, beregningsmetode og anvendelsesbegransninger</Text>

          <View style={[s.leftCard, { marginRight: 0, marginBottom: 14 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.gray400 }]} />
            <View style={{ padding: 14 }}>
              <Text style={[s.cardHeading, { color: C.gray500, marginBottom: 8 }]}>Beregningsstandard</Text>
              <Text style={s.body}>
                CO2-beregninger er udfort i overensstemmelse med GHG Protocol Corporate Accounting and Reporting Standard.
                Emissionsfaktorer er hentet fra Energistyrelsen (2024) for el og fjernvarme samt DEFRA (2024) for
                braendstoffer, transport og flyrejser. ESG-scoring er baseret pa VSME Basic Module (EFRAG, 2024).
              </Text>
            </View>
          </View>

          <View style={[s.leftCard, { marginRight: 0, marginBottom: 14 }]}>
            <View style={[s.leftCardAccent, { backgroundColor: C.gray400 }]} />
            <View style={{ padding: 14 }}>
              <Text style={[s.cardHeading, { color: C.gray500, marginBottom: 8 }]}>Datakilder</Text>
              {[
                "Energistyrelsen 2024 — El og fjernvarme emissionsfaktorer (Danmark)",
                "DEFRA 2024 — UK Government GHG Conversion Factors (braendstoffer, transport, fly)",
                "EFRAG 2024 — VSME Basic Module for SME sustainability reporting",
                "GHG Protocol 2023 — Corporate Accounting and Reporting Standard",
              ].map((src, i) => (
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot, { backgroundColor: C.gray400 }]} />
                  <Text style={s.gapText}>{src}</Text>
                </View>
              ))}
            </View>
          </View>

          {props.disclaimer ? (
            <View style={[s.leftCard, { marginRight: 0 }]}>
              <View style={[s.leftCardAccent, { backgroundColor: C.gray300 }]} />
              <View style={{ padding: 14 }}>
                <Text style={[s.cardHeading, { color: C.gray400, marginBottom: 8 }]}>Ansvarsfraskrivelse</Text>
                <Text style={[s.body, { color: C.gray500 }]}>{stripMd(props.disclaimer)}</Text>
              </View>
            </View>
          ) : null}
        </View>
        <PageFooter page="Side 12" companyName={companyName} year={year} />
      </Page>

    </Document>
  )
}
