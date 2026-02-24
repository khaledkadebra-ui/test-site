"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import { getMe } from "@/lib/api"
import api from "@/lib/api"
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, ArrowRight, Zap } from "lucide-react"

interface SubStatus {
  plan: string
  status: string
  has_active_subscription: boolean
  expires_at: string | null
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

export default function BillingPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

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
    try {
      const { data } = await api.post("/billing/portal")
      window.location.href = data.portal_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      alert(e?.response?.data?.detail || "Could not open billing portal. Please contact support.")
    } finally {
      setPortalLoading(false)
    }
  }

  async function checkout(plan: string) {
    setCheckoutLoading(plan)
    try {
      const { data } = await api.post("/billing/checkout", { plan })
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      alert(e?.response?.data?.detail || "Payment service unavailable. Please contact support.")
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
          <h1 className="text-xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your plan and payment details</p>
        </div>

        <div className="p-8 space-y-6 max-w-3xl">
          {/* Current plan */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="section-title mb-1">Current Plan</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-gray-900">{PLAN_LABELS[sub?.plan || "free"]}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[sub?.status || "inactive"]}`}>
                    {(sub?.status || "inactive").replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                {sub?.expires_at && (
                  <p className="text-sm text-gray-500">
                    {sub.status === "cancelled" ? "Access until " : "Renews on "}
                    {new Date(sub.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {!sub?.has_active_subscription && sub?.plan === "free" && (
                  <p className="text-sm text-gray-500">Free plan — 1 report per year</p>
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
                {portalLoading ? "Opening…" : "Manage billing & invoices"}
              </button>
            )}
          </div>

          {/* Upgrade options (if not pro) */}
          {sub?.plan !== "professional" && (
            <div className="card">
              <h2 className="section-title">Upgrade your plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sub?.plan === "free" && (
                  <div className="border border-green-200 bg-green-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">Starter</span>
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Most popular</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-1">€49<span className="text-sm font-normal text-gray-500">/month</span></div>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> 5 reports per year</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> PDF export</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Data export (CSV/Excel)</li>
                    </ul>
                    <button
                      onClick={() => checkout("starter")}
                      disabled={checkoutLoading === "starter"}
                      className="btn-primary w-full py-2.5 text-sm"
                    >
                      {checkoutLoading === "starter" ? "Redirecting…" : "Upgrade to Starter →"}
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
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Unlimited reports</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Priority support</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> API access + white-label</li>
                  </ul>
                  <button
                    onClick={() => checkout("professional")}
                    disabled={checkoutLoading === "professional"}
                    className="btn-secondary w-full py-2.5 text-sm"
                  >
                    {checkoutLoading === "professional" ? "Redirecting…" : "Go Professional →"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">Prices in EUR excl. VAT · Cancel anytime · Secure payment by Stripe</p>
            </div>
          )}

          {/* What's included in current plan */}
          <div className="card">
            <h2 className="section-title">Plan features</h2>
            <div className="space-y-2.5">
              {[
                { label: "Reports per year", value: sub?.plan === "professional" ? "Unlimited" : sub?.plan === "starter" ? "5" : "1" },
                { label: "PDF report download", value: sub?.plan !== "free" },
                { label: "CO₂ calculation (Scope 1/2/3)", value: true },
                { label: "ESG score & A–E rating", value: true },
                { label: "AI-written narratives", value: true },
                { label: "Gap analysis & 12-month roadmap", value: true },
                { label: "Data export (CSV/Excel)", value: sub?.plan !== "free" },
                { label: "Priority support", value: sub?.plan === "professional" },
                { label: "API access", value: sub?.plan === "professional" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{f.label}</span>
                  {typeof f.value === "boolean" ? (
                    f.value
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <span className="text-xs text-gray-300 font-medium">Not included</span>
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
