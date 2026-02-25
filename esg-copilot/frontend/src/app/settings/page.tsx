"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany } from "@/lib/api"
import api from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Settings, CheckCircle } from "lucide-react"

const INDUSTRIES = [
  ["technology", "Teknologi & Software"],
  ["manufacturing", "Produktion & Industri"],
  ["retail", "Detail & Handel"],
  ["construction", "Byggeri & Anlæg"],
  ["transport", "Transport & Logistik"],
  ["hospitality", "Hotel & Restaurant"],
  ["healthcare", "Sundhed & Omsorg"],
  ["finance", "Finans & Forsikring"],
  ["professional_services", "Professionelle tjenester"],
  ["agriculture", "Landbrug & Fødevarer"],
  ["energy", "Energi & Forsyning"],
  ["other", "Anden branche"],
]

const COUNTRIES = [
  ["DK", "Danmark"], ["SE", "Sverige"], ["NO", "Norge"], ["DE", "Tyskland"],
  ["NL", "Holland"], ["GB", "UK"], ["FR", "Frankrig"], ["FI", "Finland"], ["PL", "Polen"],
]

export default function SettingsPage() {
  const router = useRouter()
  const [me, setMe] = useState<{ full_name: string; email: string; email_verified: boolean; subscription_plan: string } | null>(null)
  const [companyId, setCompanyId] = useState("")
  const [form, setForm] = useState({ name: "", industry_code: "", country_code: "", employee_count: "", revenue_eur: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const m = await getMe()
      setMe(m)
      if (m.company_id) {
        setCompanyId(m.company_id)
        const c = await getCompany(m.company_id)
        setForm({
          name: c.name || "",
          industry_code: c.industry_code || "",
          country_code: c.country_code || "",
          employee_count: c.employee_count?.toString() || "",
          revenue_eur: c.revenue_eur?.toString() || "",
        })
      }
    } catch { router.push("/login") }
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      await api.patch(`/companies/${companyId}`, {
        name: form.name,
        industry_code: form.industry_code,
        country_code: form.country_code,
        employee_count: form.employee_count ? Number(form.employee_count) : null,
        revenue_eur: form.revenue_eur ? Number(form.revenue_eur) : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Gem mislykkedes — prøv igen")
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={form.name} userEmail={me?.email} subscriptionPlan={me?.subscription_plan} />
      <div className="ml-60 flex-1">
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" /> Indstillinger
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Administrer din virksomhedsprofil og brugerkonto</p>
        </div>

        <div className="p-8 max-w-2xl space-y-6">
          {/* Company profile */}
          <div className="card">
            <h2 className="section-title">Virksomhedsprofil</h2>
            <form onSubmit={saveCompany} className="space-y-4">
              <div>
                <label className="label">Virksomhedsnavn</label>
                <input className="input" value={form.name} onChange={set("name")} required placeholder="Acme ApS" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Branche</label>
                  <select className="input" value={form.industry_code} onChange={set("industry_code")} required>
                    <option value="">Vælg branche…</option>
                    {INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Land</label>
                  <select className="input" value={form.country_code} onChange={set("country_code")} required>
                    <option value="">Vælg land…</option>
                    {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Antal medarbejdere</label>
                  <input type="number" className="input" value={form.employee_count} onChange={set("employee_count")} min={1} placeholder="25" />
                </div>
                <div>
                  <label className="label">Omsætning (EUR)</label>
                  <input type="number" className="input" value={form.revenue_eur} onChange={set("revenue_eur")} min={0} placeholder="1000000" />
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>}
              <div className="flex items-center gap-3">
                <button type="submit" className="btn-primary" disabled={saving || !companyId}>
                  {saving ? "Gemmer…" : "Gem ændringer"}
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Gemt!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* User info */}
          <div className="card">
            <h2 className="section-title">Min konto</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Navn</span>
                <span className="text-sm font-medium text-gray-800">{me?.full_name || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">E-mail</span>
                <span className="text-sm font-medium text-gray-800">{me?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">E-mail verificeret</span>
                <span className={`text-sm font-medium ${me?.email_verified ? "text-green-600" : "text-amber-600"}`}>
                  {me?.email_verified ? "✓ Verificeret" : "Ikke verificeret"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Abonnement</span>
                <span className="text-sm font-medium text-gray-800 capitalize">{me?.subscription_plan || "Free"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
