"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getMe, getCompany, listSubmissions, listReports, getReport, createCompany, createSubmission, getCompleteness } from "@/lib/api"
import api from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import {
  Plus, FileText, ChevronRight, ArrowRight, Mail, CheckCircle, Zap,
  Leaf, Users, Shield, Wind, Target, TrendingUp, BarChart3,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  id: string
  reporting_year: number
  status: string
}

interface ReportSummary {
  report_id: string
  submission_id: string
  status: string
  created_at: string
  esg_score_total: number | null
  esg_rating: string | null
  total_co2e_tonnes: number | null
}

interface ReportDetail {
  esg_score_total: number
  esg_score_e: number
  esg_score_s: number
  esg_score_g: number
  esg_rating: string
  total_co2e_tonnes: number
  scope1_co2e_tonnes: number
  scope2_co2e_tonnes: number
  scope3_co2e_tonnes: number
  industry_percentile: number
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const RATING_CFG: Record<string, { color: string; bg: string; text: string; label: string }> = {
  A: { color: "#059669", bg: "#d1fae5", text: "#065f46", label: "Fremragende" },
  B: { color: "#16a34a", bg: "#dcfce7", text: "#14532d", label: "Godt"        },
  C: { color: "#ca8a04", bg: "#fef9c3", text: "#713f12", label: "Middel"      },
  D: { color: "#ea580c", bg: "#ffedd5", text: "#7c2d12", label: "Under middel"},
  E: { color: "#dc2626", bg: "#fee2e2", text: "#7f1d1d", label: "Kritisk"     },
}

const DIM_CFG = {
  E: { color: "#059669", track: "#d1fae5", label: "Miljø",   icon: Leaf,   max: 40 },
  S: { color: "#0284c7", track: "#e0f2fe", label: "Sociale", icon: Users,  max: 35 },
  G: { color: "#7c3aed", track: "#ede9fe", label: "Ledelse", icon: Shield, max: 25 },
}

const STATUS_BADGE: Record<string, string> = {
  incomplete: "pill-amber",
  submitted:  "pill-blue",
  processed:  "pill-green",
}
const STATUS_LABEL: Record<string, string> = {
  incomplete: "I gang",
  submitted:  "Indsendt",
  processed:  "Afsluttet",
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** SDG-inspired score ring — animates on mount */
function ScoreRing({
  score, max, color, track, size = 110, strokeWidth = 11,
}: {
  score: number; max: number; color: string; track: string;
  size?: number; strokeWidth?: number;
}) {
  const r    = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(score / max, 1)
  const dash = pct * circ

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track}  strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className="animate-ring"
      />
    </svg>
  )
}

/** Large hero ring with score + rating centred */
function HeroRing({ score, max = 100, rating }: { score: number; max: number; rating: string }) {
  const cfg  = RATING_CFG[rating] || RATING_CFG.E
  const size = 136
  const sw   = 12
  const r    = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(score / max, 1) * circ

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cfg.color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="animate-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-900 leading-none animate-count-up">
          {score.toFixed(1)}
        </span>
        <span className="text-xs font-bold text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

/** Dimension metric card (E / S / G) */
function DimCard({ dimKey, score }: { dimKey: "E" | "S" | "G"; score: number }) {
  const cfg  = DIM_CFG[dimKey]
  const Icon = cfg.icon
  const pct  = Math.round((score / cfg.max) * 100)

  return (
    <div className="card-flat flex items-center gap-5 p-5">
      <div className="relative flex-shrink-0">
        <ScoreRing score={score} max={cfg.max} color={cfg.color} track={cfg.track} size={88} strokeWidth={9} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <div className="text-2xl font-black text-gray-900 leading-none">
          {score.toFixed(1)}
          <span className="text-sm font-medium text-gray-400 ml-1">/ {cfg.max}</span>
        </div>
        <div className="mt-3 progress-track">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">{pct}% af maks.</div>
      </div>
    </div>
  )
}

/** Scope CO₂ bar row */
function ScopeBar({ label, tonnes, max, color }: { label: string; tonnes: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((tonnes / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">{tonnes.toFixed(1)} t</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<{ full_name: string; email: string; company_id?: string; email_verified?: boolean; subscription_plan?: string } | null>(null)
  const [company, setCompany] = useState<{ id: string; name: string; industry_code: string; country_code: string; employee_count: number } | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [latestReport, setLatestReport] = useState<ReportDetail | null>(null)
  const [reportDate, setReportDate] = useState<string | null>(null)

  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [companyForm, setCompanyForm] = useState({ name: "", industry_code: "technology", country_code: "DK", employee_count: 10, revenue_eur: 1000000 })
  const [companyError, setCompanyError] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [verifyBanner, setVerifyBanner] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [inProgressSubId, setInProgressSubId] = useState<string | null>(null)
  const [inProgressCompletion, setInProgressCompletion] = useState<{ is_complete: boolean; completion_pct: number; blocking_issues: string[] } | null>(null)

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
        const [c, subs, reports] = await Promise.all([
          getCompany(me.company_id),
          listSubmissions(me.company_id),
          listReports(),
        ])
        setCompany(c)
        setSubmissions(subs)

        // Load latest completed report for ESG score visualization
        const completed = (reports as ReportSummary[]).filter(r => r.status === "completed")
        if (completed.length) {
          setReportDate(completed[0].created_at)
          const detail = await getReport(completed[0].report_id).catch(() => null)
          if (detail) setLatestReport(detail as ReportDetail)
        }

        // Load completeness for the most recent in-progress submission
        const inProgress = subs.find((s: Submission) => s.status === "incomplete")
        if (inProgress) {
          setInProgressSubId(inProgress.id)
          const comp = await getCompleteness(inProgress.id).catch(() => null)
          if (comp) setInProgressCompletion(comp)
        }
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
      setCompanyError("Oprettelse mislykkedes — kontrollér alle felter og prøv igen")
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
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completed  = submissions.filter(s => s.status === "processed").length
  const inProgress = submissions.filter(s => s.status === "incomplete").length
  const rating     = latestReport?.esg_rating || null
  const ratingCfg  = rating ? RATING_CFG[rating] : null
  const totalCO2   = latestReport ? (latestReport.scope1_co2e_tonnes + latestReport.scope2_co2e_tonnes + latestReport.scope3_co2e_tonnes) : 0

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar companyName={company?.name} userEmail={user?.email} subscriptionPlan={user?.subscription_plan} />

      <div className="ml-60 flex-1 flex flex-col">

        {/* Email verification banner */}
        {verifyBanner && (
          <div className={`border-b px-8 py-3 flex items-center gap-3 text-sm ${resendSent ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {resendSent
              ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              : <Mail className="w-4 h-4 flex-shrink-0 text-amber-600" />}
            {resendSent
              ? "Bekræftelses-e-mail sendt! Tjek din indbakke."
              : <><strong>Bekræft din e-mail</strong> — tjek din indbakke for et bekræftelseslink.</>}
            {!resendSent && (
              <button onClick={resendVerification} className="ml-auto text-amber-700 font-semibold underline hover:no-underline text-xs">
                Send igen
              </button>
            )}
            <button onClick={() => setVerifyBanner(false)} className="text-lg leading-none opacity-40 hover:opacity-70 ml-2">×</button>
          </div>
        )}

        {/* ── Company setup ──────────────────────────────────────────── */}
        {showCompanyForm && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-xl fade-in">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Opret din virksomhed</h1>
                <p className="text-gray-500 text-sm mt-2">Tager ca. 30 sekunder — du er derefter klar til din første ESG-rapport</p>
              </div>
              <div className="card">
                <form onSubmit={handleCreateCompany} className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="label">Virksomhedsnavn</label>
                    <input className="input" placeholder="Acme ApS" value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Branche</label>
                    <select className="input" value={companyForm.industry_code} onChange={e => setCompanyForm(f => ({ ...f, industry_code: e.target.value }))}>
                      {[
                        ["technology","Teknologi"],["manufacturing","Produktion"],["retail","Detailhandel"],
                        ["finance","Finans"],["healthcare","Sundhed"],["construction","Byggeri"],
                        ["logistics","Logistik"],["agriculture","Landbrug"],["hospitality","Hotel & Restauration"],
                      ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Land</label>
                    <input className="input" placeholder="DK" value={companyForm.country_code} onChange={e => setCompanyForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} required />
                  </div>
                  <div>
                    <label className="label">Antal medarbejdere</label>
                    <input type="number" className="input" value={companyForm.employee_count} onChange={e => setCompanyForm(f => ({ ...f, employee_count: Number(e.target.value) }))} min={1} required />
                  </div>
                  <div>
                    <label className="label">Årlig omsætning (EUR)</label>
                    <input type="number" className="input" value={companyForm.revenue_eur} onChange={e => setCompanyForm(f => ({ ...f, revenue_eur: Number(e.target.value) }))} min={0} required />
                  </div>
                  <div className="col-span-2 pt-1">
                    {companyError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm mb-3">{companyError}</div>
                    )}
                    <button type="submit" className="btn-primary w-full py-3 text-base" disabled={creating}>
                      {creating ? "Gemmer…" : "Opret virksomhed →"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Main dashboard ─────────────────────────────────────────── */}
        {company && (
          <>
            {/* Page header */}
            <div className="bg-white border-b px-8 py-5 flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Velkommen tilbage, {user?.full_name?.split(" ")[0] || "der"}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {company.name} · {company.industry_code} · {company.country_code} · {company.employee_count} medarbejdere
                </p>
              </div>
              <button onClick={handleNewSubmission} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nyt rapportår
              </button>
            </div>

            <div className="p-8 space-y-6 fade-in">

              {/* Upgrade banner */}
              {user?.subscription_plan === "free" && (
                <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Du er på Gratis-planen</p>
                      <p className="text-xs text-gray-500 mt-0.5">Opgrader til Starter for PDF-eksport, 5 rapporter/år og dataeksport.</p>
                    </div>
                  </div>
                  <Link href="/billing" className="btn-primary flex-shrink-0 text-xs py-2 px-3">
                    Opgrader →
                  </Link>
                </div>
              )}

              {/* ── No report yet — onboarding state ─────────────────── */}
              {!latestReport && submissions.length === 0 && (
                <div className="card text-center py-14">
                  <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Start din ESG-rejse</h2>
                  <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                    Udfyld dataindberetningen på 7 trin — vores AI beregner din CO₂-aftryk, ESG-score og genererer en komplet VSME-rapport.
                  </p>

                  {/* 3-step visual */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    {[
                      { icon: FileText, label: "Udfyld data", sub: "7 trin · ca. 15 min", color: "bg-blue-100 text-blue-600" },
                      { icon: Zap,      label: "AI beregner",  sub: "Automatisk",          color: "bg-amber-100 text-amber-600" },
                      { icon: BarChart3,label: "ESG-rapport",  sub: "PDF klar",             color: "bg-green-100 text-green-600" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-2`}>
                            <step.icon className="w-6 h-6" />
                          </div>
                          <div className="text-sm font-semibold text-gray-800">{step.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{step.sub}</div>
                        </div>
                        {i < 2 && <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-[-16px]" />}
                      </div>
                    ))}
                  </div>

                  <button onClick={handleNewSubmission} className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-base">
                    <Plus className="w-5 h-5" /> Start dataindberetning
                  </button>
                </div>
              )}

              {/* ── ESG Score dashboard (when report exists) ──────────── */}
              {latestReport && (
                <>
                  {/* Row 1: Hero + 3 mini-metrics */}
                  <div className="grid grid-cols-4 gap-5">

                    {/* Hero ESG score card */}
                    <div className="card-flat col-span-1 flex flex-col items-center justify-center py-7 text-center gap-3"
                      style={{ background: ratingCfg ? `linear-gradient(135deg, ${ratingCfg.bg}, white)` : "white" }}>
                      <HeroRing score={latestReport.esg_score_total} max={100} rating={latestReport.esg_rating} />
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-xl font-black text-white shadow-sm"
                            style={{ background: ratingCfg?.color }}
                          >
                            {latestReport.esg_rating}
                          </span>
                          <span className="text-sm font-bold" style={{ color: ratingCfg?.text }}>
                            {ratingCfg?.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {latestReport.industry_percentile > 0
                            ? `Bedre end ${latestReport.industry_percentile.toFixed(0)}% i branchen`
                            : "ESG Score"}
                        </div>
                        {reportDate && (
                          <div className="text-[10px] text-gray-300 mt-1">
                            {new Date(reportDate).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CO₂ metric */}
                    <div className="card-flat flex flex-col justify-between py-5 px-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <Wind className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">CO₂-aftryk</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-gray-900 leading-none">
                          {totalCO2.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">tonne CO₂e total</div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Scope 1</span>
                          <span className="font-semibold text-gray-700">{latestReport.scope1_co2e_tonnes.toFixed(1)} t</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Scope 2</span>
                          <span className="font-semibold text-gray-700">{latestReport.scope2_co2e_tonnes.toFixed(1)} t</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Scope 3</span>
                          <span className="font-semibold text-gray-700">{latestReport.scope3_co2e_tonnes.toFixed(1)} t</span>
                        </div>
                      </div>
                      <Link href="/co2" className="mt-3 text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                        Se CO₂-detaljer <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Reports metric */}
                    <div className="card-flat flex flex-col justify-between py-5 px-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rapporter</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-gray-900 leading-none">{submissions.length}</div>
                        <div className="text-sm text-gray-400 mt-0.5">i alt</div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Afsluttede</span>
                          <span className="font-semibold text-green-600">{completed}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">I gang</span>
                          <span className="font-semibold text-amber-600">{inProgress}</span>
                        </div>
                      </div>
                      <Link href="/reports" className="mt-3 text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                        Se alle rapporter <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Quick action */}
                    <div
                      onClick={handleNewSubmission}
                      className="card-flat flex flex-col items-center justify-center py-7 text-center cursor-pointer hover:bg-green-50 transition-all duration-200 group border-2 border-dashed border-green-200 hover:border-green-300"
                    >
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-green-500/25 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-gray-800 text-sm">Nyt rapportår</div>
                      <div className="text-xs text-gray-400 mt-1">Start dataindberetning</div>
                    </div>
                  </div>

                  {/* Row 2: E/S/G dimension rings (SDG-style) */}
                  <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">ESG-dimensioner</h2>
                    <div className="grid grid-cols-3 gap-5">
                      <DimCard dimKey="E" score={latestReport.esg_score_e} />
                      <DimCard dimKey="S" score={latestReport.esg_score_s} />
                      <DimCard dimKey="G" score={latestReport.esg_score_g} />
                    </div>
                  </div>

                  {/* Row 3: CO₂ bar chart + quick links */}
                  <div className="grid grid-cols-5 gap-5">
                    {/* CO₂ scope breakdown */}
                    <div className="card-flat col-span-3">
                      <div className="flex items-center justify-between mb-5">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">CO₂ pr. scope</div>
                        <Link href="/co2" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                          Fuld CO₂-analyse <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="space-y-4">
                        <ScopeBar label="Scope 1 — Direkte emissioner" tonnes={latestReport.scope1_co2e_tonnes} max={totalCO2} color="#f97316" />
                        <ScopeBar label="Scope 2 — Indkøbt energi"     tonnes={latestReport.scope2_co2e_tonnes} max={totalCO2} color="#eab308" />
                        <ScopeBar label="Scope 3 — Værdikæde (frivillig)" tonnes={latestReport.scope3_co2e_tonnes} max={totalCO2 || 1} color="#a855f7" />
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="col-span-2 space-y-3">
                      {[
                        { href: "/improvements", icon: Target,    label: "Forbedringer",    sub: "Se handlingsplan & SMART-mål",      bg: "bg-green-50",  icon_c: "text-green-600"  },
                        { href: "/co2",          icon: Wind,      label: "CO₂ Emissioner",  sub: "Scope 1, 2 og 3 opgørelse",         bg: "bg-emerald-50",icon_c: "text-emerald-600"},
                        { href: "/goals",        icon: TrendingUp,label: "Mål & Targets",   sub: "Net-nul-mål og politik-checklist",  bg: "bg-blue-50",   icon_c: "text-blue-600"   },
                        { href: "/reports",      icon: FileText,  label: "VSME Rapporter",  sub: "Historik og PDF-download",           bg: "bg-violet-50", icon_c: "text-violet-600" },
                      ].map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 hover:shadow-sm transition-all duration-150 group"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <div className={`w-8 h-8 ${link.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <link.icon className={`w-4 h-4 ${link.icon_c}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800">{link.label}</div>
                            <div className="text-xs text-gray-400 truncate">{link.sub}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── In-progress completion card ────────────────────── */}
              {inProgressSubId && inProgressCompletion && (
                <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm">Færdiggør din VSME-rapport</h3>
                    <span className="text-xs font-bold text-green-600">{inProgressCompletion.completion_pct}% udfyldt</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${inProgressCompletion.completion_pct}%` }}
                    />
                  </div>
                  {inProgressCompletion.blocking_issues.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {inProgressCompletion.blocking_issues.slice(0, 3).map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                          <span className="font-bold flex-shrink-0 mt-0.5">!</span>
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href={`/submit?id=${inProgressSubId}`}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4"
                  >
                    Fortsæt dataindberetning <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* ── Reports table ─────────────────────────────────────── */}
              {submissions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">VSME Rapporter</h2>
                    <span className="text-xs text-gray-400 bg-white border px-2 py-0.5 rounded-full" style={{ borderColor: "var(--color-border)" }}>
                      {submissions.length} i alt
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rapportår</th>
                          <th>Status</th>
                          <th className="text-right">Handling</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map(sub => (
                          <tr key={sub.id}>
                            <td>
                              <div className="font-semibold text-gray-900">{sub.reporting_year} VSME</div>
                              <div className="text-xs text-gray-400">{company.name}</div>
                            </td>
                            <td>
                              <span className={STATUS_BADGE[sub.status] || "pill-gray"}>
                                {STATUS_LABEL[sub.status] || sub.status}
                              </span>
                            </td>
                            <td className="text-right">
                              {sub.status === "incomplete" && (
                                <Link href={`/submit?id=${sub.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700">
                                  Fortsæt <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              {sub.status === "submitted" && (
                                <Link href={`/submit?id=${sub.id}&review=1`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                                  Generer rapport <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              {sub.status === "processed" && (
                                <Link href={`/report/${sub.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700">
                                  Se rapport <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}
