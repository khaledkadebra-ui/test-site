"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import {
  CheckCircle, X, ArrowRight, Zap, Shield, Headphones,
  FileText, BarChart2, RefreshCw, Lock
} from "lucide-react"
import api from "@/lib/api"

// ── One-time features ──────────────────────────────────────────────────────────
const ONETIME_INCLUDES = [
  "CO₂-beregning (Scope 1, 2 & 3)",
  "ESG-score & A–E-vurdering",
  "Gap-analyse & handlingsplan",
  "AI-skrevne narrative tekster",
  "PDF-rapport download",
  "Branche-benchmark",
]
const ONETIME_EXCLUDES = [
  "Historisk oversigt & trends",
  "Månedlige sammenligninger",
  "Automatisk månedlig rapport",
]

// ── Subscription comparison ────────────────────────────────────────────────────
const FEATURES = [
  { label: "ESG-rapporter",                                free: "1/år",    starter: "5/år",       pro: "Ubegrænset" },
  { label: "CO₂-beregning (Scope 1/2/3)",                  free: true,      starter: true,         pro: true },
  { label: "ESG-score & A–E-vurdering",                    free: true,      starter: true,         pro: true },
  { label: "AI-skrevne tekster",                           free: true,      starter: true,         pro: true },
  { label: "PDF-rapport download",                         free: false,     starter: true,         pro: true },
  { label: "Historisk ESG-oversigt (ESG Historik)",        free: false,     starter: true,         pro: true },
  { label: "Månedlige trend-sammenligninger",              free: false,     starter: true,         pro: true },
  { label: "Automatisk månedlig rapport",                  free: false,     starter: true,         pro: true },
  { label: "CO₂ & ESG udviklingsgraf",                    free: false,     starter: true,         pro: true },
  { label: "Dataeksport (CSV/Excel)",                      free: false,     starter: true,         pro: true },
  { label: "Prioriteret support",                          free: false,     starter: false,        pro: true },
  { label: "API-adgang",                                   free: false,     starter: false,        pro: true },
  { label: "White-label rapporter",                        free: false,     starter: false,        pro: true },
]

const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 49, annual: 39 },
    desc: "Til SMV'er med løbende ESG-rapportering og fuld historisk oversigt.",
    highlight: true,
    badge: "Mest populær",
    cta: "Vælg Starter",
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
    stripePlan: "professional",
  },
]

const FAQS = [
  {
    q: "Hvad er forskellen på engangskøb og abonnement?",
    a: "Et engangskøb giver dig én rapport med nuværende data. Et abonnement giver dig månedlige rapporter og adgang til ESG Historik — en fuld dashboard med trends, grafer og sammenligninger over alle tidligere måneder.",
  },
  {
    q: "Hvad sker der med mine data når abonnementet udløber?",
    a: "Dine data gemmes. Hvis du fornyer, får du adgang til al historik igen. Abonnement kan opsiges til enhver tid.",
  },
  {
    q: "Kan jeg opsige mit abonnement når som helst?",
    a: "Ja. Ingen binding. Dit abonnement forbliver aktivt til slutningen af betalingsperioden.",
  },
  {
    q: "Hvilke emissionsfaktorer bruger ESG Copilot?",
    a: "Vi anvender DEFRA 2024 for Scope 1 & 3, IEA 2024 / Energistyrelsen 2024 for Scope 2 og EPA EEIO 2.0 til udgiftsbaseret Scope 3-indkøb.",
  },
  {
    q: "Er mine data GDPR-kompatible?",
    a: "Ja. Alle data opbevares og behandles inden for EU. Vi deler aldrig dine data med tredjeparter.",
  },
]

function FeatureValue({ val }: { val: boolean | string }) {
  if (typeof val === "boolean") {
    return val
      ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
      : <X className="w-4 h-4 text-gray-300 mx-auto" />
  }
  return <span className="text-sm font-semibold text-gray-700">{val}</span>
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleCheckout(plan: string) {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/register?plan=" + plan); return }
    setLoading(plan)
    setError("")
    try {
      const { data } = await api.post("/billing/checkout", { plan })
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || "Betalingsservice utilgængelig. Kontakt venligst support.")
    } finally {
      setLoading(null)
    }
  }

  async function handleOnetime() {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/register?plan=onetime"); return }
    setLoading("onetime")
    setError("")
    try {
      const { data } = await api.post("/billing/checkout-onetime")
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || "Betalingsservice utilgængelig. Kontakt venligst support.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-black text-gray-900 mb-4">Vælg den rigtige plan for jer</h1>
          <p className="text-xl text-gray-500 mb-4">
            Ét køb til hurtig compliance — eller et abonnement for løbende bæredygtighedsstyring.
          </p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-xl mx-auto px-6 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center">{error}</div>
        </div>
      )}

      {/* ── Two approaches ─────────────────────────────────────────────────── */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          {/* One-time */}
          <div className="border-2 border-gray-200 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Engangskøb</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Enkelt rapport</h2>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-black text-gray-900">€29</span>
                <span className="text-gray-400 text-sm">/ rapport</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Perfekt til compliance-tjek eller et enkelt snapshot. Betalt én gang, ingen binding.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {ONETIME_INCLUDES.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                {ONETIME_EXCLUDES.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleOnetime}
              disabled={loading === "onetime"}
              className="mt-auto w-full py-3 rounded-xl font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-60"
            >
              {loading === "onetime" ? "Omdirigerer…" : "Køb enkeltrapport →"}
            </button>
          </div>

          {/* Subscription */}
          <div className="border-2 border-emerald-500 rounded-2xl p-8 bg-emerald-50/30 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">Anbefalet til SMV'er</span>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Månedligt abonnement</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Løbende ESG-styring</h2>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-black text-gray-900">€49</span>
                <span className="text-gray-400 text-sm">/md.</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Spor jeres bæredygtighedsudvikling måned for måned med fuld historisk oversigt, grafer og AI-indsigter.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {[
                "Alt fra enkeltrapport",
                "ESG Historik — fuld månedsoversigt",
                "Trend-sammenligninger (E, S, G, CO₂)",
                "Interaktive grafer & dashboards",
                "Automatisk månedlig rapport",
                "AI-indsigter om positiv/negativ retning",
                "PDF-rapport download",
                "Dataeksport (CSV/Excel)",
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* Toggle annual/monthly */}
            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5">
                <button
                  onClick={() => setAnnual(false)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${!annual ? "bg-emerald-500 text-white" : "text-gray-500"}`}
                >
                  Månedligt
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${annual ? "bg-emerald-500 text-white" : "text-gray-500"}`}
                >
                  Årligt <span className={annual ? "text-emerald-200" : "text-emerald-500"}>−20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              {SUBSCRIPTION_PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => handleCheckout(plan.stripePlan)}
                  disabled={loading === plan.stripePlan}
                  className={`py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {loading === plan.stripePlan ? "…" : (
                    <>
                      {plan.name}
                      <div className="text-xs font-normal opacity-80">
                        €{annual ? plan.price.annual : plan.price.monthly}/md.
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription preview — what the dashboard looks like */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Med abonnement: fuld ESG Historik</h2>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            Abonnenter får adgang til ESG Historik — et dedikeret dashboard der viser jeres månedlige fremgang på tværs af alle ESG-dimensioner.
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5">
          {[
            {
              icon: BarChart2,
              color: "bg-blue-50",
              iconColor: "text-blue-600",
              title: "Score over tid",
              desc: "Linjegraf der viser ESG Total, E, S og G score for hvert rapporteret måned.",
            },
            {
              icon: RefreshCw,
              color: "bg-emerald-50",
              iconColor: "text-emerald-600",
              title: "Månedlige sammenligninger",
              desc: "Automatisk beregning af delta — op eller ned — for hvert ESG-mål siden sidste måned.",
            },
            {
              icon: Zap,
              color: "bg-amber-50",
              iconColor: "text-amber-600",
              title: "CO₂ udviklingsgraf",
              desc: "Arealgraf med Scope 1/2/3-opdeling. Se om emissioner falder i takt med tiltag.",
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full feature table */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Fuld funktionssammenligning</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-4 w-1/2">Funktion</th>
                  <th className="text-center text-sm font-bold px-4 py-4 text-gray-900">Free</th>
                  <th className="text-center text-sm font-bold px-4 py-4 text-emerald-600">Starter</th>
                  <th className="text-center text-sm font-bold px-4 py-4 text-gray-900">Professional</th>
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

      {/* Trust */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, title: "GDPR-kompatibel", desc: "Alle data opbevares og behandles inden for EU." },
            { icon: Zap, title: "Opsig når som helst", desc: "Ingen binding. Opsig dit abonnement når du vil." },
            { icon: Headphones, title: "Support inkluderet", desc: "E-mailsupport på alle planer. Prioriteret support på Pro." },
          ].map(item => (
            <div key={item.title} className="p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Ofte stillede spørgsmål</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5">
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
          <h2 className="text-3xl font-black text-white mb-4">Start jeres ESG-rejse i dag</h2>
          <p className="text-slate-400 mb-8">Gratis at komme i gang. Opgrader når du har brug for mere.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
          >
            Opret gratis konto <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
