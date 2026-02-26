"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany, getMaterialityAssessment, runMaterialityAssessment, clearMaterialityAssessment } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import {
  Loader2, RefreshCw, CheckCircle2, AlertCircle, MinusCircle,
  Leaf, Users, Building2, Zap, Droplets, Trash2, Wind,
} from "lucide-react"

type Materiality = "required" | "recommended" | "not_relevant"

type DatapointResult = {
  materiality: Materiality
  reason: string
}

type Assessment = {
  id: string
  assessed_at: string
  industry_code: string
  model_used: string
  assessment: Record<string, DatapointResult>
  datapoint_count: number
}

// Section metadata for grouping display
const SECTIONS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  B3: { label: "Klimaaftryk & Energi",    icon: Leaf,      color: "text-emerald-600" },
  B4: { label: "Vand",                    icon: Droplets,  color: "text-blue-500" },
  B5: { label: "Affald",                  icon: Trash2,    color: "text-amber-500" },
  B6: { label: "Biodiversitet",           icon: Wind,      color: "text-green-400" },
  B7: { label: "Forurening",              icon: AlertCircle, color: "text-red-400" },
  B8: { label: "Medarbejdere",            icon: Users,     color: "text-sky-500" },
  B9: { label: "Sundhed & Sikkerhed",     icon: Zap,       color: "text-orange-500" },
  B10:{ label: "Løn & Diversitet",        icon: Users,     color: "text-violet-500" },
  B11:{ label: "Governance & Politikker", icon: Building2, color: "text-gray-500" },
}

const FIELD_SECTIONS: Record<string, string> = {
  natural_gas_m3: "B3", diesel_liters: "B3", petrol_liters: "B3", lpg_liters: "B3",
  heating_oil_liters: "B3", coal_kg: "B3", biomass_wood_chips_kg: "B3",
  company_car_km: "B3", company_van_km: "B3", company_truck_km: "B3",
  electricity_kwh: "B3", district_heating_kwh: "B3",
  air_short_haul_km: "B3", air_long_haul_economy_km: "B3", air_long_haul_business_km: "B3",
  rail_km: "B3", rental_car_km: "B3", taxi_km: "B3",
  employee_commuting_km: "B3", purchased_goods_spend_eur: "B3",
  water_withdrawal_m3: "B4", water_recycled_pct: "B4",
  total_waste_tonnes: "B5", hazardous_waste_tonnes: "B5", waste_recycled_pct: "B5",
  has_biodiversity_impact: "B6",
  air_pollutants_reported: "B7", water_pollutants_reported: "B7",
  employees_total: "B8", employees_full_time: "B8", employees_part_time: "B8",
  employees_male: "B8", employees_female: "B8", employees_permanent: "B8",
  employees_temporary: "B8", employee_turnover_pct: "B8",
  work_related_accidents: "B9", injury_rate_per_1000: "B9",
  days_lost_injuries: "B9", has_health_safety_policy: "B9",
  wage_gender_gap_pct: "B10", female_management_pct: "B10",
  youth_employment_pct: "B10", disability_employment_pct: "B10",
  has_anti_bribery_policy: "B11", has_data_protection_policy: "B11",
  has_whistleblower_policy: "B11", has_environmental_policy: "B11",
  has_human_rights_policy: "B11", has_supplier_code_of_conduct: "B11",
  net_zero_target_year: "B11", science_based_target: "B11",
}

const FIELD_LABELS: Record<string, string> = {
  natural_gas_m3: "Naturgas (m³)", diesel_liters: "Diesel (liter)", petrol_liters: "Benzin (liter)",
  lpg_liters: "Flaskegas LPG (liter)", heating_oil_liters: "Fyringsolie (liter)", coal_kg: "Kul (kg)",
  biomass_wood_chips_kg: "Biomasse (kg)", company_car_km: "Firmabiler (km)",
  company_van_km: "Varevogne (km)", company_truck_km: "Lastbiler (km)",
  electricity_kwh: "El-forbrug (kWh)", district_heating_kwh: "Fjernvarme (kWh)",
  air_short_haul_km: "Kortdistancefly (km)", air_long_haul_economy_km: "Langfly economy (km)",
  air_long_haul_business_km: "Langfly business (km)", rail_km: "Togrejer (km)",
  rental_car_km: "Lejebil (km)", taxi_km: "Taxa (km)", employee_commuting_km: "Medarbejderpendling",
  purchased_goods_spend_eur: "Indkøbte varer (EUR)", water_withdrawal_m3: "Vandforbrug (m³)",
  water_recycled_pct: "Genanvendt vand (%)", total_waste_tonnes: "Samlet affald (tonnes)",
  hazardous_waste_tonnes: "Farligt affald (tonnes)", waste_recycled_pct: "Genanvendt affald (%)",
  has_biodiversity_impact: "Biodiversitetspåvirkning", air_pollutants_reported: "Luftforurening",
  water_pollutants_reported: "Vandforurening", employees_total: "Medarbejdere (total)",
  employees_full_time: "Fuldtidsmedarbejdere", employees_part_time: "Deltidsmedarbejdere",
  employees_male: "Mandlige medarbejdere", employees_female: "Kvindelige medarbejdere",
  employees_permanent: "Fastansatte", employees_temporary: "Midlertidigt ansatte",
  employee_turnover_pct: "Medarbejderomsætning (%)", work_related_accidents: "Arbejdsulykker",
  injury_rate_per_1000: "Skadefrekvens per 1000", days_lost_injuries: "Tabte arbejdsdage",
  has_health_safety_policy: "Arbejdsmiljøpolitik", wage_gender_gap_pct: "Lønforskel køn (%)",
  female_management_pct: "Kvinder i ledelse (%)", youth_employment_pct: "Ungdomsbeskæftigelse (%)",
  disability_employment_pct: "Handicapbeskæftigelse (%)", has_anti_bribery_policy: "Anti-bestikkelsespolitik",
  has_data_protection_policy: "Databeskyttelsespolitik", has_whistleblower_policy: "Whistleblower-ordning",
  has_environmental_policy: "Miljøpolitik", has_human_rights_policy: "Menneskerettighedspolitik",
  has_supplier_code_of_conduct: "Leverandøradfærdskodeks", net_zero_target_year: "Netto-nul målår",
  science_based_target: "Videnskabsbaseret klimamål (SBTi)",
}

const MAT_CONFIG: Record<Materiality, { label: string; icon: React.ElementType; pill: string; dot: string }> = {
  required:     { label: "Påkrævet",       icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  recommended:  { label: "Anbefalet",      icon: AlertCircle,  pill: "bg-amber-50 text-amber-700 border border-amber-200",     dot: "bg-amber-400" },
  not_relevant: { label: "Ikke relevant",  icon: MinusCircle,  pill: "bg-gray-100 text-gray-500 border border-gray-200",       dot: "bg-gray-300" },
}

export default function MaterialityPage() {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading]       = useState(true)
  const [running, setRunning]       = useState(false)
  const [error, setError]           = useState("")
  const [companyId, setCompanyId]   = useState("")
  const [filter, setFilter]         = useState<Materiality | "all">("all")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const me = await getMe()
      setCompanyId(me.company_id)
      const data = await getMaterialityAssessment(me.company_id).catch(() => null)
      if (data) setAssessment(data)
    } catch {
      setError("Kunne ikke indlæse data")
    } finally {
      setLoading(false)
    }
  }

  async function runAssessment() {
    setRunning(true)
    setError("")
    try {
      const data = await runMaterialityAssessment(companyId)
      setAssessment(data)
    } catch {
      setError("AI-analyse mislykkedes — prøv igen")
    } finally {
      setRunning(false)
    }
  }

  async function handleRefresh() {
    if (!companyId) return
    await clearMaterialityAssessment(companyId).catch(() => {})
    setAssessment(null)
    await runAssessment()
  }

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div></Layout>

  // No assessment yet — show launch screen
  if (!assessment && !running) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Dobbeltvæsentlighedsanalyse</h1>
          <p className="text-gray-500 mb-2 leading-relaxed">
            AI-agenten analyserer din virksomhedsprofil og klassificerer alle ~50 VSME-datapunkter
            som <strong>påkrævet</strong>, <strong>anbefalet</strong> eller <strong>ikke relevant</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Analysen tager ca. 10–15 sekunder og personaliserer din dataindberetning.
          </p>
          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
          <button onClick={runAssessment} className="btn-primary px-8 py-3 text-base">
            Start AI-analyse
          </button>
        </div>
      </Layout>
    )
  }

  // Running state
  if (running) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Analyserer virksomhedsprofil…</h2>
          <p className="text-gray-500 text-sm">
            AI-agenten gennemgår alle VSME-datapunkter og vurderer relevansen for din branche og størrelse.
          </p>
          <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
            {["Henter virksomhedsprofil", "Klassificerer B3–B7 (Miljø)", "Klassificerer B8–B10 (Sociale)", "Klassificerer B11 (Governance)", "Gemmer resultater"].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  // Results
  if (!assessment) return null
  const a = assessment.assessment
  const counts = {
    required:     Object.values(a).filter(v => v.materiality === "required").length,
    recommended:  Object.values(a).filter(v => v.materiality === "recommended").length,
    not_relevant: Object.values(a).filter(v => v.materiality === "not_relevant").length,
  }

  // Group by section
  const bySection: Record<string, [string, DatapointResult][]> = {}
  for (const [fieldId, result] of Object.entries(a)) {
    const sec = FIELD_SECTIONS[fieldId] || "B3"
    if (!bySection[sec]) bySection[sec] = []
    if (filter === "all" || result.materiality === filter) {
      bySection[sec].push([fieldId, result])
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dobbeltvæsentlighedsanalyse</h1>
          <p className="text-sm text-gray-400 mt-1">
            Analyseret {new Date(assessment.assessed_at).toLocaleDateString("da-DK", { dateStyle: "long" })}
            {" · "}{assessment.model_used?.replace("claude-", "Claude ")} · {assessment.datapoint_count} datapunkter
          </p>
        </div>
        <button onClick={handleRefresh} disabled={running} className="btn-secondary flex items-center gap-2 py-2">
          <RefreshCw className="w-4 h-4" /> Kør ny analyse
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["required", "recommended", "not_relevant"] as Materiality[]).map(m => {
          const cfg = MAT_CONFIG[m]
          return (
            <button
              key={m}
              onClick={() => setFilter(filter === m ? "all" : m)}
              className={`card text-center transition-all hover:shadow-md ${filter === m ? "ring-2 ring-green-400" : ""}`}
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">{counts[m]}</div>
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${cfg.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {([["all", "Alle"], ["required", "Påkrævet"], ["recommended", "Anbefalet"], ["not_relevant", "Ikke relevant"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === val
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {Object.entries(SECTIONS).map(([secId, sec]) => {
          const fields = bySection[secId]
          if (!fields || fields.length === 0) return null
          const Icon = sec.icon
          return (
            <div key={secId} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${sec.color}`} />
                <h3 className="font-semibold text-gray-800 text-sm">{secId} — {sec.label}</h3>
                <span className="ml-auto text-xs text-gray-400">{fields.length} felter</span>
              </div>
              <div className="space-y-2">
                {fields.map(([fieldId, result]) => {
                  const cfg = MAT_CONFIG[result.materiality]
                  return (
                    <div key={fieldId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">
                            {FIELD_LABELS[fieldId] || fieldId}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.pill}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{result.reason}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="mt-6 card bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800 text-sm">Klar til at indberette data?</p>
            <p className="text-xs text-green-600 mt-0.5">
              {counts.required} påkrævede felter · {counts.recommended} anbefalede felter
            </p>
          </div>
          <button onClick={() => router.push("/submit")} className="btn-primary py-2">
            Start dataindberetning →
          </button>
        </div>
      </div>
    </Layout>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 flex-1 p-8 max-w-4xl">{children}</div>
    </div>
  )
}
