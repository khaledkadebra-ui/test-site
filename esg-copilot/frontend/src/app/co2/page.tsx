"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany, listReports, getReport, agentBenchmark, agentClimateRisk } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Wind, AlertCircle, Loader2, BarChart3, TrendingUp, Flame } from "lucide-react"

const SCOPE_COLORS = ["#f97316", "#eab308", "#a855f7"]

const LABELS: Record<string, string> = {
  natural_gas: "Naturgas", diesel: "Diesel", petrol: "Benzin",
  heating_oil: "Fyringsolie", lpg: "LPG/Flaskegas",
  company_car: "Firmabiler", company_van: "Varevogne",
  electricity: "El (netto)", district_heating: "Fjernvarme",
  air_short_haul: "Kortdistancefly", air_long_haul: "Langdistancefly",
  rail: "Tog", rental_car: "Lejebil", taxi: "Taxa",
  employee_commuting: "Medarbejderpendling",
  purchased_goods: "Indkøbte varer (Kat. 1)",
}

export default function CO2Page() {
  const router = useRouter()
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [company, setCompany] = useState<{ name: string; industry_code: string; country_code: string; employee_count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [plan, setPlan] = useState("")
  const [noReport, setNoReport] = useState(false)

  // Agent analysis state
  const [benchmark, setBenchmark] = useState<Record<string, unknown> | null>(null)
  const [climateRisk, setClimateRisk] = useState<Record<string, unknown> | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const me = await getMe()
      setUserEmail(me.email)
      setPlan(me.subscription_plan || "free")
      if (!me.company_id) { setNoReport(true); setLoading(false); return }
      const c = await getCompany(me.company_id)
      setCompanyName(c.name)
      setCompany(c)
      const reports = await listReports()
      const completed = reports.filter((rep: { status: string }) => rep.status === "completed")
      if (!completed.length) { setNoReport(true); setLoading(false); return }
      const r = await getReport(completed[0].report_id).catch(() => null)
      if (r) setReport(r)
      else setNoReport(true)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  async function runAgentAnalysis() {
    if (!report || !company) return
    setAgentLoading(true)
    try {
      const r = report as { esg_score_total: number; total_co2e_tonnes: number; scope1_co2e_tonnes: number; scope2_co2e_tonnes: number; scope3_co2e_tonnes: number }
      const [bench, risk] = await Promise.all([
        agentBenchmark({
          industry_code: company.industry_code,
          esg_score_total: r.esg_score_total,
          total_co2e_tonnes: r.total_co2e_tonnes,
          employee_count: company.employee_count,
        }).catch(() => null),
        agentClimateRisk({
          industry_code: company.industry_code,
          country_code: company.country_code,
          scope1_co2e: r.scope1_co2e_tonnes,
          scope2_co2e: r.scope2_co2e_tonnes,
          scope3_co2e: r.scope3_co2e_tonnes,
        }).catch(() => null),
      ])
      if (bench) setBenchmark(bench)
      if (risk) setClimateRisk(risk)
    } finally {
      setAgentLoading(false)
    }
  }

  if (loading) return <PageShell companyName={companyName} userEmail={userEmail} plan={plan}><Loading /></PageShell>
  if (noReport || !report) return <PageShell companyName={companyName} userEmail={userEmail} plan={plan}><NoData /></PageShell>

  const r = report as {
    total_co2e_tonnes: number; scope1_co2e_tonnes: number
    scope2_co2e_tonnes: number; scope3_co2e_tonnes: number
    scope1_breakdown: Record<string, { kg_co2e: number; input_value: number; input_unit: string; factor_value?: number; source_citation?: string }>
    scope2_breakdown: Record<string, { kg_co2e: number; input_value: number; input_unit: string; factor_value?: number; source_citation?: string }>
    scope3_breakdown: Record<string, { kg_co2e: number; input_value: number; input_unit: string; factor_value?: number; source_citation?: string }>
    esg_rating: string
  }

  const scopeData = [
    { name: "Scope 1 — Direkte", value: r.scope1_co2e_tonnes },
    { name: "Scope 2 — Energi", value: r.scope2_co2e_tonnes },
    { name: "Scope 3 — Værdikæde", value: r.scope3_co2e_tonnes },
  ]

  const barData = [
    { name: "Scope 1", tonnes: r.scope1_co2e_tonnes, fill: "#f97316" },
    { name: "Scope 2", tonnes: r.scope2_co2e_tonnes, fill: "#eab308" },
    { name: "Scope 3", tonnes: r.scope3_co2e_tonnes, fill: "#a855f7" },
  ]

  const allBreakdowns = [
    { scope: "Scope 1", color: "#f97316", data: r.scope1_breakdown || {} },
    { scope: "Scope 2", color: "#eab308", data: r.scope2_breakdown || {} },
    { scope: "Scope 3", color: "#a855f7", data: r.scope3_breakdown || {} },
  ]

  return (
    <PageShell companyName={companyName} userEmail={userEmail} plan={plan}>
      <div className="p-8 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wind className="w-6 h-6 text-blue-500" /> CO₂ Emissioner
          </h1>
          <p className="text-sm text-gray-500 mt-1">GHG-opgørelse iht. GHG Protocol · Energistyrelsen 2024 emissionsfaktorer</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center border-t-4 border-t-gray-800">
            <div className="text-4xl font-bold text-gray-900">{r.total_co2e_tonnes.toFixed(1)}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Total tCO₂e</div>
          </div>
          {scopeData.map((s, i) => (
            <div key={s.name} className="card text-center" style={{ borderTop: `4px solid ${SCOPE_COLORS[i]}` }}>
              <div className="text-3xl font-bold text-gray-900">{s.value.toFixed(1)}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{s.name.split(" — ")[0]}</div>
              <div className="text-xs text-gray-400 mt-0.5">{((s.value / r.total_co2e_tonnes) * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h2 className="section-title">Scope-fordeling</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scopeData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {scopeData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(2)} tCO₂e`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {scopeData.map((s, i) => (
                <div key={s.name} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCOPE_COLORS[i] }} />
                    <span className="text-gray-500">{s.name}</span>
                  </span>
                  <span className="font-semibold text-gray-800">{s.value.toFixed(2)} t</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Sammenligning pr. scope</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit=" t" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(2)} tCO₂e`]} />
                <Bar dataKey="tonnes" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed breakdown */}
        {allBreakdowns.map(({ scope, color, data }) => {
          const rows = Object.entries(data).filter(([, v]) => v.kg_co2e > 0)
          if (!rows.length) return null
          return (
            <div key={scope} className="card">
              <h2 className="section-title flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {scope} — Detaljeret opgørelse
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-500 font-semibold">Kilde</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-semibold">Input</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-semibold">Faktor</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-semibold">kg CO₂e</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-semibold">Kilde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([key, v]) => (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-gray-700">{LABELS[key] || key}</td>
                        <td className="py-2 text-right text-gray-600">{v.input_value?.toFixed(1)} {v.input_unit}</td>
                        <td className="py-2 text-right text-gray-400 text-xs">{v.factor_value ? `${v.factor_value}` : "—"}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">{v.kg_co2e.toFixed(1)}</td>
                        <td className="py-2 text-right text-gray-400 text-xs truncate max-w-[120px]">{v.source_citation || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* AI Agent Analysis Panel */}
        {!benchmark && !climateRisk && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-emerald-900 text-sm">AI Benchmark & Klimarisikoanalyse</div>
              <div className="text-xs text-emerald-700 mt-0.5">Sammenlign med branchepeer og få klimarisikovurdering for din sektor</div>
            </div>
            <button
              onClick={runAgentAnalysis}
              disabled={agentLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60"
            >
              {agentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {agentLoading ? "Analyserer..." : "Kør AI-analyse"}
            </button>
          </div>
        )}

        {benchmark && (
          <div className="card">
            <h2 className="section-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Branche-benchmark</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-gray-900">{benchmark.esg_percentile as number}.</div>
                <div className="text-xs text-gray-500 mt-0.5">percentil (ESG)</div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-3">
                <div className={`text-2xl font-bold ${(benchmark.esg_vs_avg as number) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {(benchmark.esg_vs_avg as number) >= 0 ? "+" : ""}{benchmark.esg_vs_avg as number}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">vs. branchegennemsnit</div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-3">
                <div className={`text-2xl font-bold ${(benchmark.co2_vs_avg_pct as number) <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {(benchmark.co2_vs_avg_pct as number) > 0 ? "+" : ""}{benchmark.co2_vs_avg_pct as number}%
                </div>
                <div className="text-xs text-gray-500 mt-0.5">CO₂/mda. vs. snit</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{benchmark.summary as string}</p>
          </div>
        )}

        {climateRisk && (
          <div className="card">
            <h2 className="section-title flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Klimarisikovurdering
              <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${
                (climateRisk.risk_level as string) === "Høj" ? "bg-red-100 text-red-700" :
                (climateRisk.risk_level as string) === "Moderat" ? "bg-amber-100 text-amber-700" :
                "bg-green-100 text-green-700"}`}>
                {climateRisk.risk_level as string} risiko
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 font-semibold">Fysisk risiko</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(climateRisk.physical_score as number) * 10}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{climateRisk.physical_score as number}/10</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-semibold">Transitionsrisiko</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(climateRisk.transition_score as number) * 10}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{climateRisk.transition_score as number}/10</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{climateRisk.narrative as string}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-4 leading-relaxed">
          <strong className="text-gray-500">Emissionsfaktorer:</strong> Energistyrelsen 2024 (el DK: 0,136 kg CO₂e/kWh), DEFRA 2024 (transport, brændstoffer), IEA 2024 (øvrige lande). Beregnet iht. GHG Protocol Corporate Standard.
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ companyName, userEmail, plan, children }: { companyName: string; userEmail: string; plan: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={companyName} userEmail={userEmail} subscriptionPlan={plan} />
      <div className="ml-60 flex-1">{children}</div>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
}

function NoData() {
  const router = useRouter()
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <div className="text-lg font-semibold text-gray-700 mb-1">Ingen rapport endnu</div>
        <p className="text-sm text-gray-500 mb-4">Generer din første VSME-rapport for at se CO₂-opgørelsen</p>
        <button onClick={() => router.push("/dashboard")} className="btn-primary">Gå til Dashboard</button>
      </div>
    </div>
  )
}
