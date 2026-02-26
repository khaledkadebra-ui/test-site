"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CheckCircle, X, ArrowRight, Zap, Shield, Headphones } from "lucide-react"
import api from "@/lib/api"

const FEATURES = [
  { label: "ESG reports per year",         free: "1",       starter: "5",     pro: "Unlimited" },
  { label: "CO₂ calculation (Scope 1/2/3)", free: true,     starter: true,    pro: true },
  { label: "ESG score & rating (A–E)",      free: true,     starter: true,    pro: true },
  { label: "Gap analysis & action plan",    free: true,     starter: true,    pro: true },
  { label: "AI-written narratives",         free: true,     starter: true,    pro: true },
  { label: "PDF report download",           free: false,    starter: true,    pro: true },
  { label: "12-month roadmap",              free: true,     starter: true,    pro: true },
  { label: "Industry benchmarking",         free: true,     starter: true,    pro: true },
  { label: "Data export (CSV/Excel)",       free: false,    starter: true,    pro: true },
  { label: "Priority support",             free: false,    starter: false,   pro: true },
  { label: "API access",                   free: false,    starter: false,   pro: true },
  { label: "White-label reports",          free: false,    starter: false,   pro: true },
]

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    desc: "Get started and generate your first ESG report for free.",
    highlight: false,
    badge: null,
    cta: "Get started free",
    ctaHref: "/register",
    stripePlan: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 49, annual: 39 },
    desc: "For SMEs that need regular ESG reporting and PDF exports.",
    highlight: true,
    badge: "Most popular",
    cta: "Start Starter plan",
    ctaHref: null,
    stripePlan: "starter",
  },
  {
    id: "professional",
    name: "Professional",
    price: { monthly: 149, annual: 119 },
    desc: "Unlimited reports, priority support, and API access.",
    highlight: false,
    badge: null,
    cta: "Go Professional",
    ctaHref: null,
    stripePlan: "professional",
  },
]

const FAQS = [
  {
    q: "What is included in the free plan?",
    a: "The free plan includes one ESG report per year with CO₂ calculations, ESG scoring, gap analysis, and AI narratives. PDF download requires a paid plan.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel anytime. Your subscription remains active until the end of the billing period.",
  },
  {
    q: "What emission factors does ESG Copilot use?",
    a: "We use DEFRA 2024 emission factors for Scope 1 & 3, IEA 2024 / Energistyrelsen 2024 grid factors for Scope 2, and EPA EEIO 2.0 for spend-based Scope 3 procurement.",
  },
  {
    q: "Is my data GDPR compliant?",
    a: "Yes. All data is stored and processed within the EU. We never share your data with third parties.",
  },
  {
    q: "What standard does the report follow?",
    a: "Our reports align with the VSME (Voluntary SME) sustainability reporting standard, which is designed specifically for small and medium-sized businesses.",
  },
  {
    q: "Do I need ESG expertise to use ESG Copilot?",
    a: "No. Our guided wizard asks plain-language questions and handles all the calculations and benchmarking automatically.",
  },
]

function FeatureValue({ val }: { val: boolean | string }) {
  if (typeof val === "boolean") {
    return val
      ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
      : <X className="w-4 h-4 text-gray-300 mx-auto" />
  }
  return <span className="text-sm font-semibold text-gray-700">{val}</span>
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState("")
  const router = useRouter()

  async function handleCheckout(plan: string) {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/register?plan=" + plan)
      return
    }
    setLoading(plan)
    try {
      const { data } = await api.post("/billing/checkout", { plan })
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setCheckoutError(e?.response?.data?.detail || "Payment service unavailable. Please contact support.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-black text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-500 mb-8">Start for free. Upgrade when you need more reports or PDF exports.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${!annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Annual <span className="text-green-500 ml-1">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-6">
        {checkoutError && (
          <div className="max-w-xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center">
            {checkoutError}
          </div>
        )}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-8 relative ${
                plan.highlight
                  ? "border-green-500 bg-green-50 shadow-xl shadow-green-500/10"
                  : "border-gray-200"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-gray-900">
                    €{annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-gray-400 text-sm">/month</span>
                  )}
                </div>
                {annual && plan.price.monthly > 0 && (
                  <p className="text-xs text-green-600 font-medium mb-3">Billed annually (save €{(plan.price.monthly - plan.price.annual) * 12}/year)</p>
                )}
                <p className="text-sm text-gray-500">{plan.desc}</p>
              </div>

              {plan.ctaHref ? (
                <Link
                  href={plan.ctaHref}
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
                    plan.highlight
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => plan.stripePlan && handleCheckout(plan.stripePlan)}
                  disabled={loading === plan.stripePlan}
                  className={`w-full font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {loading === plan.stripePlan ? "Redirecting…" : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Full feature comparison</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-4 w-1/2">Feature</th>
                  {PLANS.map(p => (
                    <th key={p.id} className="text-center text-sm font-bold px-4 py-4">
                      <span className={p.highlight ? "text-green-600" : "text-gray-900"}>{p.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="text-sm text-gray-700 px-6 py-3.5">{f.label}</td>
                    <td className="text-center px-4 py-3.5"><FeatureValue val={f.free} /></td>
                    <td className="text-center px-4 py-3.5"><FeatureValue val={f.starter} /></td>
                    <td className="text-center px-4 py-3.5"><FeatureValue val={f.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, title: "GDPR Compliant", desc: "All data stored and processed within the EU." },
              { icon: Zap, title: "Cancel anytime", desc: "No lock-in. Cancel your subscription whenever you want." },
              { icon: Headphones, title: "Support included", desc: "Email support on all plans. Priority support on Pro." },
            ].map(item => (
              <div key={item.title} className="p-6">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-100 px-6 py-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#0d1f2d] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4">Start your ESG journey today</h2>
          <p className="text-slate-400 mb-8">Free to get started. Upgrade when you need more.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
          >
            Create free account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
