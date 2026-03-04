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
    color: "bg-sky-50 text-sky-600",
    title: "Scope 1, 2 & 3 CO₂-beregner",
    desc: "Beregn automatisk dit fulde klimaaftryk med 2024-emissionsfaktorer fra Energistyrelsen og DEFRA på tværs af alle tre GHG-protokolscopes.",
  },
  {
    icon: BarChart3,
    color: "bg-emerald-50 text-emerald-600",
    title: "ESG-score & branchebenchmarking",
    desc: "Modtag en A–E ESG-vurdering med detaljeret scoring inden for Miljø, Sociale forhold og Lederskab. Se, hvordan du klarer dig i din branche.",
  },
  {
    icon: Zap,
    color: "bg-orange-50 text-orange-500",
    title: "13 AI-agenter i samspil",
    desc: "Vores orchestrerede agent-system koordinerer compliance-check, klimarisikovurdering, branchebenchmark og SMART-handlingsplaner i én sammenhængende analyse.",
  },
  {
    icon: Download,
    color: "bg-violet-50 text-violet-600",
    title: "Professionel PDF-rapport",
    desc: "Download en færdig VSME-rapport i PDF-format, klar til din bestyrelse, bank, investorer eller kunder.",
  },
  {
    icon: Target,
    color: "bg-emerald-50 text-emerald-600",
    title: "CVR-opslag & auto-udfyldning",
    desc: "Indtast dit CVR-nummer og vores system henter automatisk navn, branche og medarbejderantal fra CVR-registret — ingen manuel indtastning.",
  },
  {
    icon: Clock,
    color: "bg-orange-50 text-orange-500",
    title: "Dansk ESG Coach 24/7",
    desc: "Få svar på alle dine ESG-spørgsmål med det samme. Vores AI Coach forklarer VSME, CSRD og bæredygtighedsstrategi på letforståeligt dansk.",
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
  { value: "13", label: "Specialiserede AI-agenter" },
  { value: "2024", label: "DEFRA-emissionsfaktorer" },
  { value: "<30 min", label: "Fra CVR til færdig rapport" },
  { value: "VSME", label: "EFRAG-standardoverensstemmelse" },
]

export default function HomePage() {
  return (
    <div className="bg-white font-sans antialiased">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 md:pt-40 md:pb-32 bg-white">
        {/* Subtle green radial glow top-center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(16,185,129,0.08),transparent)]" />
        {/* Very faint grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0fdf420_1px,transparent_1px),linear-gradient(to_bottom,#f0fdf420_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-700 text-sm font-medium tracking-wide">VSME-klar ESG-rapportering til SMV&apos;er</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
              ESG-rapportering.<br />
              <span className="text-emerald-500">Gjort enkelt.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Generer en komplet, VSME-kompatibel ESG-rapport — med klimaaftryk, AI-analyse og professionel PDF — på under 30 minutter. Ingen konsulenter. Ingen kompleksitet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Start gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
              >
                Se priser
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
              {["Energistyrelsen 2024", "VSME Basic Modul", "GDPR-kompatibel", "EU-data", "GHG-protokol"].map(b => (
                <span key={b} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Report preview mockup */}
          <div className="mt-20 relative max-w-4xl mx-auto">
            {/* Subtle glow behind the card */}
            <div className="absolute -inset-6 bg-gradient-to-b from-emerald-50 to-transparent rounded-3xl -z-10" />
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-200">
                  esg-copilot.com/rapport/2024
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold text-gray-900">VSME Bæredygtighedsrapport — 2024</div>
                    <div className="text-sm text-gray-400 mt-0.5">AI-genereret · Energistyrelsen 2024 emissionsfaktorer</div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Download PDF</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "ESG-vurdering", value: "B", color: "#10b981", border: "#10b981" },
                    { label: "Score / 100", value: "72,4", color: "#111827", border: "#34d399" },
                    { label: "Total tCO₂e", value: "124,8", color: "#111827", border: "#60a5fa" },
                    { label: "Branche %il", value: "68.", color: "#111827", border: "#f97316" },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center" style={{ borderTop: `3px solid ${kpi.border}` }}>
                      <div className="text-2xl font-extrabold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Miljø (E)", value: 68, color: "#10b981" },
                    { label: "Sociale (S)", value: 75, color: "#3b82f6" },
                    { label: "Lederskab (G)", value: 82, color: "#8b5cf6" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2.5">
                        <span className="font-medium text-gray-600">{s.label}</span>
                        <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{s.value}</div>
                <div className="text-sm text-gray-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="funktioner" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <Leaf className="w-4 h-4" /> Alt inkluderet
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Alt hvad du har brug for til ESG-compliance
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Én platform til at måle, rapportere og forbedre din ESG-præstation — bygget specifikt til SMV&apos;er.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-5`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section id="saadan-virker-det" className="py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-orange-500 font-semibold text-sm mb-4 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Zap className="w-4 h-4" /> Simpel proces
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Fra data til rapport i tre trin
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Ingen ESG-ekspertise nødvendig. Besvar spørgsmålene, og vi klarer resten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-px bg-gradient-to-r from-emerald-200 via-orange-200 to-emerald-200" />
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center md:text-left">
                {/* Step number badge */}
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5 font-extrabold text-sm text-white"
                  style={{ background: idx === 1 ? "#f97316" : "#10b981" }}>
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-4 text-sm">{step.desc}</p>
                <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle className="w-3 h-3" />
                  {step.detail}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:-translate-y-0.5"
            >
              Start din første rapport <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-gray-400 text-sm mt-3">Gratis at starte · Intet kreditkort krævet</p>
          </div>
        </div>
      </section>

      {/* ── VSME section ────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-orange-500 font-semibold text-sm mb-5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Award className="w-4 h-4" /> VSME Basic Modul
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                Bygget til VSME<br />
                <span className="text-emerald-500">bæredygtighedsstandarden</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
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
                    <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Emissionsfaktorer", value: "Energistyrelsen 2024", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
                { label: "GHG-protokol", value: "Scope 1·2·3", bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
                { label: "Standard", value: "VSME Basic", bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
                { label: "Databeskyttelse", value: "GDPR / EU", bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
              ].map(card => (
                <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-6 hover:shadow-sm transition-shadow`}>
                  <div className={`${card.text} font-extrabold text-xl mb-1`}>{card.value}</div>
                  <div className="text-gray-400 text-sm">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Betroet af virksomheder i hele Europa</h2>
            <p className="text-lg text-gray-500">Se, hvad vores kunder siger om ESG Copilot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">&quot;{t.text}&quot;</p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Enkel, gennemsigtig prissætning</h2>
            <p className="text-lg text-gray-500">Start gratis. Opgrader når du har brug for mere.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-10">
            {[
              { name: "Gratis", price: "0 kr.", per: "altid", desc: "1 rapport/år, kernefunktioner", cta: "Kom i gang", href: "/register", highlight: false },
              { name: "Starter", price: "349 kr.", per: "pr. måned", desc: "5 rapporter/år, PDF-eksport, fulde anbefalinger", cta: "Start Starter", href: "/pricing", highlight: true },
              { name: "Professional", price: "999 kr.", per: "pr. måned", desc: "Ubegrænsede rapporter, prioritetssupport, API-adgang", cta: "Gå Pro", href: "/pricing", highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 border transition-all duration-200 ${plan.highlight ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10 scale-[1.02]" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"}`}>
                {plan.highlight && (
                  <div className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full inline-block mb-3">Mest populær</div>
                )}
                <div className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/{plan.per}</span>
                </div>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{plan.desc}</p>
                <Link
                  href={plan.href}
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 ${
                    plan.highlight
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold hover:text-emerald-700 text-sm transition-colors">
              Se fuld funktionssammenligning <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-emerald-500 relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(255,255,255,0.08),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Leaf className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-sm font-medium">Gratis at starte</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Klar til at måle dit ESG-aftryk?
          </h2>
          <p className="text-emerald-50 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Slut dig til hundredvis af SMV&apos;er, der bruger ESG Copilot til at opfylde bæredygtighedskrav — uden at hyre konsulenter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-emerald-600 font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              Opret gratis konto <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              Se priser
            </Link>
          </div>
          <p className="text-emerald-100/70 text-sm mt-6">Intet kreditkort krævet · Gratis plan tilgængelig · Opsig når som helst</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
