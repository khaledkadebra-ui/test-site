"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany, listReports, getReport } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import {
  Target, AlertCircle, Zap, ChevronDown, ChevronUp,
  TrendingUp, Leaf, Users, Shield, Award,
} from "lucide-react"

type Rec = {
  id: string
  title: string
  description: string
  effort: string
  category: string
  priority: string
  timeline: string
  smart_goal: string
  action_steps: string[]
  score_improvement_pts: number
  estimated_co2_reduction_pct: number
  kpis: string[]
}

type ReportData = {
  identified_gaps: string[]
  recommendations: Rec[]
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CAT: Record<string, { label: string; bg: string; text: string; border: string; bar: string; icon: React.ElementType }> = {
  E: { label: "Miljø",   bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", icon: Leaf   },
  S: { label: "Sociale", bg: "bg-blue-50",      text: "text-blue-700",    border: "border-blue-200",    bar: "bg-blue-500",    icon: Users  },
  G: { label: "Ledelse", bg: "bg-violet-50",    text: "text-violet-700",  border: "border-violet-200",  bar: "bg-violet-500",  icon: Shield },
}

const PRIO: Record<string, { label: string; bg: string; text: string; border: string }> = {
  high:   { label: "Høj",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
  medium: { label: "Middel", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  low:    { label: "Lav",    bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
}

const EFFORT: Record<string, { bars: number; color: string; label: string }> = {
  low:    { bars: 1, color: "bg-green-500", label: "Lav indsats"    },
  medium: { bars: 2, color: "bg-amber-500", label: "Middel indsats" },
  high:   { bars: 3, color: "bg-red-500",   label: "Høj indsats"    },
}

const QUARTER_CFG: Record<string, { months: string; header: string; subtext: string; badge: string }> = {
  Q1: { months: "Jan – Mar", header: "bg-green-500",  subtext: "Quick wins",                 badge: "⚡" },
  Q2: { months: "Apr – Jun", header: "bg-blue-500",   subtext: "Prioriterede tiltag",        badge: "🎯" },
  Q3: { months: "Jul – Sep", header: "bg-violet-500", subtext: "Strukturelle forbedringer",  badge: "📈" },
  Q4: { months: "Okt – Dec", header: "bg-orange-500", subtext: "Strategiske mål",            badge: "🏆" },
}

// Keyword-based gap categoriser
function gapCat(gap: string): string {
  const l = gap.toLowerCase()
  if (l.includes("electricity") || l.includes("energy") || l.includes("renewable") ||
      l.includes("waste") || l.includes("water") || l.includes("ghg") || l.includes("co2") ||
      l.includes("emission") || l.includes("recycl") || l.includes("net-zero") ||
      l.includes("scope") || l.includes("carbon")) return "E"
  if (l.includes("health") || l.includes("safety") || l.includes("training") ||
      l.includes("employee") || l.includes("injury") || l.includes("diversity") ||
      l.includes("wage") || l.includes("commut") || l.includes("gender") ||
      l.includes("female") || l.includes("living") || l.includes("ltir")) return "S"
  return "G"
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EffortIndicator({ effort }: { effort: string }) {
  const cfg = EFFORT[effort] || EFFORT.medium
  return (
    <div className="flex items-center gap-1.5" title={cfg.label}>
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-1.5 h-3.5 rounded-sm ${i <= cfg.bars ? cfg.color : "bg-gray-200"}`} />
        ))}
      </div>
      <span className="text-xs text-gray-500">{cfg.label}</span>
    </div>
  )
}

function RecCard({ rec }: { rec: Rec }) {
  const [expanded, setExpanded] = useState(false)
  const cat  = CAT[rec.category]  || CAT.G
  const prio = PRIO[rec.priority] || PRIO.medium
  const CatIcon = cat.icon

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
      rec.priority === "high" ? "border-red-100 shadow-sm" : "border-gray-100"
    }`}>
      {/* Category stripe */}
      <div className={`h-1.5 ${cat.bar}`} />

      <div className="p-5">
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
              <CatIcon className="w-3 h-3" />{cat.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${prio.bg} ${prio.text} ${prio.border}`}>
              {prio.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {rec.timeline}
            </span>
            {rec.priority === "high" && <Zap className="w-4 h-4 text-amber-400" />}
          </div>
        </div>

        {/* Title + description */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5">{rec.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{rec.description}</p>

        {/* Impact metrics */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-none">Score</div>
              <div className="text-sm font-bold text-green-600">+{rec.score_improvement_pts} pt</div>
            </div>
          </div>
          {rec.estimated_co2_reduction_pct > 0 && (
            <>
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-none">CO₂</div>
                  <div className="text-sm font-bold text-emerald-600">-{rec.estimated_co2_reduction_pct}%</div>
                </div>
              </div>
            </>
          )}
          <div className="ml-auto flex-shrink-0">
            <EffortIndicator effort={rec.effort} />
          </div>
        </div>

        {/* SMART goal */}
        {rec.smart_goal && (
          <div className="p-3 bg-green-50 rounded-xl border border-green-100 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">
              <Award className="w-3 h-3" /> SMART-mål
            </div>
            <p className="text-xs text-green-800 leading-relaxed">{rec.smart_goal}</p>
          </div>
        )}

        {/* Action steps toggle */}
        {rec.action_steps?.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex w-full items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors pt-2 border-t border-gray-100"
            >
              <span>{expanded ? "Skjul handlingstrin" : `${rec.action_steps.length} handlingstrin`}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expanded && (
              <div className="mt-3 space-y-2.5">
                {rec.action_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GapCategory({ title, gaps, catKey }: { title: string; gaps: string[]; catKey: string }) {
  const cat = CAT[catKey]
  const CatIcon = cat.icon
  if (!gaps.length) return null
  return (
    <div className={`rounded-2xl border p-5 ${cat.bg} ${cat.border}`}>
      <div className={`flex items-center gap-2 mb-3 ${cat.text}`}>
        <CatIcon className="w-4 h-4" />
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs font-semibold opacity-60 ml-auto">{gaps.length} mangler</span>
      </div>
      <div className="space-y-1.5">
        {gaps.map((gap, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${cat.bar} mt-1.5 flex-shrink-0`} />
            <span className="text-xs text-gray-600 leading-relaxed">{gap}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ImprovementsPage() {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("all")
  const [meta, setMeta] = useState({ companyName: "", userEmail: "", plan: "" })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const me = await getMe()
      setMeta({ userEmail: me.email, plan: me.subscription_plan || "free", companyName: "" })
      if (!me.company_id) { setLoading(false); return }
      const c = await getCompany(me.company_id)
      setMeta(m => ({ ...m, companyName: c.name }))
      const reports = await listReports()
      const completed = reports.filter((rep: { status: string }) => rep.status === "completed")
      if (!completed.length) { setLoading(false); return }
      const r = await getReport(completed[0].report_id).catch(() => null)
      if (r) setReport(r as ReportData)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const gaps = report?.identified_gaps || []
  const recs = (report?.recommendations || []) as Rec[]
  const filteredRecs = catFilter === "all" ? recs : recs.filter(r => r.category === catFilter)

  const totalGain   = recs.reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
  const quickWins   = recs.filter(r => r.effort === "low" || (r.priority === "high" && r.effort !== "high"))
  const gapsBycat   = { E: gaps.filter(g => gapCat(g) === "E"), S: gaps.filter(g => gapCat(g) === "S"), G: gaps.filter(g => gapCat(g) === "G") }

  const catTabs = [
    { key: "all", label: `Alle (${recs.length})` },
    { key: "E",   label: `Miljø (${recs.filter(r => r.category === "E").length})` },
    { key: "S",   label: `Sociale (${recs.filter(r => r.category === "S").length})` },
    { key: "G",   label: `Ledelse (${recs.filter(r => r.category === "G").length})` },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={meta.companyName} userEmail={meta.userEmail} subscriptionPlan={meta.plan} />
      <div className="ml-60 flex-1">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" /> Forbedringer & Handlingsplan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Identificerede mangler og SMART-mål iht. VSME Basic Modul</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No report yet */}
        {!loading && !report && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-lg font-semibold text-gray-700 mb-1">Ingen rapport endnu</div>
              <p className="text-sm text-gray-500 mb-4">Generer en VSME-rapport for at se forbedringsforslagene</p>
              <button onClick={() => router.push("/dashboard")} className="btn-primary">Gå til Dashboard</button>
            </div>
          </div>
        )}

        {/* Main content */}
        {report && (
          <div className="p-8 space-y-10 max-w-6xl">

            {/* ── Stats summary ─────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <div className="text-4xl font-bold text-gray-900">{gaps.length}</div>
                <div className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-wider">Mangler</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <div className="text-4xl font-bold text-gray-900">{recs.length}</div>
                <div className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-wider">Anbefalinger</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <div className="text-4xl font-bold text-green-600">+{totalGain}</div>
                <div className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-wider">Score-potentiale</div>
              </div>
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 text-center">
                <div className="text-4xl font-bold text-amber-600 flex items-center justify-center gap-1.5">
                  <Zap className="w-7 h-7" />{quickWins.length}
                </div>
                <div className="text-xs text-amber-700 mt-1.5 font-medium uppercase tracking-wider">Quick wins</div>
              </div>
            </div>

            {/* ── Recommendation cards ──────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Anbefalede tiltag</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Klik på et tiltag for at se handlingstrin</p>
                </div>
                <div className="flex gap-1.5">
                  {catTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setCatFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        catFilter === tab.key
                          ? "bg-green-500 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRecs.length === 0 ? (
                <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                  Ingen anbefalinger i denne kategori
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredRecs.map(rec => <RecCard key={rec.id} rec={rec} />)}
                </div>
              )}
            </section>

            {/* ── Identified gaps (categorised) ────────────────── */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-5">Identificerede mangler</h2>
              <div className="grid grid-cols-3 gap-4">
                <GapCategory title="Miljø"   gaps={gapsBycat.E} catKey="E" />
                <GapCategory title="Sociale" gaps={gapsBycat.S} catKey="S" />
                <GapCategory title="Ledelse" gaps={gapsBycat.G} catKey="G" />
              </div>
            </section>

            {/* ── 12-month roadmap ─────────────────────────────── */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-1">12-måneders handlingsplan</h2>
              <p className="text-sm text-gray-400 mb-5">Tiltag prioriteret efter indsats og effekt — start med Q1 for hurtige gevinster</p>

              <div className="grid grid-cols-4 gap-4">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                  const cfg   = QUARTER_CFG[q]
                  const qRecs = recs.filter(r => r.timeline === q)
                  return (
                    <div key={q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className={`${cfg.header} px-4 py-3`}>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{q}</span>
                          <span className="text-white/80 text-lg">{cfg.badge}</span>
                        </div>
                        <div className="text-white/80 text-xs mt-0.5">{cfg.months}</div>
                        <div className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{cfg.subtext}</div>
                      </div>

                      <div className="p-3 space-y-2">
                        {qRecs.length === 0 ? (
                          <div className="text-xs text-gray-300 text-center py-6">—</div>
                        ) : (
                          qRecs.map(rec => {
                            const cat = CAT[rec.category] || CAT.G
                            const CatIcon = cat.icon
                            return (
                              <div key={rec.id} className={`p-3 rounded-xl border ${cat.bg} ${cat.border}`}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <CatIcon className={`w-3 h-3 ${cat.text}`} />
                                  <span className={`font-bold text-[10px] uppercase tracking-wider ${cat.text}`}>{cat.label}</span>
                                  {rec.priority === "high" && <Zap className="w-3 h-3 text-amber-500 ml-auto" />}
                                </div>
                                <div className="font-semibold text-xs text-gray-800 leading-snug mb-1.5">{rec.title}</div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                  <span className="text-green-600">+{rec.score_improvement_pts}pt</span>
                                  {rec.estimated_co2_reduction_pct > 0 && (
                                    <span className="text-emerald-600">• -{rec.estimated_co2_reduction_pct}% CO₂</span>
                                  )}
                                  <span className="ml-auto">{
                                    { low: "⚡ Lav", medium: "🔧 Middel", high: "⏱ Høj" }[rec.effort] || ""
                                  }</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Quarter total */}
                      {qRecs.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Score-gevinst</span>
                            <span className="text-xs font-bold text-green-600">
                              +{qRecs.reduce((s, r) => s + (r.score_improvement_pts || 0), 0)} pt
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Score accumulation bar */}
              {recs.length > 0 && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Akkumuleret score-fremgang over 12 måneder</span>
                    <span className="text-sm font-bold text-green-600">+{totalGain} point total</span>
                  </div>
                  <div className="flex gap-1 h-6 rounded-full overflow-hidden">
                    {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                      const qPts = recs.filter(r => r.timeline === q).reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
                      const pct  = totalGain > 0 ? (qPts / totalGain) * 100 : 25
                      const colors: Record<string, string> = { Q1: "bg-green-500", Q2: "bg-blue-500", Q3: "bg-violet-500", Q4: "bg-orange-500" }
                      return (
                        <div
                          key={q}
                          className={`${colors[q]} flex items-center justify-center text-[10px] font-bold text-white transition-all`}
                          style={{ width: `${pct}%`, minWidth: pct > 0 ? "3rem" : "0" }}
                          title={`${q}: +${qPts} pt`}
                        >
                          {pct > 8 && `${q} +${qPts}`}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => {
                      const qPts = recs.filter(r => r.timeline === q).reduce((s, r) => s + (r.score_improvement_pts || 0), 0)
                      return (
                        <div key={q} className="text-center flex-1">
                          <div className="text-[10px] text-gray-400">{QUARTER_CFG[q].months}</div>
                          <div className="text-xs font-bold text-gray-700">+{qPts} pt</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  )
}
