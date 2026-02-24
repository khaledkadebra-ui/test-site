"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getReportStatus, getReport, getPdfUrl } from "@/lib/api"
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const RATING_COLORS: Record<string, string> = { A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", E: "#ef4444" }
const SCOPE_COLORS = ["#22c55e", "#3b82f6", "#a855f7"]

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [status, setStatus] = useState("processing")
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    pollStatus()
  }, [id])

  async function pollStatus() {
    try {
      const s = await getReportStatus(id)
      setStatus(s.status)
      if (s.status === "completed") {
        const r = await getReport(id)
        setReport(r)
      } else if (s.status === "processing") {
        setTimeout(pollStatus, 3000)
      }
    } catch {
      router.push("/dashboard")
    }
  }

  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const { download_url } = await getPdfUrl(id)
      window.open(download_url, "_blank")
    } catch {
      alert("PDF not available yet")
    } finally {
      setPdfLoading(false)
    }
  }

  if (status === "processing" || status === "draft") return <Processing />
  if (status === "failed") return <Failed />
  if (!report) return <Processing />

  const r = report as {
    esg_rating: string; esg_score_total: number; esg_score_e: number; esg_score_s: number; esg_score_g: number
    industry_percentile: number; total_co2e_tonnes: number; scope1_co2e_tonnes: number
    scope2_co2e_tonnes: number; scope3_co2e_tonnes: number
    executive_summary: string; co2_narrative: string; esg_narrative: string; roadmap_narrative: string
    identified_gaps: { priority: string; title: string; description: string }[]
    recommendations: { quarter: string; title: string }[]
    disclaimer: string; pdf_url?: string
  }

  const scopeData = [
    { name: "Scope 1", value: r.scope1_co2e_tonnes },
    { name: "Scope 2", value: r.scope2_co2e_tonnes },
    { name: "Scope 3", value: r.scope3_co2e_tonnes },
  ]

  const scoreData = [
    { name: "E", value: r.esg_score_e, fill: "#22c55e" },
    { name: "S", value: r.esg_score_s, fill: "#3b82f6" },
    { name: "G", value: r.esg_score_g, fill: "#a855f7" },
  ]

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
            <span className="text-slate-900 font-black text-xs">E</span>
          </div>
          <span className="font-bold">ESG Copilot</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/dashboard")} className="btn-secondary text-sm">← Dashboard</button>
          {r.pdf_url && (
            <button onClick={downloadPdf} className="btn-primary text-sm" disabled={pdfLoading}>
              {pdfLoading ? "…" : "↓ Download PDF"}
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Hero KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center" style={{ borderColor: RATING_COLORS[r.esg_rating] + "66" }}>
            <div className="text-5xl font-black mb-1" style={{ color: RATING_COLORS[r.esg_rating] }}>{r.esg_rating}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">ESG Rating</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-slate-100 mb-1">{r.esg_score_total.toFixed(1)}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">ESG Score / 100</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-slate-100 mb-1">{r.total_co2e_tonnes.toFixed(1)}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total tCO₂e</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-slate-100 mb-1">{Math.round(r.industry_percentile)}th</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Industry Percentile</div>
          </div>
        </div>

        {/* Executive summary */}
        <div className="card">
          <h2 className="section-title">Executive Summary</h2>
          <p className="text-slate-300 leading-relaxed">{r.executive_summary}</p>
        </div>

        {/* CO2 + ESG charts */}
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title">Carbon Footprint by Scope</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scopeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {scopeData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(2)} t`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {scopeData.map((s, i) => (
                <div key={s.name} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: SCOPE_COLORS[i] }} />
                    <span className="text-slate-400">{s.name}</span>
                  </span>
                  <span className="font-mono font-semibold">{s.value.toFixed(2)} t</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">ESG Score Breakdown</h2>
            {scoreData.map(({ name, value, fill }) => (
              <div key={name} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">
                    {name === "E" ? "Environmental (50%)" : name === "S" ? "Social (30%)" : "Governance (20%)"}
                  </span>
                  <span className="font-bold" style={{ color: fill }}>{value.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: fill }} />
                </div>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-3 flex justify-between">
              <span className="text-sm font-medium text-slate-300">Total ESG Score</span>
              <span className="font-bold text-green-400">{r.esg_score_total.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Narratives */}
        <div className="card">
          <h2 className="section-title">CO₂ Analysis</h2>
          <p className="text-slate-300 leading-relaxed">{r.co2_narrative}</p>
        </div>
        <div className="card">
          <h2 className="section-title">ESG Performance</h2>
          <p className="text-slate-300 leading-relaxed">{r.esg_narrative}</p>
        </div>

        {/* Gaps */}
        <div className="card">
          <h2 className="section-title">Priority Actions</h2>
          <div className="space-y-3">
            {r.identified_gaps.map((gap, i) => (
              <div key={i} className={`flex gap-4 p-3 rounded-lg border-l-4 ${
                gap.priority === "high" ? "bg-red-500/5 border-red-500" :
                gap.priority === "medium" ? "bg-yellow-500/5 border-yellow-500" :
                "bg-green-500/5 border-green-500"
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider pt-0.5 min-w-[50px] ${
                  gap.priority === "high" ? "text-red-400" : gap.priority === "medium" ? "text-yellow-400" : "text-green-400"
                }`}>{gap.priority}</span>
                <div>
                  <div className="font-semibold text-sm text-slate-100">{gap.title}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{gap.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="card">
          <h2 className="section-title">12-Month Roadmap</h2>
          <p className="text-slate-300 text-sm mb-4">{r.roadmap_narrative}</p>
          <div className="grid grid-cols-4 gap-3">
            {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => (
              <div key={q} className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-900 px-3 py-2 text-xs font-bold text-green-400 uppercase tracking-wider">{q}</div>
                <div className="p-3 space-y-2">
                  {r.recommendations.filter(a => a.quarter === q).map((a, i) => (
                    <div key={i} className="text-xs text-slate-400 border-l-2 border-green-500 pl-2">{a.title}</div>
                  ))}
                  {r.recommendations.filter(a => a.quarter === q).length === 0 && (
                    <div className="text-xs text-slate-600">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-slate-500 border border-slate-800 rounded-lg p-4 leading-relaxed">
          <strong className="text-slate-400">Disclaimer:</strong> {r.disclaimer}
        </div>
      </main>
    </div>
  )
}

function Processing() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-slate-100 font-semibold">Generating your ESG report…</div>
        <div className="text-slate-400 text-sm mt-1">This takes ~30 seconds. Page refreshes automatically.</div>
      </div>
    </div>
  )
}

function Failed() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-4xl mb-4">✗</div>
        <div className="text-slate-100 font-semibold">Report generation failed</div>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary mt-4">Back to dashboard</button>
      </div>
    </div>
  )
}
