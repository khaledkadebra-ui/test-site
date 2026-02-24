import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import {
  BarChart3, FileText, Zap, Shield, TrendingUp,
  CheckCircle, ArrowRight, Wind, Users, Building2,
  Download, Star, ChevronRight, Globe, Award,
  Leaf, Target, Clock
} from "lucide-react"

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Wind,
    color: "bg-blue-50 text-blue-600",
    title: "Scope 1, 2 & 3 Carbon Calculator",
    desc: "Automatically calculate your full carbon footprint using DEFRA 2023 emission factors across all three GHG Protocol scopes.",
  },
  {
    icon: BarChart3,
    color: "bg-green-50 text-green-600",
    title: "ESG Score & Industry Benchmarking",
    desc: "Receive an A–E ESG rating with detailed scoring across Environmental, Social & Governance pillars. See how you compare to your industry.",
  },
  {
    icon: Zap,
    color: "bg-purple-50 text-purple-600",
    title: "AI-Written Report Narratives",
    desc: "GPT-4 writes your executive summary, CO₂ analysis, ESG performance review and a 12-month improvement roadmap.",
  },
  {
    icon: Download,
    color: "bg-orange-50 text-orange-600",
    title: "Board-Ready PDF Report",
    desc: "Download a professional, branded PDF report you can share directly with your board, investors, banks, or customers.",
  },
  {
    icon: Target,
    color: "bg-red-50 text-red-600",
    title: "Gap Analysis & Action Plan",
    desc: "Identify your weakest ESG areas and get a prioritised action plan with specific milestones, KPIs, and estimated impact.",
  },
  {
    icon: Clock,
    color: "bg-amber-50 text-amber-600",
    title: "30-Minute Completion",
    desc: "Our guided wizard takes you through all required data points step by step. Most companies complete their first report in under 30 minutes.",
  },
]

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "Enter your data",
    desc: "Fill in our guided 5-step wizard covering energy usage, travel, procurement and ESG governance policies. Most companies finish in 15–30 minutes.",
    detail: "Energy · Travel · Procurement · Policies",
  },
  {
    num: "02",
    icon: Zap,
    title: "AI analyzes everything",
    desc: "Our engine calculates your full carbon footprint using DEFRA 2023 factors, scores your E/S/G performance, and identifies gaps against industry benchmarks.",
    detail: "CO₂ calculation · ESG scoring · Gap analysis",
  },
  {
    num: "03",
    icon: Download,
    title: "Download your report",
    desc: "Receive a complete ESG report with AI-written narratives, a 12-month action roadmap, and a downloadable PDF ready for your board.",
    detail: "Full report · PDF export · Action roadmap",
  },
]

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    text: "We went from zero to a full VSME report in one afternoon. The CO₂ calculations were exactly what our bank required for our green loan application.",
    name: "Lars Møller",
    title: "CFO, Møller Logistics ApS",
    rating: 5,
  },
  {
    text: "The AI narratives are shockingly good — we used them almost word-for-word in our investor deck. Saved us weeks of consultant fees.",
    name: "Sophie Andersen",
    title: "CEO, Andersen Digital A/S",
    rating: 5,
  },
  {
    text: "Finally an ESG tool built for SMEs, not enterprise. Simple, fast, and the action plan actually tells us what to do next.",
    name: "Marco Bianchi",
    title: "Sustainability Manager, Bianchi Retail",
    rating: 5,
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "500+", label: "Reports generated" },
  { value: "20+", label: "Emission factor sources" },
  { value: "<30 min", label: "Average completion time" },
  { value: "VSME", label: "Standard compliant" },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-400/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 text-sm font-medium">VSME-ready ESG reporting for SMEs</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
              ESG reporting.<br />
              <span className="text-green-500">Simplified.</span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Generate a complete, VSME-compliant ESG report — with carbon footprint, AI analysis, and board-ready PDF — in under 30 minutes. No consultants. No complexity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-500/25"
              >
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-base px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                View pricing
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              {["DEFRA 2023 Emission Factors", "VSME Ready", "GDPR Compliant", "EU Data Only", "ISO 14064 Aligned"].map(b => (
                <span key={b} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Report preview mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-200">
                  esg-copilot.com/report/2024
                </div>
              </div>
              {/* Mock report content */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold text-gray-900">ESG Report — 2024</div>
                    <div className="text-sm text-gray-500">AI-generated · DEFRA 2023 emission factors</div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <Download className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Export PDF</span>
                  </div>
                </div>
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "ESG Rating", value: "B", color: "#84cc16", border: "#84cc16" },
                    { label: "Score / 100", value: "72.4", color: "#111827", border: "#4ade80" },
                    { label: "Total tCO₂e", value: "124.8", color: "#111827", border: "#60a5fa" },
                    { label: "Industry %ile", value: "68th", color: "#111827", border: "#c084fc" },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center" style={{ borderTop: `3px solid ${kpi.border}` }}>
                      <div className="text-2xl font-black mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bars */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Environmental", value: 68, color: "#22c55e" },
                    { label: "Social", value: 75, color: "#3b82f6" },
                    { label: "Governance", value: 82, color: "#a855f7" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{s.label}</span>
                        <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-green-400/5 rounded-3xl -z-10 blur-xl" />
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-3">
              <Leaf className="w-4 h-4" /> Everything included
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Everything you need for ESG compliance
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              One platform to measure, report, and improve your ESG performance — built specifically for SMEs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-3">
              <Zap className="w-4 h-4" /> Simple process
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              From data to report in three steps
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              No ESG expertise required. Just answer the questions, and we handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden md:block pt-4">
                    <span className="text-6xl font-black text-gray-100">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-4">{step.desc}</p>
                <div className="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {step.detail}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-500/25"
            >
              Start your first report <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-400 text-sm mt-3">Free to get started · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── VSME Compliance section ────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0d1f2d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-green-400 font-semibold text-sm mb-4">
                <Award className="w-4 h-4" /> VSME Standard
              </div>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                Built for the VSME<br />
                <span className="text-green-400">sustainability standard</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                The VSME (Voluntary SME) sustainability reporting standard defines what smaller companies need to disclose. ESG Copilot covers all VSME Basic requirements out of the box.
              </p>
              <div className="space-y-3">
                {[
                  "GHG emissions — Scope 1, 2 & 3",
                  "Energy consumption & renewable mix",
                  "Environmental policies & targets",
                  "Social metrics (H&S, diversity, training)",
                  "Governance policies & oversight",
                  "12-month improvement roadmap",
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Emission factor sources", value: "DEFRA 2023", color: "green" },
                { label: "GHG Protocol", value: "Scope 1·2·3", color: "blue" },
                { label: "Standard", value: "VSME Basic", color: "purple" },
                { label: "Data privacy", value: "GDPR / EU", color: "orange" },
              ].map(card => (
                <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className={`text-${card.color}-400 font-black text-xl mb-1`}>{card.value}</div>
                  <div className="text-slate-400 text-sm">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Trusted by businesses across Europe</h2>
            <p className="text-xl text-gray-500">See what our customers say about ESG Copilot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-500">Start for free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {[
              { name: "Free", price: "€0", per: "forever", desc: "1 report per year, core features", cta: "Get started", href: "/register", highlight: false },
              { name: "Starter", price: "€49", per: "per month", desc: "5 reports/year, PDF export, full recommendations", cta: "Start Starter", href: "/pricing", highlight: true },
              { name: "Professional", price: "€149", per: "per month", desc: "Unlimited reports, priority support, API access", cta: "Go Pro", href: "/pricing", highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 border ${plan.highlight ? "border-green-500 bg-green-50 shadow-lg shadow-green-500/10" : "border-gray-100"}`}>
                {plan.highlight && (
                  <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mb-3">Most popular</div>
                )}
                <div className="text-lg font-bold text-gray-900 mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/{plan.per}</span>
                </div>
                <p className="text-sm text-gray-500 mb-5">{plan.desc}</p>
                <Link
                  href={plan.href}
                  className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                    plan.highlight ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-green-600 font-semibold hover:text-green-700">
              See full feature comparison <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-green-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to measure your ESG impact?
          </h2>
          <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto">
            Join hundreds of SMEs using ESG Copilot to meet sustainability reporting requirements — without hiring consultants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-600 font-bold text-base px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              Create free account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-green-700/50 hover:bg-green-700 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
            >
              View pricing
            </Link>
          </div>
          <p className="text-green-200 text-sm mt-5">No credit card required · Free forever plan available · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
