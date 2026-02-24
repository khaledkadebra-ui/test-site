"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getMe, getCompany, listSubmissions, createCompany, createSubmission } from "@/lib/api"
import api from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Plus, FileText, TrendingUp, Leaf, ChevronRight, ArrowRight, Mail, CheckCircle, Zap, BarChart3, Award } from "lucide-react"

interface Submission {
  id: string           // API returns 'id'
  reporting_year: number
  status: string
}

interface Company {
  id: string           // API returns 'id'
  name: string
  industry_code: string
  country_code: string
  employee_count: number
}

const STATUS_BADGE: Record<string, string> = {
  incomplete: "bg-amber-50 text-amber-700 border border-amber-200",
  submitted:  "bg-blue-50 text-blue-700 border border-blue-200",
  processed:  "bg-green-50 text-green-700 border border-green-200",
}

const STATUS_LABEL: Record<string, string> = {
  incomplete: "In Progress",
  submitted:  "Submitted",
  processed:  "Completed",
}

function RingChart({ pct, color, size = 84 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle" fontWeight="700" fontSize={14} fill="#111827">
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name: string; email: string; company_id?: string; email_verified?: boolean; subscription_plan?: string } | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [companyForm, setCompanyForm] = useState({ name: "", industry_code: "technology", country_code: "DK", employee_count: 10, revenue_eur: 1000000 })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [verifyBanner, setVerifyBanner] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    load()
  }, [router])

  async function load() {
    try {
      const me = await getMe()
      setUser(me)
      setVerifyBanner(!me.email_verified)
      if (me.company_id) {
        const c = await getCompany(me.company_id)
        setCompany(c)
        const subs = await listSubmissions(me.company_id)
        setSubmissions(subs)
      } else {
        setShowCompanyForm(true)
      }
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const c = await createCompany({ ...companyForm, employee_count: Number(companyForm.employee_count), revenue_eur: Number(companyForm.revenue_eur) })
      setCompany(c)
      setShowCompanyForm(false)
    } catch {
      alert("Failed to create company — check all fields")
    } finally {
      setCreating(false)
    }
  }

  async function handleNewSubmission() {
    if (!company) return
    const year = new Date().getFullYear() - 1
    const sub = await createSubmission(company.id, year)
    router.push(`/submit?id=${sub.id}`)
  }

  async function resendVerification() {
    try {
      await api.post("/auth/resend-verification")
      setResendSent(true)
    } catch {
      alert("Could not resend verification email.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completed  = submissions.filter(s => s.status === "processed").length
  const inProgress = submissions.filter(s => s.status === "incomplete").length
  const completionPct = submissions.length > 0 ? Math.round((completed / submissions.length) * 100) : 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={company?.name} userEmail={user?.email} subscriptionPlan={user?.subscription_plan} />

      <div className="ml-60 flex-1 flex flex-col">

        {/* Email verification banner */}
        {verifyBanner && (
          <div className={`border-b px-8 py-3 flex items-center gap-3 ${resendSent ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            {resendSent
              ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              : <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" />
            }
            <p className={`text-sm ${resendSent ? "text-green-800" : "text-amber-800"}`}>
              {resendSent
                ? "Verification email sent! Check your inbox."
                : <><strong>Verify your email</strong> — check your inbox for a confirmation link.</>
              }
            </p>
            {!resendSent && (
              <button onClick={resendVerification} className="ml-auto text-sm text-amber-700 font-semibold underline hover:text-amber-900">
                Resend
              </button>
            )}
            <button onClick={() => setVerifyBanner(false)} className={`${resendSent ? "text-green-400 hover:text-green-600" : "text-amber-400 hover:text-amber-600"} text-lg leading-none ml-2`}>×</button>
          </div>
        )}

        {/* Company setup */}
        {showCompanyForm && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Set up your company</h1>
                  <p className="text-gray-500 text-sm">Takes about 30 seconds</p>
                </div>
              </div>
              <div className="card">
                <form onSubmit={handleCreateCompany} className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="label">Company Name</label>
                    <input className="input" placeholder="Acme ApS" value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Industry</label>
                    <select className="input" value={companyForm.industry_code} onChange={e => setCompanyForm(f => ({ ...f, industry_code: e.target.value }))}>
                      {["technology","manufacturing","retail","finance","healthcare","construction","logistics","agriculture","hospitality"].map(i => (
                        <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Country (ISO 2-letter)</label>
                    <input className="input" placeholder="DK" value={companyForm.country_code} onChange={e => setCompanyForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} required />
                  </div>
                  <div>
                    <label className="label">Number of Employees</label>
                    <input type="number" className="input" value={companyForm.employee_count} onChange={e => setCompanyForm(f => ({ ...f, employee_count: Number(e.target.value) }))} min={1} required />
                  </div>
                  <div>
                    <label className="label">Annual Revenue (EUR)</label>
                    <input type="number" className="input" value={companyForm.revenue_eur} onChange={e => setCompanyForm(f => ({ ...f, revenue_eur: Number(e.target.value) }))} min={0} required />
                  </div>
                  <div className="col-span-2 pt-1">
                    <button type="submit" className="btn-primary w-full py-3 text-base" disabled={creating}>
                      {creating ? "Saving…" : "Save & continue →"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {company && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {company.name} · {company.industry_code} · {company.country_code} · {company.employee_count} employees
                </p>
              </div>
              <button onClick={handleNewSubmission} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Report Year
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Upgrade banner (free plan only) */}
              {user?.subscription_plan === "free" && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">You're on the Free plan</p>
                      <p className="text-xs text-gray-500">Upgrade to Starter for PDF exports, 5 reports/year, and data export.</p>
                    </div>
                  </div>
                  <Link href="/billing" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                    Upgrade →
                  </Link>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-5">
                <div className="card flex items-center gap-5">
                  <RingChart pct={submissions.length === 0 ? 0 : completionPct} color="#22c55e" />
                  <div>
                    <div className="text-sm font-semibold text-gray-500 mb-1">Reports</div>
                    <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
                    <div className="text-xs text-gray-400 mt-1">{completed} completed · {inProgress} in progress</div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-gray-700">Completion</div>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 my-3">
                    {submissions.length === 0 ? "—" : `${completionPct}%`}
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionPct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {submissions.length === 0 ? "No reports yet" : `${completed} of ${submissions.length} reports completed`}
                  </div>
                </div>

                <div
                  onClick={handleNewSubmission}
                  className="card border-2 border-dashed border-green-200 bg-green-50/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all group"
                >
                  <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center mb-3 shadow-md shadow-green-500/25 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-semibold text-gray-800">Start Data Entry</div>
                  <div className="text-gray-500 text-xs mt-1">New ESG report year</div>
                </div>
              </div>

              {/* Reports table */}
              {submissions.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports yet</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                    Start your first ESG data collection and get a full AI-generated report in minutes.
                  </p>
                  <button onClick={handleNewSubmission} className="btn-primary mx-auto inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Start data entry
                  </button>
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">ESG Reports</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{submissions.length} total</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Report Year</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {submissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{sub.reporting_year} ESG Report</div>
                            <div className="text-xs text-gray-400">{company.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[sub.status] || STATUS_BADGE.incomplete}`}>
                              {STATUS_LABEL[sub.status] || sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {sub.status === "incomplete" && (
                              <Link href={`/submit?id=${sub.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
                                Continue <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {sub.status === "submitted" && (
                              <Link href={`/submit?id=${sub.id}&review=1`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                Review & Generate <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {sub.status === "processed" && (
                              <Link href={`/report/${sub.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
                                View Report <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/pricing" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors flex-shrink-0">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">View Plans</div>
                    <div className="text-xs text-gray-500">Compare features & pricing</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
                <Link href="/billing" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Billing</div>
                    <div className="text-xs text-gray-500">Manage subscription & invoices</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
