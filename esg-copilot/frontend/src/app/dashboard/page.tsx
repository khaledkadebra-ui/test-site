"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getMe, getCompany, listSubmissions, logout, createCompany, createSubmission } from "@/lib/api"

interface Submission {
  submission_id: string
  reporting_year: number
  status: string
}

interface Company {
  company_id: string
  name: string
  industry_code: string
  country_code: string
  employee_count: number
}

const STATUS_COLORS: Record<string, string> = {
  incomplete: "bg-slate-700 text-slate-300",
  submitted: "bg-blue-500/20 text-blue-300",
  processed: "bg-green-500/20 text-green-300",
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name: string; email: string; company_id?: string } | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [companyForm, setCompanyForm] = useState({ name: "", industry_code: "technology", country_code: "DK", employee_count: 10, revenue_eur: 1000000 })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    load()
  }, [])

  async function load() {
    try {
      const me = await getMe()
      setUser(me)
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
      setSubmissions([])
    } catch {
      alert("Failed to create company — check all fields")
    } finally {
      setCreating(false)
    }
  }

  async function handleNewSubmission() {
    if (!company) return
    const year = new Date().getFullYear() - 1
    const sub = await createSubmission(company.company_id, year)
    router.push(`/submit?id=${sub.submission_id}`)
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
            <span className="text-slate-900 font-black text-xs">E</span>
          </div>
          <span className="font-bold text-lg">ESG Copilot</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.email}</span>
          <button onClick={logout} className="text-slate-400 hover:text-slate-200 text-sm">Sign out</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Company setup modal */}
        {showCompanyForm && (
          <div className="card mb-8">
            <h2 className="section-title">Set up your company</h2>
            <form onSubmit={handleCreateCompany} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Company Name</label>
                <input className="input" value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Industry</label>
                <select className="input" value={companyForm.industry_code} onChange={e => setCompanyForm(f => ({ ...f, industry_code: e.target.value }))}>
                  {["technology", "manufacturing", "retail", "finance", "healthcare", "construction", "logistics", "agriculture", "hospitality"].map(i => (
                    <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Country Code</label>
                <input className="input" value={companyForm.country_code} onChange={e => setCompanyForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} required />
              </div>
              <div>
                <label className="label">Employees</label>
                <input type="number" className="input" value={companyForm.employee_count} onChange={e => setCompanyForm(f => ({ ...f, employee_count: Number(e.target.value) }))} min={1} required />
              </div>
              <div>
                <label className="label">Annual Revenue (EUR)</label>
                <input type="number" className="input" value={companyForm.revenue_eur} onChange={e => setCompanyForm(f => ({ ...f, revenue_eur: Number(e.target.value) }))} min={0} required />
              </div>
              <div className="col-span-2">
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Saving…" : "Save & continue"}</button>
              </div>
            </form>
          </div>
        )}

        {company && (
          <>
            {/* Company header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <p className="text-slate-400 text-sm mt-1">{company.industry_code} · {company.country_code} · {company.employee_count} employees</p>
              </div>
              <button onClick={handleNewSubmission} className="btn-primary">+ New Report Year</button>
            </div>

            {/* Submissions list */}
            {submissions.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-slate-400 mb-4">No reports yet. Start your first ESG data collection.</p>
                <button onClick={handleNewSubmission} className="btn-primary">Start data entry</button>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="section-title">Your Reports</h2>
                {submissions.map(sub => (
                  <div key={sub.submission_id} className="card flex items-center justify-between hover:border-slate-700 transition-colors">
                    <div>
                      <div className="font-semibold">{sub.reporting_year} ESG Report</div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[sub.status] || "bg-slate-700 text-slate-300"}`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {sub.status === "incomplete" && (
                        <Link href={`/submit?id=${sub.submission_id}`} className="btn-secondary text-sm">Continue</Link>
                      )}
                      {sub.status === "submitted" && (
                        <Link href={`/submit?id=${sub.submission_id}&review=1`} className="btn-secondary text-sm">Review &amp; Generate</Link>
                      )}
                      {sub.status === "processed" && (
                        <Link href={`/report/${sub.submission_id}`} className="btn-primary text-sm">View Report</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-slate-400">Loading…</div>
    </div>
  )
}
