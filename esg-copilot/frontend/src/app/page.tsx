import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import {
  BarChart3, FileText, Zap, Shield,
  CheckCircle, ArrowRight, Wind,
  Download, Star, ChevronRight, Award,
  Leaf, Target, Clock
} from "lucide-react"

const FEATURES = [
  {
    icon: Wind,
    color: "bg-blue-50 text-blue-600",
    title: "Scope 1, 2 & 3 CO₂-beregner",
    desc: "Beregn automatisk dit fulde klimaaftryk med 2024-emissionsfaktorer fra Energistyrelsen og DEFRA på tværs af alle tre GHG-protokolscopes.",
  },
  {
    icon: BarChart3,
    color: "bg-green-50 text-green-600",
    title: "ESG-score & branchebenchmarking",
    desc: "Modtag en A–E ESG-vurdering med detaljeret scoring inden for Miljø, Sociale forhold og Lederskab. Se, hvordan du klarer dig i din branche.",
  },
  {
    icon: Zap,
    color: "bg-purple-50 text-purple-600",
    title: "AI-skrevne rapportafsnit",
    desc: "AI skriver din ledelsesoversigt, CO₂-analyse, ESG-vurdering og foreslåede tiltag — på professionelt dansk med VSME-terminologi.",
  },
  {
    icon: Download,
    color: "bg-orange-50 text-orange-600",
    title: "Professionel PDF-rapport",
    desc: "Download en færdig VSME-rapport i PDF-format, klar til din bestyrelse, bank, investorer eller kunder.",
  },
  {
    icon: Target,
    color: "bg-red-50 text-red-600",
    title: "Foreslåede tiltag & forbedringer",
    desc: "Identificer dine svageste ESG-områder og modtag en prioriteret handlingsplan med SMART-mål, KPI'er og estimeret CO₂-reduktion.",
  },
  {
    icon: Clock,
    color: "bg-amber-50 text-amber-600",
    title: "Færdig på under 30 minutter",
    desc: "Vores guidede VSME-wizard fører dig trin-for-trin igennem alle nødvendige datapunkter. De fleste virksomheder er færdige på under 30 minutter.",
  },
]

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "Indberet dine data",
    desc: "Udfyld vores guidede 6-trins wizard med energiforbrug, transport, indkøb, arbejdsmiljødata og ESG-politikker. De fleste er færdige på 15–30 min.",
    detail: "Energi · Transport · Indkøb · Medarbejdere · Miljø · Politikker",
  },
  {
    num: "02",
    icon: Zap,
    title: "AI analyserer alt",
    desc: "Systemet beregner dit fulde klimaaftryk med 2024-faktorer, scorer din E/S/G-præstation og identificerer mangler ift. VSME Basic Modul-kravene.",
    detail: "CO₂-beregning · ESG-score · Gapanalyse",
  },
  {
    num: "03",
    icon: Download,
    title: "Download din rapport",
    desc: "Modtag en komplet VSME-bæredygtighedsrapport med AI-skrevne afsnit, foreslåede tiltag med SMART-mål og en 12-måneders handlingsplan.",
    detail: "Fuld rapport · PDF-eksport · Handlingsplan",
  },
]

const TESTIMONIALS = [
  {
    text: "Vi gik fra nul til en komplet VSME-rapport på én eftermiddag. CO₂-beregningerne var præcis, hvad vores bank krævede til vores grønne låneansøgning.",
    name: "Lars Møller",
    title: "CFO, Møller Logistics ApS",
    rating: 5,
  },
  {
    text: "AI-afsnittene er imponerende gode — vi brugte dem næsten ordret i vores investorpræsentation. Det sparede os uger i konsulenthonorar.",
    name: "Sophie Andersen",
    title: "CEO, Andersen Digital A/S",
    rating: 5,
  },
  {
    text: "Endelig et ESG-værktøj bygget til SMV'er og ikke store koncerner. Enkelt, hurtigt og handlingsplanen fortæller os præcis, hvad vi skal gøre næst.",
    name: "Marco Bianchi",
    title: "Bæredygtighedsansvarlig, Bianchi Retail",
    rating: 5,
  },
]

const STATS = [
  { value: "500+", label: "Rapporter genereret" },
  { value: "2024", label: "Emissionsfaktorer (DK)" },
  { value: "<30 min", label: "Gennemsnitlig udfyldningstid" },
  { value: "VSME", label: "Standardoverensstemmelse" },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-400/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 text-sm font-medium">VSME-klar ESG-rapportering til SMV&apos;er</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
              ESG-rapportering.<br />
              <span className="text-green-500">Gjort enkelt.</span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Generer en komplet, VSME-kompatibel ESG-rapport — med klimaaftryk, AI-analyse og professionel PDF — på under 30 minutter. Ingen konsulenter. Ingen kompleksitet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-500/25"
              >
                Start gratis <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-base px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Se priser
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              {["Energistyrelsen 2024", "VSME Basic Modul", "GDPR-kompatibel", "EU-data", "GHG-protokol"].map(b => (
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
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-200">
                  esg-copilot.com/rapport/2024
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold text-gray-900">VSME Bæredygtighedsrapport — 2024</div>
                    <div className="text-sm text-gray-500">AI-genereret · Energistyrelsen 2024 emissionsfaktorer</div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <Download className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Download PDF</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "ESG-vurdering", value: "B", color: "#84cc16", border: "#84cc16" },
                    { label: "Score / 100", value: "72,4", color: "#111827", border: "#4ade80" },
                    { label: "Total tCO₂e", value: "124,8", color: "#111827", border: "#60a5fa" },
                    { label: "Branche %il", value: "68.", color: "#111827", border: "#c084fc" },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center" style={{ borderTop: `3px solid ${kpi.border}` }}>
                      <div className="text-2xl font-black mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Miljø (E)", value: 68, color: "#22c55e" },
                    { label: "Sociale (S)", value: 75, color: "#3b82f6" },
                    { label: "Lederskab (G)", value: 82, color: "#a855f7" },
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
      <section id="funktioner" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-3">
              <Leaf className="w-4 h-4" /> Alt inkluderet
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Alt hvad du har brug for til ESG-compliance
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Én platform til at måle, rapportere og forbedre din ESG-præstation — bygget specifikt til SMV&apos;er.
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
      <section id="saadan-virker-det" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-3">
              <Zap className="w-4 h-4" /> Simpel proces
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Fra data til rapport i tre trin
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Ingen ESG-ekspertise nødvendig. Besvar spørgsmålene, og vi klarer resten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
            {STEPS.map((step) => (
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
              Start din første rapport <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-400 text-sm mt-3">Gratis at starte · Intet kreditkort krævet</p>
          </div>
        </div>
      </section>

      {/* ── VSME section ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0d1f2d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-green-400 font-semibold text-sm mb-4">
                <Award className="w-4 h-4" /> VSME Basic Modul
              </div>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                Bygget til VSME<br />
                <span className="text-green-400">bæredygtighedsstandarden</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                VSME (Voluntary SME) standarderne definerer, hvad mindre virksomheder skal oplyse. ESG Copilot dækker alle VSME Basic-krav (B1–B11) ud af boksen.
              </p>
              <div className="space-y-3">
                {[
                  "B1: Virksomhedsoplysninger og rapportgrundlag",
                  "B2: Bæredygtighedspolitikker og -mål",
                  "B3: Energi og drivhusgasemissioner (Scope 1, 2 & 3)",
                  "B4–B7: Forurening, vand, biodiversitet og affald",
                  "B8–B10: Medarbejdere, arbejdsmiljø og løn",
                  "B11: Anti-korruption og forretningsetik",
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
                { label: "Emissionsfaktorer", value: "Energistyrelsen 2024", color: "green" },
                { label: "GHG-protokol", value: "Scope 1·2·3", color: "blue" },
                { label: "Standard", value: "VSME Basic", color: "purple" },
                { label: "Databeskyttelse", value: "GDPR / EU", color: "orange" },
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
            <h2 className="text-4xl font-black text-gray-900 mb-4">Betroet af virksomheder i hele Europa</h2>
            <p className="text-xl text-gray-500">Se, hvad vores kunder siger om ESG Copilot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&quot;{t.text}&quot;</p>
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
            <h2 className="text-4xl font-black text-gray-900 mb-4">Enkel, gennemsigtig prissætning</h2>
            <p className="text-xl text-gray-500">Start gratis. Opgrader når du har brug for mere.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {[
              { name: "Gratis", price: "0 kr.", per: "altid", desc: "1 rapport/år, kernefunktioner", cta: "Kom i gang", href: "/register", highlight: false },
              { name: "Starter", price: "349 kr.", per: "pr. måned", desc: "5 rapporter/år, PDF-eksport, fulde anbefalinger", cta: "Start Starter", href: "/pricing", highlight: true },
              { name: "Professional", price: "999 kr.", per: "pr. måned", desc: "Ubegrænsede rapporter, prioritetssupport, API-adgang", cta: "Gå Pro", href: "/pricing", highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 border ${plan.highlight ? "border-green-500 bg-green-50 shadow-lg shadow-green-500/10" : "border-gray-100"}`}>
                {plan.highlight && (
                  <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mb-3">Mest populær</div>
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
              Se fuld funktionssammenligning <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-green-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Klar til at måle dit ESG-aftryk?
          </h2>
          <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto">
            Slut dig til hundredvis af SMV&apos;er, der bruger ESG Copilot til at opfylde bæredygtighedskrav — uden at hyre konsulenter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-600 font-bold text-base px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              Opret gratis konto <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-green-700/50 hover:bg-green-700 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
            >
              Se priser
            </Link>
          </div>
          <p className="text-green-200 text-sm mt-5">Intet kreditkort krævet · Gratis plan tilgængelig · Opsig når som helst</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
