"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getReportStatus, getReport, getPdfUrl } from "@/lib/api"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import Sidebar from "@/components/Sidebar"
import { TrendingUp, Wind, Users, Building2, Download, ArrowLeft, Loader2, FileDown } from "lucide-react"

const RATING_COLOR: Record<string, string> = { A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", E: "#ef4444" }
const SCOPE_COLORS = ["#22c55e", "#3b82f6", "#a855f7"]
const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-50 border-red-200 text-red-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  low:    "bg-green-50 border-green-200 text-green-700",
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [status, setStatus] = useState("processing")
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => { if (id) pollStatus() }, [id])

  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const data = await getPdfUrl(id)
      if (data.pdf_url) {
        window.open(data.pdf_url, "_blank")
      } else {
        window.print()
      }
    } catch {
      window.print()
    } finally {
      setPdfLoading(false)
    }
  }

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
    disclaimer: string
  }

  const scopeData = [
    { name: "Scope 1 — Direct",      value: r.scope1_co2e_tonnes },
    { name: "Scope 2 — Energy",       value: r.scope2_co2e_tonnes },
    { name: "Scope 3 — Value chain",  value: r.scope3_co2e_tonnes },
  ]

  const ratingColor = RATING_COLOR[r.esg_rating] || "#6b7280"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="btn-secondary flex items-center gap-1.5 py-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ESG Report</h1>
              <p className="text-sm text-gray-500">AI-generated · DEFRA 2023 emission factors</p>
            </div>
          </div>
          <button
            className="btn-primary flex items-center gap-2 py-2"
            onClick={downloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
              : <><FileDown className="w-4 h-4" /> Download PDF</>
            }
          </button>
        </div>

        <div className="p-8 space-y-6 max-w-5xl">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card text-center" style={{ borderTop: `3px solid ${ratingColor}` }}>
              <div className="text-5xl font-black mb-1" style={{ color: ratingColor }}>{r.esg_rating}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ESG Rating</div>
            </div>
            <div className="card text-center border-t-[3px] border-t-green-400">
              <div className="text-4xl font-bold text-gray-900 mb-1">{r.esg_score_total.toFixed(1)}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score / 100</div>
            </div>
            <div className="card text-center border-t-[3px] border-t-blue-400">
              <div className="text-4xl font-bold text-gray-900 mb-1">{r.total_co2e_tonnes.toFixed(1)}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total tCO₂e</div>
            </div>
            <div className="card text-center border-t-[3px] border-t-purple-400">
              <div className="text-4xl font-bold text-gray-900 mb-1">{Math.round(r.industry_percentile)}<span className="text-2xl">th</span></div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry %ile</div>
            </div>
          </div>

          {/* Executive summary */}
          <div className="card">
            <h2 className="section-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Executive Summary</h2>
            <p className="text-gray-600 leading-relaxed text-sm">{r.executive_summary}</p>
          </div>

          {/* CO2 + ESG charts */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title flex items-center gap-2"><Wind className="w-4 h-4 text-blue-500" /> Carbon Footprint by Scope</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={scopeData} cx="50%" cy="50%" outerRadius={72} innerRadius={36} dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
              <h2 className="section-title">ESG Score Breakdown</h2>
              {[
                { name: "Environmental", abbr: "E", value: r.esg_score_e, weight: "50%", color: "#22c55e", icon: Wind },
                { name: "Social",        abbr: "S", value: r.esg_score_s, weight: "30%", color: "#3b82f6", icon: Users },
                { name: "Governance",   abbr: "G", value: r.esg_score_g, weight: "20%", color: "#a855f7", icon: Building2 },
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
                <span className="text-sm font-semibold text-gray-700">Total ESG Score</span>
                <span className="text-lg font-bold text-green-600">{r.esg_score_total.toFixed(1)} / 100</span>
              </div>
            </div>
          </div>

          {/* Narratives */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title">CO₂ Analysis</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{r.co2_narrative}</p>
            </div>
            <div className="card">
              <h2 className="section-title">ESG Performance</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{r.esg_narrative}</p>
            </div>
          </div>

          {/* Priority actions */}
          <div className="card">
            <h2 className="section-title">Priority Actions</h2>
            <div className="space-y-3">
              {r.identified_gaps.map((gap, i) => (
                <div key={i} className={`flex gap-4 p-4 rounded-xl border ${PRIORITY_STYLE[gap.priority] || PRIORITY_STYLE.low}`}>
                  <span className="text-xs font-bold uppercase tracking-wider pt-0.5 min-w-[45px] opacity-70">{gap.priority}</span>
                  <div>
                    <div className="font-semibold text-sm">{gap.title}</div>
                    <div className="text-xs opacity-75 mt-0.5 leading-relaxed">{gap.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div className="card">
            <h2 className="section-title">12-Month Roadmap</h2>
            <p className="text-gray-500 text-sm mb-5">{r.roadmap_narrative}</p>
            <div className="grid grid-cols-4 gap-4">
              {(["Q1", "Q2", "Q3", "Q4"] as const).map(q => (
                <div key={q} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-green-500 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">{q}</div>
                  <div className="p-3 space-y-2">
                    {r.recommendations.filter(a => a.quarter === q).map((a, i) => (
                      <div key={i} className="text-xs text-gray-600 border-l-2 border-green-400 pl-2 leading-relaxed">{a.title}</div>
                    ))}
                    {r.recommendations.filter(a => a.quarter === q).length === 0 && (
                      <div className="text-xs text-gray-300">—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-4 leading-relaxed">
            <span className="font-semibold text-gray-500">Disclaimer: </span>{r.disclaimer}
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
          <div className="text-lg font-bold text-gray-900 mb-1">Generating your ESG report…</div>
          <div className="text-gray-500 text-sm">This takes about 30 seconds. Page refreshes automatically.</div>
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
          <div className="text-lg font-bold text-gray-900 mb-1">Report generation failed</div>
          <p className="text-gray-500 text-sm mb-5">Something went wrong. Please try again.</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">Back to dashboard</button>
        </div>
      </div>
    </div>
  )
}
