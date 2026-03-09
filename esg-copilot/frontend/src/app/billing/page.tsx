"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import { getMe } from "@/lib/api"
import api from "@/lib/api"
import { CreditCard, CheckCircle, ExternalLink, Zap, FileText, Lock, BarChart2 } from "lucide-react"

interface SubStatus {
  plan: string
  status: string
  has_active_subscription: boolean
  expires_at: string | null
  one_time_report_credits: number
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  trialing: "bg-blue-50 text-blue-700 border-blue-200",
  past_due: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv", trialing: "Prøveperiode", past_due: "Betaling forfalden",
  cancelled: "Opsagt", inactive: "Inaktiv",
}

export default function BillingPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [billingError, setBillingError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    load()
  }, [router])

  async function load() {
    try {
      const [me, status] = await Promise.all([
        getMe(),
        api.get("/billing/status").then(r => r.data),
      ])
      setUser(me)
      setSub(status)
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    setBillingError("")
    try {
      const { data } = await api.post("/billing/portal")
      window.location.href = data.portal_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setBillingError(e?.response?.data?.detail || "Could not open billing portal. Please contact support.")
    } finally {
      setPortalLoading(false)
    }
  }

  async function checkout(plan: string) {
    setCheckoutLoading(plan)
    setBillingError("")
    try {
      const { data } = await api.post("/billing/checkout", { plan })
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setBillingError(e?.response?.data?.detail || "Payment service unavailable. Please contact support.")
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function checkoutOnetime() {
    setCheckoutLoading("onetime")
    setBillingError("")
    try {
      const { data } = await api.post("/billing/checkout-onetime")
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setBillingError(e?.response?.data?.detail || "Betalingsservice utilgængelig. Kontakt venligst support.")
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userEmail={user?.email} />
      <div className="ml-60 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900">Fakturering & Abonnement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administrer din plan og betalingsoplysninger</p>
        </div>

        <div className="p-8 space-y-6 max-w-3xl">
          {billingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {billingError}
            </div>
          )}
          {/* Current plan */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="section-title mb-1">Nuværende plan</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-gray-900">{PLAN_LABELS[sub?.plan || "free"]}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[sub?.status || "inactive"]}`}>
                    {STATUS_LABELS[sub?.status || "inactive"] || sub?.status || "Inaktiv"}
                  </span>
                </div>
                {sub?.expires_at && (
                  <p className="text-sm text-gray-500">
                    {sub.status === "cancelled" ? "Adgang til " : "Fornyes den "}
                    {new Date(sub.expires_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {!sub?.has_active_subscription && sub?.plan === "free" && (
                  <p className="text-sm text-gray-500">Free-plan — 1 rapport om året</p>
                )}
              </div>
              <CreditCard className="w-8 h-8 text-gray-300" />
            </div>

            {sub?.has_active_subscription && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-secondary mt-5 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {portalLoading ? "Åbner…" : "Administrer fakturering & fakturaer"}
              </button>
            )}
          </div>

          {/* One-time credits + purchase */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="section-title mb-1">Enkeltrapport</h2>
                <p className="text-sm text-gray-500">Køb en enkelt rapport uden abonnement.</p>
              </div>
              <FileText className="w-6 h-6 text-gray-300" />
            </div>

            {(sub?.one_time_report_credits ?? 0) > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-700 font-black text-sm">{sub?.one_time_report_credits}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-900">
                    {sub?.one_time_report_credits} ubrugt {sub?.one_time_report_credits === 1 ? "kredit" : "kreditter"}
                  </div>
                  <div className="text-xs text-blue-600">Brug dem under Indsend Data → Generer rapport</div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="text-2xl font-black text-gray-900">€29 <span className="text-sm font-normal text-gray-500">/ rapport</span></div>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {["CO₂-beregning (Scope 1/2/3)", "ESG-score & A–E-vurdering", "AI-skrevne tekster", "PDF-rapport download"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {["Historisk ESG-oversigt", "Månedlige trend-sammenligninger"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {!sub?.has_active_subscription && (
              <button
                onClick={checkoutOnetime}
                disabled={checkoutLoading === "onetime"}
                className="btn-secondary w-full py-2.5 text-sm"
              >
                {checkoutLoading === "onetime" ? "Omdirigerer…" : "Køb enkeltrapport (€29) →"}
              </button>
            )}
            {sub?.has_active_subscription && (
              <p className="text-xs text-gray-400 text-center pt-1">
                Dit abonnement inkluderer allerede rapporter. Engangskøb er ikke nødvendigt.
              </p>
            )}
          </div>

          {/* Subscription benefits highlight for non-subscribers */}
          {!sub?.has_active_subscription && (
            <div className="card border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="section-title mb-0">Abonnement inkluderer ESG Historik</h2>
                  <p className="text-xs text-emerald-700 font-medium">Ikke tilgængeligt med enkeltrapport</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
                {[
                  "Fuld månedsoversigt over alle ESG-scores",
                  "Trend-sammenligninger: op/ned pr. dimension",
                  "CO₂ og ESG udviklingsgrafer",
                  "AI-indsigter om positiv/negativ retning",
                  "Automatisk månedlig rapport",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upgrade options (if not pro) */}
          {sub?.plan !== "professional" && (
            <div className="card">
              <h2 className="section-title">Opgrader din plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sub?.plan === "free" && (
                  <div className="border border-green-200 bg-green-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">Starter</span>
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Mest populær</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-1">€49<span className="text-sm font-normal text-gray-500">/month</span></div>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> 5 rapporter om året</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> PDF-eksport</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Dataeksport (CSV/Excel)</li>
                    </ul>
                    <button
                      onClick={() => checkout("starter")}
                      disabled={checkoutLoading === "starter"}
                      className="btn-primary w-full py-2.5 text-sm"
                    >
                      {checkoutLoading === "starter" ? "Omdirigerer…" : "Opgrader til Starter →"}
                    </button>
                  </div>
                )}
                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-gray-900">Professional</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 mb-1">€149<span className="text-sm font-normal text-gray-500">/month</span></div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Ubegrænsede rapporter</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Prioriteret support</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> API-adgang + white-label</li>
                  </ul>
                  <button
                    onClick={() => checkout("professional")}
                    disabled={checkoutLoading === "professional"}
                    className="btn-secondary w-full py-2.5 text-sm"
                  >
                    {checkoutLoading === "professional" ? "Omdirigerer…" : "Vælg Professional →"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">Priser i EUR ekskl. moms · Opsig når som helst · Sikker betaling via Stripe</p>
            </div>
          )}

          {/* What's included in current plan */}
          <div className="card">
            <h2 className="section-title">Planfunktioner</h2>
            <div className="space-y-2.5">
              {[
                { label: "Rapporter om året", value: sub?.plan === "professional" ? "Ubegrænset" : sub?.plan === "starter" ? "5" : "1" },
                { label: "PDF-rapport download", value: sub?.plan !== "free" },
                { label: "CO₂-beregning (Scope 1/2/3)", value: true },
                { label: "ESG-score & A–E-vurdering", value: true },
                { label: "AI-skrevne tekster", value: true },
                { label: "Gap-analyse & 12-måneders handlingsplan", value: true },
                { label: "Dataeksport (CSV/Excel)", value: sub?.plan !== "free" },
                { label: "Prioriteret support", value: sub?.plan === "professional" },
                { label: "API-adgang", value: sub?.plan === "professional" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{f.label}</span>
                  {typeof f.value === "boolean" ? (
                    f.value
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <span className="text-xs text-gray-300 font-medium">Ikke inkluderet</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">{f.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
