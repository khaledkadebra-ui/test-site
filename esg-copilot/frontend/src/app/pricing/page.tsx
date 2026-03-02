"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CheckCircle, X, ArrowRight, Zap, Shield, Headphones } from "lucide-react"
import api from "@/lib/api"

const FEATURES = [
  { label: "ESG-rapporter om året",              free: "1",       starter: "5",          pro: "Ubegrænset" },
  { label: "CO₂-beregning (Scope 1/2/3)",         free: true,     starter: true,         pro: true },
  { label: "ESG-score & vurdering (A–E)",          free: true,     starter: true,         pro: true },
  { label: "Gap-analyse & handlingsplan",          free: true,     starter: true,         pro: true },
  { label: "AI-skrevne tekster",                   free: true,     starter: true,         pro: true },
  { label: "PDF-rapport download",                 free: false,    starter: true,         pro: true },
  { label: "12-måneders handlingsplan",            free: true,     starter: true,         pro: true },
  { label: "Branche-benchmark",                    free: true,     starter: true,         pro: true },
  { label: "Dataeksport (CSV/Excel)",              free: false,    starter: true,         pro: true },
  { label: "Prioriteret support",                  free: false,    starter: false,        pro: true },
  { label: "API-adgang",                           free: false,    starter: false,        pro: true },
  { label: "White-label rapporter",                free: false,    starter: false,        pro: true },
]

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    desc: "Kom i gang gratis og generer din første ESG-rapport.",
    highlight: false,
    badge: null,
    cta: "Opret gratis konto",
    ctaHref: "/register",
    stripePlan: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 49, annual: 39 },
    desc: "Til SMV'er der har brug for løbende ESG-rapportering og PDF-eksport.",
    highlight: true,
    badge: "Mest populær",
    cta: "Vælg Starter",
    ctaHref: null,
    stripePlan: "starter",
  },
  {
    id: "professional",
    name: "Professional",
    price: { monthly: 149, annual: 119 },
    desc: "Ubegrænsede rapporter, prioriteret support og API-adgang.",
    highlight: false,
    badge: null,
    cta: "Vælg Professional",
    ctaHref: null,
    stripePlan: "professional",
  },
]

const FAQS = [
  {
    q: "Hvad er inkluderet i free-planen?",
    a: "Free-planen inkluderer én ESG-rapport om året med CO₂-beregning, ESG-score, gap-analyse og AI-tekster. PDF-download kræver en betalt plan.",
  },
  {
    q: "Kan jeg opsige mit abonnement når som helst?",
    a: "Ja, du kan opsige når som helst. Dit abonnement forbliver aktivt til slutningen af betalingsperioden.",
  },
  {
    q: "Hvilke emissionsfaktorer bruger ESG Copilot?",
    a: "Vi anvender DEFRA 2024-emissionsfaktorer for Scope 1 & 3, IEA 2024 / Energistyrelsen 2024 nettofaktorer for Scope 2 og EPA EEIO 2.0 til udgiftsbaseret Scope 3-indkøb.",
  },
  {
    q: "Er mine data GDPR-kompatible?",
    a: "Ja. Alle data opbevares og behandles inden for EU. Vi deler aldrig dine data med tredjeparter.",
  },
  {
    q: "Hvilken standard følger rapporten?",
    a: "Vores rapporter er i overensstemmelse med VSME (Voluntary SME) bæredygtighedsrapporteringsstandarden, som er designet specifikt til små og mellemstore virksomheder.",
  },
  {
    q: "Behøver jeg ESG-ekspertise for at bruge ESG Copilot?",
    a: "Nej. Vores guidede dataindberetning stiller spørgsmål på almindeligt dansk og håndterer alle beregninger og benchmarks automatisk.",
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
      setCheckoutError(e?.response?.data?.detail || "Betalingsservice utilgængelig. Kontakt venligst support.")
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
          <h1 className="text-5xl font-black text-gray-900 mb-4">Enkel, transparent prissætning</h1>
          <p className="text-xl text-gray-500 mb-8">Start gratis. Opgrader når du har brug for flere rapporter eller PDF-eksport.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${!annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Månedligt
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${annual ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Årligt <span className="text-green-500 ml-1">Spar 20%</span>
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
                    <span className="text-gray-400 text-sm">/md.</span>
                  )}
                </div>
                {annual && plan.price.monthly > 0 && (
                  <p className="text-xs text-green-600 font-medium mb-3">Faktureres årligt (spar €{(plan.price.monthly - plan.price.annual) * 12}/år)</p>
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
                  {loading === plan.stripePlan ? "Omdirigerer…" : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Fuld funktionssammenligning</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-4 w-1/2">Funktion</th>
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
              { icon: Shield, title: "GDPR-kompatibel", desc: "Alle data opbevares og behandles inden for EU." },
              { icon: Zap, title: "Opsig når som helst", desc: "Ingen binding. Opsig dit abonnement når du vil." },
              { icon: Headphones, title: "Support inkluderet", desc: "E-mailsupport på alle planer. Prioriteret support på Pro." },
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
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Ofte stillede spørgsmål</h2>
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
          <h2 className="text-3xl font-black text-white mb-4">Start din ESG-rejse i dag</h2>
          <p className="text-slate-400 mb-8">Gratis at komme i gang. Opgrader når du har brug for mere.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
          >
            Opret gratis konto <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
