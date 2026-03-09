"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { getMe, getEsgTrends, getSubscriptionStatus, EsgTrends } from "@/lib/api"

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserInfo {
  email: string
  company_id: string | null
  company?: { name: string }
  subscription_plan?: string
}

interface SubStatus {
  has_active_subscription: boolean
  plan: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function DeltaBadge({ value, unit = "point", invertGood = false }: { value: number | null | undefined; unit?: string; invertGood?: boolean }) {
  if (value === null || value === undefined) return <span className="text-gray-400 text-sm">—</span>
  const positive = invertGood ? value < 0 : value > 0
  const neutral = Math.abs(value) <= 0.5
  if (neutral) return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-sm font-medium">
      <Minus className="w-3.5 h-3.5" /> Uændret
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {value > 0 ? "+" : ""}{value.toFixed(1)} {unit}
    </span>
  )
}

function ScoreCard({
  label, score, delta, rating, invertGood = false,
}: {
  label: string; score: number | null | undefined; delta: number | null | undefined;
  rating?: string | null; invertGood?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-gray-900">
          {score != null ? score.toFixed(1) : "—"}
        </span>
        {rating && (
          <span className="mb-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{rating}</span>
        )}
      </div>
      <div className="mt-2">
        <DeltaBadge value={delta} invertGood={invertGood} />
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [trends, setTrends] = useState<EsgTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    Promise.all([getMe(), getSubscriptionStatus(), getEsgTrends()])
      .then(([me, s, t]) => {
        setUser(me)
        setSub(s)
        setTrends(t)
      })
      .catch((e) => setError(e?.response?.data?.detail || "Kunne ikke hente historik"))
      .finally(() => setLoading(false))
  }, [router])

  const chartData = trends?.snapshots?.map((s) => ({
    label: s.label,
    "ESG Total": s.esg_score_total ?? undefined,
    "Miljø (E)": s.esg_score_e ?? undefined,
    "Social (S)": s.esg_score_s ?? undefined,
    "Ledelse (G)": s.esg_score_g ?? undefined,
    "CO₂ (t)": s.total_co2e_tonnes ?? undefined,
  })) ?? []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        companyName={user?.company?.name}
        userEmail={user?.email}
        subscriptionPlan={user?.subscription_plan}
      />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">ESG Historik</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Spor udviklingen i din ESG-score og CO₂-aftryk over tid.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Indlæser historik…</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          )}

          {!loading && !error && !trends?.has_data && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h2 className="text-gray-700 font-semibold text-base mb-1">Ingen historik endnu</h2>
              <p className="text-gray-500 text-sm mb-5">
                Generer din første ESG-rapport for at begynde at spore din udvikling.
              </p>
              <button
                onClick={() => router.push("/submit")}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Indsend data <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!loading && trends?.has_data && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <ScoreCard
                  label="ESG Total"
                  score={trends.latest?.esg_score_total}
                  delta={trends.changes?.esg_score_total}
                  rating={trends.latest?.esg_rating}
                />
                <ScoreCard label="Miljø (E)" score={trends.latest?.esg_score_e} delta={trends.changes?.esg_score_e} />
                <ScoreCard label="Social (S)" score={trends.latest?.esg_score_s} delta={trends.changes?.esg_score_s} />
                <ScoreCard label="Ledelse (G)" score={trends.latest?.esg_score_g} delta={trends.changes?.esg_score_g} />
              </div>

              {/* CO2 card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <ScoreCard
                  label="CO₂ Total (tCO₂e)"
                  score={trends.latest?.total_co2e_tonnes}
                  delta={trends.changes?.total_co2e_tonnes}
                  invertGood
                />
                <ScoreCard label="Scope 1" score={trends.latest?.scope1_co2e_tonnes} delta={null} invertGood />
                <ScoreCard label="Scope 2" score={trends.latest?.scope2_co2e_tonnes} delta={null} invertGood />
                <ScoreCard label="Scope 3" score={trends.latest?.scope3_co2e_tonnes} delta={null} invertGood />
              </div>

              {/* ESG score chart */}
              {chartData.length >= 2 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">ESG Score Udvikling</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="ESG Total" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Miljø (E)" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="Social (S)" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="Ledelse (G)" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* CO2 chart */}
              {chartData.length >= 2 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">CO₂ Aftryk (tCO₂e)</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="CO₂ (t)" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Snapshot table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Alle Målinger</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ESG</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">E</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">S</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">G</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">CO₂ (t)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...(trends.snapshots ?? [])].reverse().map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-700">{s.label}</td>
                          <td className="px-4 py-3 text-right text-gray-900 font-semibold">{s.esg_score_total?.toFixed(1) ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-blue-600">{s.esg_score_e?.toFixed(1) ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-amber-600">{s.esg_score_s?.toFixed(1) ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-purple-600">{s.esg_score_g?.toFixed(1) ?? "—"}</td>
                          <td className="px-4 py-3 text-right">
                            {s.esg_rating ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{s.esg_rating}</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600">{s.total_co2e_tonnes?.toFixed(1) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
