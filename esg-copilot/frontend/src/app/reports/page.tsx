"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany } from "@/lib/api"
import api from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { FileText, ExternalLink, AlertCircle } from "lucide-react"

type ReportSummary = {
  report_id: string
  submission_id: string
  status: string
  version: number
  created_at: string
  completed_at: string | null
  pdf_ready: boolean
  esg_score_total: number | null
  esg_rating: string | null
  total_co2e_tonnes: number | null
}

const RATING_COLOR: Record<string, string> = { A: "text-green-600 bg-green-50", B: "text-lime-600 bg-lime-50", C: "text-yellow-600 bg-yellow-50", D: "text-orange-600 bg-orange-50", E: "text-red-600 bg-red-50" }

const STATUS_DK: Record<string, string> = { completed: "Afsluttet", processing: "Genererer…", failed: "Fejlet", draft: "Kladde" }
const STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-gray-50 text-gray-600 border-gray-200",
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ companyName: "", userEmail: "", plan: "" })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const me = await getMe()
      setMeta({ userEmail: me.email, plan: me.subscription_plan || "free", companyName: "" })
      if (me.company_id) {
        const c = await getCompany(me.company_id)
        setMeta(m => ({ ...m, companyName: c.name }))
      }
      const r = await api.get("/reports")
      setReports(r.data || [])
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={meta.companyName} userEmail={meta.userEmail} subscriptionPlan={meta.plan} />
      <div className="ml-60 flex-1">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" /> VSME Rapporter
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Alle genererede VSME-bæredygtighedsrapporter</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">
            + Ny rapport
          </button>
        </div>

        <div className="p-8 max-w-5xl">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="card text-center py-16">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-700 mb-2">Ingen rapporter endnu</div>
              <p className="text-sm text-gray-500 mb-5">Generer din første VSME-rapport fra dashboardet</p>
              <button onClick={() => router.push("/dashboard")} className="btn-primary">Gå til Dashboard</button>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dato</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ESG Score</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CO₂e total</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.report_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-800">
                            {new Date(r.created_at).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                          <div className="text-xs text-gray-400">v{r.version}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[r.status] || STATUS_STYLE.draft}`}>
                            {STATUS_DK[r.status] || r.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {r.esg_rating ? (
                            <span className={`text-lg font-black px-2.5 py-1 rounded-xl ${RATING_COLOR[r.esg_rating] || ""}`}>
                              {r.esg_rating}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-semibold text-gray-800">
                            {r.esg_score_total != null ? r.esg_score_total.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm text-gray-600">
                            {r.total_co2e_tonnes != null ? `${r.total_co2e_tonnes.toFixed(1)} t` : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status === "completed" && (
                              <button
                                onClick={() => router.push(`/report/${r.report_id}`)}
                                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Se rapport
                              </button>
                            )}
                            {r.status === "failed" && (
                              <span className="text-xs text-red-500">Fejlet</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
