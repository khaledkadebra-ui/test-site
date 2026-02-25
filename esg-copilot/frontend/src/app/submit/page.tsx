"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  saveEnergy, saveTravel, saveProcurement, savePolicies,
  saveWorkforce, saveEnvironment,
  getCompleteness, submitSubmission, calculatePreview, generateReport
} from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Zap, Plane, ShoppingBag, Shield, BarChart2, CheckCircle, ChevronRight, Users, Leaf } from "lucide-react"

const STEPS = [
  { label: "Energi",       icon: Zap,          vsme: "B3" },
  { label: "Transport",    icon: Plane,         vsme: "B3" },
  { label: "Indkøb",       icon: ShoppingBag,   vsme: "B3" },
  { label: "Medarbejdere", icon: Users,         vsme: "B8-B10" },
  { label: "Miljø",        icon: Leaf,          vsme: "B4-B7" },
  { label: "Politikker",   icon: Shield,        vsme: "B2/B11" },
  { label: "Gennemgang",   icon: BarChart2,     vsme: "" },
]

function Field({ label, unit, value, onChange, hint }: {
  label: string; unit?: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div>
      <label className="label">
        {label}
        {unit && <span className="text-gray-400 font-normal ml-1">({unit})</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <input type="number" className="input" value={value} onChange={e => onChange(e.target.value)} min={0} step="any" placeholder="0" />
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer border-b border-gray-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? "bg-green-500" : "bg-gray-200"}`}
        style={{ height: "22px", width: "40px" }}
      >
        <span
          className={`absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : ""}`}
          style={{ width: "18px", height: "18px" }}
        />
      </button>
    </label>
  )
}

function StepHeader({ icon: Icon, color, title, subtitle, vsme }: {
  icon: React.ElementType; color: string; title: string; subtitle: string; vsme?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900">{title}</h2>
          {vsme && <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-medium">VSME {vsme}</span>}
        </div>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

function SubmitPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const submissionId = params.get("id") || ""
  const startReview = params.get("review") === "1"

  const [step, setStep] = useState(startReview ? 6 : 0)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [completeness, setCompleteness] = useState<{ is_complete: boolean; completion_pct: number; blocking_issues: string[] } | null>(null)
  const [generating, setGenerating] = useState(false)

  const [energy, setEnergy] = useState({
    electricity_kwh: "", natural_gas_m3: "", diesel_liters: "",
    petrol_liters: "", lpg_liters: "", heating_oil_liters: "",
    district_heating_kwh: "", company_car_km: "", company_van_km: "",
    renewable_electricity_pct: "",
  })

  const [travel, setTravel] = useState({
    air_short_haul_km: "", air_long_haul_km: "", rail_km: "",
    rental_car_km: "", taxi_km: "", avg_commute_km_one_way: "",
    commute_days_per_year: "220",
  })

  const [procurement, setProcurement] = useState({
    purchased_goods_spend_eur: "", supplier_count: "",
    has_supplier_code_of_conduct: false,
  })

  const [workforce, setWorkforce] = useState({
    employees_total: "", employees_male: "", employees_female: "",
    employees_permanent: "", employees_temporary: "",
    employees_full_time: "", employees_part_time: "",
    accident_count: "", fatalities: "", lost_time_injury_rate: "",
    min_wage_pct: "", gender_pay_gap_pct: "",
    collective_bargaining_pct: "", training_hours_total: "",
  })

  const [environment, setEnvironment] = useState({
    has_pollution_reporting: false,
    pollution_notes: "",
    biodiversity_sensitive_sites: "",
    water_withdrawal_m3: "", water_stressed_m3: "",
    waste_total_tonnes: "", waste_recycled_pct: "", waste_hazardous_tonnes: "",
  })

  const [policies, setPolicies] = useState({
    has_esg_policy: false, has_data_privacy_policy: false, has_code_of_conduct: false,
    has_health_safety_policy: false, has_anti_corruption_policy: false,
    has_net_zero_target: false, net_zero_target_year: "", has_diversity_policy: false,
    has_energy_reduction_target: false, has_waste_policy: false, has_water_policy: false,
    has_board_esg_oversight: false, supply_chain_code_of_conduct: false,
    has_training_program: false,
  })

  useEffect(() => { if (step === 6) loadReview() }, [step])

  async function loadReview() {
    const [comp, prev] = await Promise.all([
      getCompleteness(submissionId),
      calculatePreview(submissionId).catch(() => null),
    ])
    setCompleteness(comp)
    setPreview(prev)
  }

  async function saveStep() {
    setSaving(true)
    try {
      if (step === 0) await saveEnergy(submissionId, numify(energy))
      if (step === 1) await saveTravel(submissionId, numify(travel))
      if (step === 2) await saveProcurement(submissionId, numify(procurement))
      if (step === 3) await saveWorkforce(submissionId, numifyNullable(workforce))
      if (step === 4) {
        const envPayload = {
          ...numifyNullable(environment),
          has_pollution_reporting: environment.has_pollution_reporting,
          pollution_notes: environment.pollution_notes || null,
        }
        await saveEnvironment(submissionId, envPayload)
      }
      if (step === 5) await savePolicies(submissionId, boolify(policies))
      setStep(s => s + 1)
    } catch {
      alert("Gem mislykkedes — tjek dine værdier og prøv igen")
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitAndGenerate() {
    setGenerating(true)
    try {
      await submitSubmission(submissionId)
      const rep = await generateReport(submissionId, true)
      router.push(`/report/${rep.report_id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      alert(msg || "Indsendelse mislykkedes")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60 flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900">VSME Data-indberetning</h1>
          <p className="text-sm text-gray-500 mt-0.5">Udfyld dine årsdata — alle felter er frivillige medmindre andet er angivet</p>
        </div>

        <div className="p-8 max-w-3xl">
          {/* Step indicators */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {STEPS.map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    i === step
                      ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                      : i < step
                      ? "bg-green-50 text-green-600 cursor-pointer hover:bg-green-100"
                      : "bg-gray-100 text-gray-400 cursor-default"
                  }`}
                >
                  {i < step
                    ? <CheckCircle className="w-3.5 h-3.5" />
                    : <Icon className="w-3.5 h-3.5" />
                  }
                  {label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="card">

            {/* Step 0: Energi */}
            {step === 0 && (
              <>
                <StepHeader icon={Zap} color="bg-yellow-100 text-yellow-600" title="Energi & Brændstoffer" subtitle="Årligt forbrug — bruges til Scope 1 & 2-beregninger" vsme="B3" />
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scope 2 — Indkøbt energi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="El" unit="kWh" value={energy.electricity_kwh} onChange={v => setEnergy(e => ({ ...e, electricity_kwh: v }))} hint="Aflæst fra elregning" />
                    <Field label="Fjernvarme" unit="kWh" value={energy.district_heating_kwh} onChange={v => setEnergy(e => ({ ...e, district_heating_kwh: v }))} />
                    <Field label="Vedvarende el-andel" unit="%" value={energy.renewable_electricity_pct} onChange={v => setEnergy(e => ({ ...e, renewable_electricity_pct: v }))} hint="0 hvis intet VE-certifikat" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Scope 1 — Direkte forbrænding</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Naturgas" unit="m³" value={energy.natural_gas_m3} onChange={v => setEnergy(e => ({ ...e, natural_gas_m3: v }))} />
                    <Field label="Diesel" unit="liter" value={energy.diesel_liters} onChange={v => setEnergy(e => ({ ...e, diesel_liters: v }))} />
                    <Field label="Benzin" unit="liter" value={energy.petrol_liters} onChange={v => setEnergy(e => ({ ...e, petrol_liters: v }))} />
                    <Field label="Fyringsolie" unit="liter" value={energy.heating_oil_liters} onChange={v => setEnergy(e => ({ ...e, heating_oil_liters: v }))} />
                    <Field label="Flaskegas (LPG)" unit="liter" value={energy.lpg_liters} onChange={v => setEnergy(e => ({ ...e, lpg_liters: v }))} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Scope 1 — Firmakøretøjer</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Firmabiler" unit="km" value={energy.company_car_km} onChange={v => setEnergy(e => ({ ...e, company_car_km: v }))} />
                    <Field label="Varevogne" unit="km" value={energy.company_van_km} onChange={v => setEnergy(e => ({ ...e, company_van_km: v }))} />
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Transport */}
            {step === 1 && (
              <>
                <StepHeader icon={Plane} color="bg-blue-100 text-blue-600" title="Tjenesterejser & Pendling" subtitle="Passager-km — bruges til Scope 3-beregninger" vsme="B3" />
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tjenesterejser (Scope 3, Kat. 6)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Kortdistancefly (u. 3 timer)" unit="pkm" value={travel.air_short_haul_km} onChange={v => setTravel(t => ({ ...t, air_short_haul_km: v }))} />
                    <Field label="Langdistancefly (o. 3 timer)" unit="pkm" value={travel.air_long_haul_km} onChange={v => setTravel(t => ({ ...t, air_long_haul_km: v }))} />
                    <Field label="Tog" unit="pkm" value={travel.rail_km} onChange={v => setTravel(t => ({ ...t, rail_km: v }))} />
                    <Field label="Lejebil" unit="km" value={travel.rental_car_km} onChange={v => setTravel(t => ({ ...t, rental_car_km: v }))} />
                    <Field label="Taxa" unit="km" value={travel.taxi_km} onChange={v => setTravel(t => ({ ...t, taxi_km: v }))} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Medarbejderpendling (Scope 3, Kat. 7)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Gns. pendlingsafstand (én vej)" unit="km/person" value={travel.avg_commute_km_one_way} onChange={v => setTravel(t => ({ ...t, avg_commute_km_one_way: v }))} />
                    <Field label="Arbejdsdage pr. år" unit="dage" value={travel.commute_days_per_year} onChange={v => setTravel(t => ({ ...t, commute_days_per_year: v }))} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Indkøb */}
            {step === 2 && (
              <>
                <StepHeader icon={ShoppingBag} color="bg-purple-100 text-purple-600" title="Indkøb & Leverandørkæde" subtitle="Bruges til Scope 3 opstrøms emissioner" vsme="B3" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Indkøbte varer og tjenester" unit="EUR" value={procurement.purchased_goods_spend_eur} onChange={v => setProcurement(p => ({ ...p, purchased_goods_spend_eur: v }))} hint="Samlet indkøbsbudget ekskl. energi" />
                  <Field label="Antal leverandører" value={procurement.supplier_count} onChange={v => setProcurement(p => ({ ...p, supplier_count: v }))} />
                </div>
                <Toggle
                  label="Leverandør-adfærdskodeks"
                  desc="Vi har et formelt adfærdskodeks for leverandører på plads"
                  checked={procurement.has_supplier_code_of_conduct}
                  onChange={v => setProcurement(p => ({ ...p, has_supplier_code_of_conduct: v }))}
                />
              </>
            )}

            {/* Step 3: Medarbejdere (B8-B10) */}
            {step === 3 && (
              <>
                <StepHeader icon={Users} color="bg-indigo-100 text-indigo-600" title="Medarbejdere, Arbejdsmiljø & Løn" subtitle="VSME B8-B10 sociale oplysninger" vsme="B8-B10" />
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">B8 — Medarbejderkarakteristika</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Medarbejdere i alt" unit="antal" value={workforce.employees_total} onChange={v => setWorkforce(w => ({ ...w, employees_total: v }))} />
                    <Field label="Mænd" unit="antal" value={workforce.employees_male} onChange={v => setWorkforce(w => ({ ...w, employees_male: v }))} />
                    <Field label="Kvinder" unit="antal" value={workforce.employees_female} onChange={v => setWorkforce(w => ({ ...w, employees_female: v }))} />
                    <Field label="Faste ansatte" unit="antal" value={workforce.employees_permanent} onChange={v => setWorkforce(w => ({ ...w, employees_permanent: v }))} />
                    <Field label="Midlertidigt ansatte" unit="antal" value={workforce.employees_temporary} onChange={v => setWorkforce(w => ({ ...w, employees_temporary: v }))} />
                    <Field label="Fuldtidsansatte" unit="antal" value={workforce.employees_full_time} onChange={v => setWorkforce(w => ({ ...w, employees_full_time: v }))} />
                    <Field label="Deltidsansatte" unit="antal" value={workforce.employees_part_time} onChange={v => setWorkforce(w => ({ ...w, employees_part_time: v }))} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">B9 — Arbejdsmiljø & Sikkerhed</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Arbejdsulykker (registrerede)" unit="antal" value={workforce.accident_count} onChange={v => setWorkforce(w => ({ ...w, accident_count: v }))} />
                    <Field label="Dødsfald på arbejdspladsen" unit="antal" value={workforce.fatalities} onChange={v => setWorkforce(w => ({ ...w, fatalities: v }))} />
                    <Field label="Lost Time Injury Rate (LTIR)" value={workforce.lost_time_injury_rate} onChange={v => setWorkforce(w => ({ ...w, lost_time_injury_rate: v }))} hint="ulykker med fravær / samlede arbejdstimer × 200.000" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">B10 — Løn, Overenskomst & Uddannelse</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Lønninger over mindsteløn" unit="%" value={workforce.min_wage_pct} onChange={v => setWorkforce(w => ({ ...w, min_wage_pct: v }))} hint="Andel af medarbejdere med løn over minimumsgrænse" />
                    <Field label="Lønforskel (kønsbetinget)" unit="%" value={workforce.gender_pay_gap_pct} onChange={v => setWorkforce(w => ({ ...w, gender_pay_gap_pct: v }))} hint="Positiv = mænd tjener mere" />
                    <Field label="Overenskomstdækning" unit="%" value={workforce.collective_bargaining_pct} onChange={v => setWorkforce(w => ({ ...w, collective_bargaining_pct: v }))} />
                    <Field label="Uddannelsestimer (total)" unit="timer" value={workforce.training_hours_total} onChange={v => setWorkforce(w => ({ ...w, training_hours_total: v }))} />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Miljø (B4-B7) */}
            {step === 4 && (
              <>
                <StepHeader icon={Leaf} color="bg-emerald-100 text-emerald-600" title="Forurening, Vand, Biodiversitet & Affald" subtitle="VSME B4-B7 miljøoplysninger" vsme="B4-B7" />
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">B4 — Forurening</h3>
                  <Toggle
                    label="Forureningsrapportering"
                    desc="Vi er underlagt lovpligtig forureningsrapportering eller har frivillig EMS-certificering"
                    checked={environment.has_pollution_reporting}
                    onChange={v => setEnvironment(e => ({ ...e, has_pollution_reporting: v }))}
                  />
                  {environment.has_pollution_reporting && (
                    <div>
                      <label className="label">Bemærkninger om forurening</label>
                      <textarea
                        className="input min-h-[80px]"
                        placeholder="Beskriv forureningskilder, stoffer og eventuelle hændelser..."
                        value={environment.pollution_notes}
                        onChange={e => setEnvironment(en => ({ ...en, pollution_notes: e.target.value }))}
                      />
                    </div>
                  )}
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">B5 — Biodiversitet</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Lokaliteter nær følsomme naturområder" unit="antal" value={environment.biodiversity_sensitive_sites} onChange={v => setEnvironment(e => ({ ...e, biodiversity_sensitive_sites: v }))} hint="F.eks. Natura 2000-områder" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">B6 — Vand</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Samlet vandforbrug" unit="m³" value={environment.water_withdrawal_m3} onChange={v => setEnvironment(e => ({ ...e, water_withdrawal_m3: v }))} />
                    <Field label="Forbrug i vandstressede områder" unit="m³" value={environment.water_stressed_m3} onChange={v => setEnvironment(e => ({ ...e, water_stressed_m3: v }))} hint="0 hvis ikke relevant" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">B7 — Ressourcer & Affald</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Affald i alt" unit="ton" value={environment.waste_total_tonnes} onChange={v => setEnvironment(e => ({ ...e, waste_total_tonnes: v }))} />
                    <Field label="Genanvendt andel" unit="%" value={environment.waste_recycled_pct} onChange={v => setEnvironment(e => ({ ...e, waste_recycled_pct: v }))} />
                    <Field label="Farligt affald" unit="ton" value={environment.waste_hazardous_tonnes} onChange={v => setEnvironment(e => ({ ...e, waste_hazardous_tonnes: v }))} />
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Politikker */}
            {step === 5 && (
              <>
                <StepHeader icon={Shield} color="bg-green-100 text-green-600" title="ESG-politikker & Ledelse" subtitle="Social & Governance-scoring (VSME B2, B11)" vsme="B2/B11" />
                <div>
                  {([
                    ["has_esg_policy",             "Formel ESG-/bæredygtighedspolitik",     "Dokumenterer jeres miljø- og sociale forpligtelser"],
                    ["has_energy_reduction_target", "Energireduktionstiltag",                "Et konkret mål for at reducere energiforbrug"],
                    ["has_net_zero_target",         "Net-nul-mål",                           "En formel forpligtelse til at nå netto-nul emissioner"],
                    ["has_data_privacy_policy",     "Databeskyttelsespolitik (GDPR)",        "Dækker håndtering af persondata"],
                    ["has_code_of_conduct",         "Adfærdskodeks",                         "Etiske standarder for medarbejdere og ledelse"],
                    ["has_health_safety_policy",    "Arbejdsmiljø- og sikkerhedspolitik",    "Procedurer og forpligtelser for sikkerhed på arbejdspladsen"],
                    ["has_anti_corruption_policy",  "Anti-korruptionspolitik (B11)",         "Forebyggelse af bestikkelse og korruption"],
                    ["has_diversity_policy",        "Diversitets- og inklusionspolitik",     "Fremmer ligebehandling på arbejdspladsen"],
                    ["has_waste_policy",            "Affaldspolitik",                        "Politikker for affaldsreduktion og -sortering"],
                    ["has_water_policy",            "Vandpolitik",                           "Politikker for ansvarlig vandhåndtering"],
                    ["has_board_esg_oversight",     "ESG-tilsyn fra bestyrelsen",            "Bestyrelsen har formelt ansvar for ESG-emner"],
                    ["supply_chain_code_of_conduct","Leverandør-adfærdskodeks",             "Leverandører er forpligtet til etiske standarder"],
                    ["has_training_program",        "Uddannelsesprogram for medarbejdere",   "Strukturerede kompetenceudviklingstilbud"],
                  ] as [string, string, string][]).map(([key, label, desc]) => (
                    <Toggle
                      key={key}
                      label={label}
                      desc={desc}
                      checked={policies[key as keyof typeof policies] as boolean}
                      onChange={v => setPolicies(p => ({ ...p, [key]: v }))}
                    />
                  ))}
                  {policies.has_net_zero_target && (
                    <div className="mt-4">
                      <label className="label">Net-nul-målår</label>
                      <input type="number" className="input" placeholder="F.eks. 2040" value={policies.net_zero_target_year}
                        onChange={e => setPolicies(p => ({ ...p, net_zero_target_year: e.target.value }))} min={2025} max={2100} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 6: Gennemgang */}
            {step === 6 && (
              <>
                <StepHeader icon={BarChart2} color="bg-green-100 text-green-600" title="Gennemgang & Generer rapport" subtitle="Bekræft dine data og start AI-analysen" />

                {completeness && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Datafuldstændighed</span>
                      <span className="font-bold text-green-600">{completeness.completion_pct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completeness.completion_pct}%` }} />
                    </div>
                    {completeness.blocking_issues.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {completeness.blocking_issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            <span className="font-bold mt-0.5">✗</span>{issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {preview && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">CO₂-forhåndsvisning</div>
                    <div className="grid grid-cols-3 gap-3">
                      {(["scope1", "scope2", "scope3"] as const).map((scope, i) => (
                        <div key={scope} className="bg-white rounded-lg p-3 text-center border border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">{["Scope 1","Scope 2","Scope 3"][i]}</div>
                          <div className="text-lg font-bold text-gray-900">{((preview[`${scope}_co2e_tonnes`] as number) || 0).toFixed(1)}</div>
                          <div className="text-xs text-gray-400">tCO₂e</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">I alt</span>
                      <span className="text-xl font-bold text-green-600">{((preview.total_co2e_tonnes as number) || 0).toFixed(2)} tCO₂e</span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-5">
                  Dette indsender dine data og starter AI-drevet ESG-analyse iht. VSME Basic Modul. Den fulde rapport tager ca. 30 sekunder.
                </p>

                <button
                  className="btn-primary w-full py-3 text-base"
                  disabled={!completeness?.is_complete || generating}
                  onClick={handleSubmitAndGenerate}
                >
                  {generating ? "Genererer rapport…" : "Indsend & Generer VSME-rapport →"}
                </button>
                {!completeness?.is_complete && (
                  <p className="text-red-500 text-xs text-center mt-2">Løs de blokerende problemer ovenfor, før du indsender.</p>
                )}
              </>
            )}

            {/* Nav buttons */}
            {step < 6 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} className="btn-secondary" disabled={step === 0}>← Tilbage</button>
                <button onClick={saveStep} className="btn-primary" disabled={saving}>
                  {saving ? "Gemmer…" : step === 5 ? "Gem & Gennemgang →" : "Gem & Fortsæt →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SubmitPageInner />
    </Suspense>
  )
}

function numify(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? 0 : typeof v === "string" ? Number(v) : v]))
}

function numifyNullable(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => {
    if (v === "" || v === null) return [k, null]
    if (typeof v === "string" && !isNaN(Number(v))) return [k, Number(v)]
    return [k, v]
  }))
}

function boolify(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]))
}
