"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany, listSubmissions, getReport } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const POLICY_ITEMS = [
  { key: "has_esg_policy", label: "ESG-/bæredygtighedspolitik", category: "G" },
  { key: "has_energy_reduction_target", label: "Energireduktionstiltag", category: "E" },
  { key: "has_net_zero_target", label: "Net-nul-mål", category: "E" },
  { key: "has_health_safety_policy", label: "Arbejdsmiljøpolitik", category: "S" },
  { key: "has_diversity_policy", label: "Diversitetspolitik", category: "S" },
  { key: "has_anti_corruption_policy", label: "Anti-korruptionspolitik", category: "G" },
  { key: "has_data_privacy_policy", label: "Databeskyttelsespolitik (GDPR)", category: "G" },
  { key: "has_code_of_conduct", label: "Adfærdskodeks", category: "G" },
  { key: "has_training_program", label: "Uddannelsesprogram", category: "S" },
  { key: "has_waste_policy", label: "Affaldspolitik", category: "E" },
  { key: "has_water_policy", label: "Vandpolitik", category: "E" },
  { key: "has_board_esg_oversight", label: "ESG-tilsyn fra bestyrelse", category: "G" },
]

const CAT_COLOR: Record<string, string> = { E: "text-green-600 bg-green-50 border-green-200", S: "text-blue-600 bg-blue-50 border-blue-200", G: "text-purple-600 bg-purple-50 border-purple-200" }

export default function GoalsPage() {
  const router = useRouter()
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [submission, setSubmission] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
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
      if (!subs.length) { setLoading(false); return }
      const latest = subs[0]
      setSubmission(latest)
      if (latest.status === "processed") {
        const r = await getReport(latest.id).catch(() => null)
        if (r) setReport(r)
      }
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const policyData = (submission as Record<string, Record<string, unknown>> | null)?.policy_data || {}
  const hasNetZero = policyData?.has_net_zero_target as boolean
  const netZeroYear = policyData?.net_zero_target_year as number | null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={meta.companyName} userEmail={meta.userEmail} subscriptionPlan={meta.plan} />
      <div className="ml-60 flex-1">
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Mål & Målsætninger
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Overblik over ESG-politikker, klimamål og fremskridt</p>
        </div>

        {loading && <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}

        {!loading && (
          <div className="p-8 space-y-6 max-w-4xl">
            {/* ESG Score summary */}
            {report && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Samlet ESG", value: (report.esg_score_total as number)?.toFixed(1), sub: "/ 100", color: "border-t-gray-800" },
                  { label: "Miljø (E)", value: (report.esg_score_e as number)?.toFixed(1), sub: "/ 100", color: "border-t-green-500" },
                  { label: "Sociale (S)", value: (report.esg_score_s as number)?.toFixed(1), sub: "/ 100", color: "border-t-blue-500" },
                  { label: "Ledelse (G)", value: (report.esg_score_g as number)?.toFixed(1), sub: "/ 100", color: "border-t-purple-500" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className={`card text-center border-t-4 ${color}`}>
                    <div className="text-3xl font-bold text-gray-900">{value ?? "—"}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Climate target */}
            <div className="card">
              <h2 className="section-title">Klimamål</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                {hasNetZero ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Net-nul mål sat</div>
                      <div className="text-sm text-gray-500">
                        {netZeroYear ? `Målår: ${netZeroYear}` : "Intet målår angivet — anbefal at angive specifikt år"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Intet net-nul mål</div>
                      <div className="text-sm text-gray-500">Opsæt et net-nul mål for at øge ESG-scoren (op til 25 points)</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Policy checklist */}
            <div className="card">
              <h2 className="section-title">ESG-politikker & Procedurer</h2>
              <div className="space-y-2">
                {POLICY_ITEMS.map(({ key, label, category }) => {
                  const active = !!(submission && (submission as Record<string, Record<string, unknown>>)?.policy_data?.[key])
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        {active
                          ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        }
                        <span className={`text-sm ${active ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CAT_COLOR[category]}`}>{category}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Politikker på plads</span>
                <span className="font-bold text-green-600">
                  {POLICY_ITEMS.filter(({ key }) => !!(submission as Record<string, Record<string, unknown>> | null)?.policy_data?.[key]).length} / {POLICY_ITEMS.length}
                </span>
              </div>
            </div>

            {!report && !loading && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                Generer en VSME-rapport for at se din fulde ESG-score og detaljerede mål.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
