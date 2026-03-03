"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getReportStatus, getReport, getMe, getCompany } from "@/lib/api"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import Sidebar from "@/components/Sidebar"
import { TrendingUp, Wind, ArrowLeft, Loader2, Target, Map, ChevronDown, ChevronUp } from "lucide-react"
import type { ReportPdfProps } from "@/components/ReportPdf"

const PdfDownloadButton = dynamic(() => import("@/components/PdfDownloadButton"), {
  ssr: false,
  loading: () => (
    <button className="btn-primary flex items-center gap-2 py-2" disabled>
      <Loader2 className="w-4 h-4 animate-spin" /> Indlæser PDF…
    </button>
  ),
})

const RATING_COLOR: Record<string, string> = { A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", E: "#ef4444" }
const RATING_BG: Record<string, string>    = { A: "#f0fdf4", B: "#f7fee7", C: "#fefce8", D: "#fff7ed", E: "#fef2f2" }
const SCOPE_COLORS = ["#22c55e", "#3b82f6", "#a855f7"]

const PRIORITY_CFG = {
  high:   { border: "border-l-red-400",   badge: "bg-red-50 text-red-700 border-red-200",       label: "Høj prioritet" },
  medium: { border: "border-l-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Middel prioritet" },
  low:    { border: "border-l-green-400", badge: "bg-green-50 text-green-700 border-green-200", label: "Lav prioritet" },
} as const
type PriorityKey = keyof typeof PRIORITY_CFG

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

type Rec = {
  id: string; title: string; description: string; effort: string; category: string;
  priority: string; timeline: string; smart_goal: string; action_steps: string[];
  score_improvement_pts: number; estimated_co2_reduction_pct: number; kpis: string[]
}

type ReportData = {
  esg_rating: string
  esg_score_total: number
  esg_score_e: number
  esg_score_s: number
  esg_score_g: number
  industry_percentile: number
  total_co2e_tonnes: number
  scope1_co2e_tonnes: number
  scope2_co2e_tonnes: number
  scope3_co2e_tonnes: number
  executive_summary: string
  co2_narrative: string
  esg_narrative: string
  improvements_narrative: string
  roadmap_narrative: string
  identified_gaps: string[]
  recommendations: Rec[]
  disclaimer: string
  completed_at?: string
}

// ─── Rich Text Renderer ───────────────────────────────────────────────────────
type Block =
  | { type: "h2";          text: string }
  | { type: "h3";          text: string }
  | { type: "tiltag";      num: number; text: string }
  | { type: "paragraph";   text: string }
  | { type: "bulletList";  items: string[] }
  | { type: "orderedList"; items: string[] }

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**")
      ? <strong key={i} className="font-semibold text-gray-800">{chunk.slice(2, -2)}</strong>
      : <span key={i}>{chunk}</span>
  )
}

function parseToBlocks(raw: string): Block[] {
  if (!raw) return []
  const lines = raw.split("\n")
  const result: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line || line === "---") { i++; continue }

    const hm = line.match(/^(#{1,3})\s+(.+)$/)
    if (hm) {
      result.push({ type: hm[1].length <= 2 ? "h2" : "h3", text: hm[2].replace(/\*\*/g, "").replace(/\*/g, "") })
      i++; continue
    }
    const boldLine = line.match(/^\*\*(.+?)\*\*[:\s]*$/)
    if (boldLine) { result.push({ type: "h3", text: boldLine[1] }); i++; continue }

    const tiltagM = line.replace(/\*\*/g, "").match(/^Tiltag\s+(\d+)\s*[:\-–—]\s*(.+)$/i)
    if (tiltagM) { result.push({ type: "tiltag", num: parseInt(tiltagM[1]), text: tiltagM[2].trim() }); i++; continue }

    const kvartalM = line.replace(/\*\*/g, "").match(/^(Kvartal\s+\d+\s*[—\-–:]\s*.+)$/i)
    if (kvartalM) { result.push({ type: "h2", text: kvartalM[1].replace(/\*\*/g, "").replace(/\*/g, "") }); i++; continue }

    if (!line.match(/^[-*•\d]/) && line.length < 72 && !line.match(/[.,;]$/) && (line.includes(" — ") || line.includes(" – "))) {
      result.push({ type: "h2", text: line.replace(/\*\*/g, "").replace(/\*/g, "") }); i++; continue
    }
    if (line.match(/^[-*•]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*•]\s+/)) { items.push(lines[i].trim().replace(/^[-*•]\s+/, "")); i++ }
      result.push({ type: "bulletList", items }); continue
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) { items.push(lines[i].trim().replace(/^\d+\.\s+/, "")); i++ }
      result.push({ type: "orderedList", items }); continue
    }
    result.push({ type: "paragraph", text: line }); i++
  }
  return result
}

function renderBlock(block: Block, i: number): React.ReactNode {
  if (block.type === "h2")
    return <h3 key={i} className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-1.5 mt-4 first:mt-0">{block.text}</h3>
  if (block.type === "h3")
    return <p key={i} className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-3 first:mt-0">{block.text}</p>
  if (block.type === "tiltag")
    return (
      <div key={i} className="flex items-start gap-3 mt-5 first:mt-0">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-[11px] font-bold">{block.num}</span>
        </div>
        <h3 className="text-sm font-semibold text-green-800 leading-snug">{block.text}</h3>
      </div>
    )
  if (block.type === "paragraph")
    return <p key={i} className="text-sm text-gray-600 leading-relaxed">{renderInline(block.text)}</p>
  if (block.type === "bulletList")
    return (
      <ul key={i} className="space-y-1.5 pl-1">
        {block.items.map((item, j) => (
          <li key={j} className="flex gap-2.5 text-sm text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
            <span className="leading-relaxed">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
  // orderedList
  return (
    <ol key={i} className="space-y-1.5 pl-1">
      {block.items.map((item, j) => (
        <li key={j} className="flex gap-2.5 text-sm text-gray-600">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{j + 1}</span>
          <span className="leading-relaxed">{renderInline(item)}</span>
        </li>
      ))}
    </ol>
  )
}

function RichText({ text }: { text: string }) {
  if (!text) return null
  return <div className="space-y-3">{parseToBlocks(text).map((b, i) => renderBlock(b, i))}</div>
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecCard({ rec, index }: { rec: Rec; index: number }) {
  const [open, setOpen] = useState(false)
  const pk: PriorityKey = (rec.priority in PRIORITY_CFG ? rec.priority : "medium") as PriorityKey
  const p = PRIORITY_CFG[pk]

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${p.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {index + 1}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 leading-snug">{rec.title}</h3>
              {rec.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${p.badge}`}>{p.label}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">{rec.timeline}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-3 pl-10">
          {rec.score_improvement_pts > 0 && (
            <span className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
              +{rec.score_improvement_pts.toFixed(1)} ESG-point
            </span>
          )}
          {rec.estimated_co2_reduction_pct > 0 && (
            <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              −{rec.estimated_co2_reduction_pct}% CO₂
            </span>
          )}
          {rec.category && (
            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
              {rec.category}
            </span>
          )}
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-3 pl-10"
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Skjul detaljer" : "Se SMART-mål og handlingstrin"}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-50 bg-gray-50/50 px-5 pb-5 pt-4 space-y-4" style={{ paddingLeft: "4.5rem" }}>
          {rec.smart_goal && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">SMART-mål</p>
              <p className="text-xs text-gray-600 leading-relaxed">{rec.smart_goal}</p>
            </div>
          )}
          {rec.action_steps && rec.action_steps.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Handlingstrin</p>
              <ol className="space-y-1.5">
                {rec.action_steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {rec.kpis && rec.kpis.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">KPI&apos;er</p>
              <div className="flex flex-wrap gap-1.5">
                {rec.kpis.map((kpi, i) => (
                  <span key={i} className="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{kpi}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [status, setStatus] = useState("processing")
  const [report, setReport] = useState<ReportData | null>(null)
  const [companyName, setCompanyName] = useState("Min Virksomhed")

  useEffect(() => { if (id) pollStatus() }, [id])

  async function pollStatus() {
    try {
      getMe().then(me => getCompany(me.company_id)).then(c => setCompanyName(c.name)).catch(() => {})
      const s = await getReportStatus(id)
      setStatus(s.status)
      if (s.status === "completed") {
        const r = await getReport(id)
        setReport(r as ReportData)
      } else if (s.status === "processing") {
        setTimeout(pollStatus, 3000)
      }
    } catch {
      router.push("/dashboard")
    }
  }

  if (status === "processing" || status === "draft") return <Processing />
  if (status === "failed") return <Failed />
  if (!report) return <Processing />

  const r = report
  const ratingColor = RATING_COLOR[r.esg_rating] ?? "#6b7280"
  const ratingBg    = RATING_BG[r.esg_rating]    ?? "#f9fafb"

  const scopeData = [
    { name: "Scope 1 — Direkte",   value: r.scope1_co2e_tonnes },
    { name: "Scope 2 — Energi",    value: r.scope2_co2e_tonnes },
    { name: "Scope 3 — Værdikæde", value: r.scope3_co2e_tonnes },
  ]

  const sortedRecs = [...(r.recommendations ?? [])].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  )

  const reportDateStr = r.completed_at ?? new Date().toISOString()
  const pdfProps: ReportPdfProps = {
    companyName,
    reportYear:  r.completed_at ? new Date(r.completed_at).getFullYear() : new Date().getFullYear(),
    reportDate:  reportDateStr,
    esgRating:   r.esg_rating,
    esgScoreTotal: r.esg_score_total,
    esgScoreE:   r.esg_score_e,
    esgScoreS:   r.esg_score_s,
    esgScoreG:   r.esg_score_g,
    industryPercentile: r.industry_percentile,
    totalCo2Tonnes:   r.total_co2e_tonnes,
    scope1Co2Tonnes:  r.scope1_co2e_tonnes,
    scope2Co2Tonnes:  r.scope2_co2e_tonnes,
    scope3Co2Tonnes:  r.scope3_co2e_tonnes,
    executiveSummary: r.executive_summary,
    co2Narrative:     r.co2_narrative,
    esgNarrative:     r.esg_narrative,
    improvementsNarrative: r.improvements_narrative,
    roadmapNarrative: r.roadmap_narrative ?? "",
    identifiedGaps:   r.identified_gaps,
    recommendations:  r.recommendations,
    disclaimer:       r.disclaimer,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Page header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="btn-secondary flex items-center gap-1.5 py-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VSME Bæredygtighedsrapport</h1>
              <p className="text-sm text-gray-500">AI-genereret · Energistyrelsen 2024 emissionsfaktorer</p>
            </div>
          </div>
          <PdfDownloadButton {...pdfProps} />
        </div>

        <div className="p-8 space-y-6 max-w-5xl">

          {/* ── 1. Hero scorecard ── */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-stretch">

              {/* Rating column */}
              <div
                className="flex flex-col items-center justify-center px-8 py-7 min-w-[160px] flex-shrink-0"
                style={{ background: ratingBg }}
              >
                <div className="text-7xl font-black leading-none mb-2" style={{ color: ratingColor }}>
                  {r.esg_rating}
                </div>
                <div className="text-2xl font-bold text-gray-800 leading-none">
                  {r.esg_score_total.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-1">ud af 100</div>
                <div
                  className="mt-3 text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ color: ratingColor, background: `${ratingColor}18` }}
                >
                  ESG-vurdering
                </div>
              </div>

              <div className="w-px bg-gray-100 flex-shrink-0" />

              {/* E/S/G + stats */}
              <div className="flex-1 px-8 py-7 space-y-4">
                <div className="space-y-3">
                  {(
                    [
                      { name: "Miljø",     abbr: "E", value: r.esg_score_e, weight: "50%", color: "#22c55e" },
                      { name: "Sociale",   abbr: "S", value: r.esg_score_s, weight: "30%", color: "#3b82f6" },
                      { name: "Lederskab", abbr: "G", value: r.esg_score_g, weight: "20%", color: "#a855f7" },
                    ] as const
                  ).map(({ name, abbr, value, weight, color }) => (
                    <div key={abbr} className="flex items-center gap-3">
                      <span
                        className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ color, background: `${color}18` }}
                      >{abbr}</span>
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                        {name} <span className="text-gray-300">({weight})</span>
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-14 text-right flex-shrink-0">
                        {value.toFixed(1)}<span className="text-gray-400 font-normal"> / 100</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">CO₂-aftryk</p>
                    <p className="text-xl font-bold text-gray-800">
                      {r.total_co2e_tonnes.toFixed(1)}
                      <span className="text-sm font-normal text-gray-400 ml-1">tCO₂e</span>
                    </p>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Brancheplacering</p>
                    <p className="text-xl font-bold text-gray-800">
                      Bedre end{" "}
                      <span style={{ color: ratingColor }}>{Math.round(r.industry_percentile)}%</span>
                      <span className="text-sm font-normal text-gray-400 ml-1">af branchen</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. CO₂ chart + ESG bars ── */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-500" /> Klimaaftryk pr. scope (B3)
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={scopeData} cx="50%" cy="50%" outerRadius={72} innerRadius={36} dataKey="value"
                    label={({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {scopeData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(2)} tCO₂e`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 border-t border-gray-50 pt-3">
                {scopeData.map((s, i) => (
                  <div key={s.name} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SCOPE_COLORS[i] }} />
                      <span className="text-gray-500">{s.name}</span>
                    </span>
                    <span className="font-semibold text-gray-800">{s.value.toFixed(2)} t</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">ESG-scorefordeling</h2>
              {[
                { name: "Miljø (E)",     value: r.esg_score_e, weight: "50%", color: "#22c55e" },
                { name: "Sociale (S)",   value: r.esg_score_s, weight: "30%", color: "#3b82f6" },
                { name: "Lederskab (G)", value: r.esg_score_g, weight: "20%", color: "#a855f7" },
              ].map(({ name, value, weight, color }) => (
                <div key={name} className="mb-5 last:mb-0">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{name} <span className="text-gray-400 font-normal">({weight})</span></span>
                    <span className="font-bold" style={{ color }}>{value.toFixed(1)} / 100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Samlet ESG-score</span>
                <span className="text-lg font-bold text-green-600">{r.esg_score_total.toFixed(1)} / 100</span>
              </div>
            </div>
          </div>

          {/* ── 3. Executive summary ── */}
          <div className="card">
            <h2 className="section-title flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-500" /> Ledelsesoversigt (B1)
            </h2>
            <RichText text={r.executive_summary} />
          </div>

          {/* ── 4. Identified gaps ── */}
          {r.identified_gaps && r.identified_gaps.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-3">Identificerede mangler</h2>
              <div className="space-y-2">
                {r.identified_gaps.map((gap, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                    <p className="text-sm text-amber-900 leading-relaxed">{gap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Recommendation cards ── */}
          {sortedRecs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="section-title flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" /> Anbefalede tiltag &amp; forbedringer
                </h2>
                <span className="text-xs text-gray-400">{sortedRecs.length} tiltag · sorteret efter prioritet</span>
              </div>
              {sortedRecs.map((rec, i) => (
                <RecCard key={rec.id || String(i)} rec={rec} index={i} />
              ))}
            </div>
          )}

          {/* ── 5b. Quarterly overview ── */}
          {sortedRecs.length > 0 && (
            <div className="card">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <Map className="w-4 h-4 text-green-500" /> 12-måneders handlingsplan
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                  const qRecs = sortedRecs.filter(a => a.timeline === q)
                  return (
                    <div key={q} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      <div className="bg-green-500 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">
                        {q === "Q1" ? "Kvartal 1" : q === "Q2" ? "Kvartal 2" : q === "Q3" ? "Kvartal 3" : "Kvartal 4"}
                      </div>
                      <div className="p-3 space-y-2">
                        {qRecs.length > 0 ? qRecs.map((a, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                              a.priority === "high" ? "bg-red-400" : a.priority === "medium" ? "bg-amber-400" : "bg-green-400"
                            }`} />
                            <span className="text-xs text-gray-600 leading-relaxed">{a.title}</span>
                          </div>
                        )) : (
                          <div className="text-xs text-gray-300">—</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 6. Disclaimer ── */}
          <div className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-4 leading-relaxed">
            <span className="font-semibold text-gray-500">Ansvarsfraskrivelse: </span>{r.disclaimer}
          </div>

        </div>
      </div>
    </div>
  )
}

function Processing() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <div className="text-lg font-bold text-gray-900 mb-1">Genererer din VSME-rapport…</div>
          <div className="text-gray-500 text-sm">Dette tager ca. 30 sekunder. Siden opdateres automatisk.</div>
        </div>
      </div>
    </div>
  )
}

function Failed() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">✗</span>
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1">Rapportgenerering mislykkedes</div>
          <p className="text-gray-500 text-sm mb-5">Noget gik galt. Prøv venligst igen.</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">Tilbage til dashboard</button>
        </div>
      </div>
    </div>
  )
}
