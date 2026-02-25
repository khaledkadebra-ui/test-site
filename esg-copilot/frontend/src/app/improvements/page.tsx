"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany, listSubmissions, getReport } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Target, AlertCircle, Zap } from "lucide-react"

type Gap = { priority: string; title: string; description: string }
type Rec = { quarter: string; title: string; smart_goal?: string }

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-50 border-red-200 text-red-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  low:    "bg-green-50 border-green-200 text-green-700",
}
const PRIORITY_DK: Record<string, string> = { high: "Høj", medium: "Middel", low: "Lav" }
const QUARTER_DK: Record<string, string> = { Q1: "Kvartal 1", Q2: "Kvartal 2", Q3: "Kvartal 3", Q4: "Kvartal 4" }

export default function ImprovementsPage() {
  const router = useRouter()
  const [report, setReport] = useState<{ identified_gaps: Gap[]; recommendations: Rec[]; improvements_narrative: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [meta, setMeta] = useState({ companyName: "", userEmail: "", plan: "" })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const me = await getMe()
      setMeta({ userEmail: me.email, plan: me.subscription_plan || "free", companyName: "" })
      if (!me.company_id) { setLoading(false); return }
      const c = await getCompany(me.company_id)
      setMeta(m => ({ ...m, companyName: c.name }))
      const subs = await listSubmissions(me.company_id)
      const processed = subs.filter((s: { status: string }) => s.status === "processed")
      if (!processed.length) { setLoading(false); return }
      const r = await getReport(processed[0].id).catch(() => null)
      if (r) setReport(r as typeof report)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const gaps = report?.identified_gaps || []
  const recs = report?.recommendations || []
  const filtered = filter === "all" ? gaps : gaps.filter(g => g.priority === filter)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={meta.companyName} userEmail={meta.userEmail} subscriptionPlan={meta.plan} />
      <div className="ml-60 flex-1">
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" /> Forbedringer & Handlingsplan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Identificerede mangler og SMART-mål iht. VSME Basic Modul</p>
        </div>

        {loading && <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}

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

        {report && (
          <div className="p-8 space-y-6 max-w-5xl">
            {/* Quick wins banner */}
            {gaps.filter(g => g.priority === "high").length > 0 && (
              <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-green-800 mb-1">
                    {gaps.filter(g => g.priority === "high").length} høj-prioritets mangler identificeret
                  </div>
                  <p className="text-sm text-green-700">
                    Adresser disse først for den største ESG-score-forbedring.
                  </p>
                </div>
              </div>
            )}

            {/* AI narrative */}
            {report.improvements_narrative && (
              <div className="card border-l-4 border-l-green-500">
                <h2 className="section-title text-green-700">AI-analyse: Foreslåede tiltag</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{report.improvements_narrative}</p>
              </div>
            )}

            {/* Filter + gaps */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title mb-0">Identificerede mangler ({gaps.length})</h2>
                <div className="flex gap-1.5">
                  {(["all", "high", "medium", "low"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filter === f
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {f === "all" ? "Alle" : PRIORITY_DK[f]}
                      {f !== "all" && <span className="ml-1 opacity-70">({gaps.filter(g => g.priority === f).length})</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {filtered.map((gap, i) => (
                  <div key={i} className={`flex gap-4 p-4 rounded-xl border ${PRIORITY_STYLE[gap.priority] || PRIORITY_STYLE.low}`}>
                    <span className="text-xs font-bold uppercase tracking-wider pt-0.5 min-w-[55px] opacity-70">
                      {PRIORITY_DK[gap.priority] || gap.priority}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{gap.title}</div>
                      <div className="text-xs opacity-75 mt-0.5 leading-relaxed">{gap.description}</div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">Ingen mangler i denne kategori</div>
                )}
              </div>
            </div>

            {/* 12-month roadmap */}
            {recs.length > 0 && (
              <div className="card">
                <h2 className="section-title">12-måneders handlingsplan</h2>
                <div className="grid grid-cols-4 gap-4">
                  {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => (
                    <div key={q} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      <div className="bg-green-500 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">
                        {QUARTER_DK[q]}
                      </div>
                      <div className="p-3 space-y-2">
                        {recs.filter(r => r.quarter === q).map((r, i) => (
                          <div key={i} className="text-xs text-gray-600 border-l-2 border-green-400 pl-2 leading-relaxed">
                            <div className="font-medium">{r.title}</div>
                            {r.smart_goal && <div className="text-gray-400 mt-0.5">{r.smart_goal}</div>}
                          </div>
                        ))}
                        {recs.filter(r => r.quarter === q).length === 0 && (
                          <div className="text-xs text-gray-300">—</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
