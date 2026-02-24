"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { saveEnergy, saveTravel, saveProcurement, savePolicies, getCompleteness, submitSubmission, calculatePreview, generateReport } from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Zap, Plane, ShoppingBag, Shield, BarChart2, CheckCircle, ChevronRight } from "lucide-react"

const STEPS = [
  { label: "Energy",      icon: Zap },
  { label: "Travel",      icon: Plane },
  { label: "Procurement", icon: ShoppingBag },
  { label: "Policies",    icon: Shield },
  { label: "Review",      icon: BarChart2 },
]

function Field({ label, unit, value, onChange }: { label: string; unit?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}{unit && <span className="text-gray-400 font-normal ml-1">({unit})</span>}</label>
      <input type="number" className="input" value={value} onChange={e => onChange(e.target.value)} min={0} step="any" placeholder="0" />
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group border-b border-gray-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? "bg-green-500" : "bg-gray-200"}`}
        style={{ height: "22px", width: "40px" }}
      >
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : ""}`}
          style={{ width: "18px", height: "18px" }} />
      </button>
    </label>
  )
}

function SubmitPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const submissionId = params.get("id") || ""
  const startReview = params.get("review") === "1"

  const [step, setStep] = useState(startReview ? 4 : 0)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [completeness, setCompleteness] = useState<{ is_complete: boolean; completion_pct: number; blocking_issues: string[] } | null>(null)
  const [generating, setGenerating] = useState(false)

  const [energy, setEnergy] = useState({ electricity_kwh: "", natural_gas_m3: "", diesel_liters: "", renewable_electricity_pct: "" })
  const [travel, setTravel] = useState({ air_short_haul_km: "", air_long_haul_km: "", rail_km: "", avg_commute_km_one_way: "" })
  const [procurement, setProcurement] = useState({ purchased_goods_spend_eur: "", supplier_count: "", has_supplier_code_of_conduct: false })
  const [policies, setPolicies] = useState({
    has_esg_policy: false, has_data_privacy_policy: false, has_code_of_conduct: false,
    has_health_safety_policy: false, has_anti_corruption_policy: false,
    has_net_zero_target: false, net_zero_target_year: "", has_diversity_policy: false,
  })

  useEffect(() => { if (step === 4) loadReview() }, [step])

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
      if (step === 3) await savePolicies(submissionId, boolify(policies))
      setStep(s => s + 1)
    } catch {
      alert("Save failed — check your values and try again")
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
      alert(msg || "Submit failed")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900">ESG Data Entry</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in your annual figures — leave blank if not applicable</p>
        </div>

        <div className="p-8 max-w-3xl">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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
                {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="card">
            {/* Step 0: Energy */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Energy & Fuel</h2>
                    <p className="text-xs text-gray-500">Annual consumption — used for Scope 1 & 2 calculations</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Electricity" unit="kWh" value={energy.electricity_kwh} onChange={v => setEnergy(e => ({ ...e, electricity_kwh: v }))} />
                  <Field label="Natural Gas" unit="m³" value={energy.natural_gas_m3} onChange={v => setEnergy(e => ({ ...e, natural_gas_m3: v }))} />
                  <Field label="Diesel" unit="litres" value={energy.diesel_liters} onChange={v => setEnergy(e => ({ ...e, diesel_liters: v }))} />
                  <Field label="Renewable Electricity" unit="%" value={energy.renewable_electricity_pct} onChange={v => setEnergy(e => ({ ...e, renewable_electricity_pct: v }))} />
                </div>
              </>
            )}

            {/* Step 1: Travel */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Plane className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Business Travel & Commuting</h2>
                    <p className="text-xs text-gray-500">Annual passenger-kilometres — used for Scope 3 calculations</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Short-haul flights" unit="pkm" value={travel.air_short_haul_km} onChange={v => setTravel(t => ({ ...t, air_short_haul_km: v }))} />
                  <Field label="Long-haul flights" unit="pkm" value={travel.air_long_haul_km} onChange={v => setTravel(t => ({ ...t, air_long_haul_km: v }))} />
                  <Field label="Rail travel" unit="pkm" value={travel.rail_km} onChange={v => setTravel(t => ({ ...t, rail_km: v }))} />
                  <Field label="Avg. commute one-way" unit="km/person" value={travel.avg_commute_km_one_way} onChange={v => setTravel(t => ({ ...t, avg_commute_km_one_way: v }))} />
                </div>
              </>
            )}

            {/* Step 2: Procurement */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Supply Chain & Procurement</h2>
                    <p className="text-xs text-gray-500">Used for Scope 3 upstream emissions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Purchased goods & services" unit="EUR" value={procurement.purchased_goods_spend_eur} onChange={v => setProcurement(p => ({ ...p, purchased_goods_spend_eur: v }))} />
                  <Field label="Number of suppliers" value={procurement.supplier_count} onChange={v => setProcurement(p => ({ ...p, supplier_count: v }))} />
                </div>
                <Toggle
                  label="Supplier code of conduct"
                  desc="We have a formal supplier code of conduct in place"
                  checked={procurement.has_supplier_code_of_conduct}
                  onChange={v => setProcurement(p => ({ ...p, has_supplier_code_of_conduct: v }))}
                />
              </>
            )}

            {/* Step 3: Policies */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">ESG Policies & Governance</h2>
                    <p className="text-xs text-gray-500">Used for Social & Governance scoring</p>
                  </div>
                </div>
                <div>
                  {([
                    ["has_esg_policy",            "Formal ESG / Sustainability policy",     "Documents your environmental and social commitments"],
                    ["has_data_privacy_policy",   "Data Privacy policy (GDPR)",             "Covers how personal data is handled"],
                    ["has_code_of_conduct",       "Code of Conduct",                        "Ethical standards for employees and management"],
                    ["has_health_safety_policy",  "Health & Safety policy",                 "Workplace safety procedures and obligations"],
                    ["has_anti_corruption_policy","Anti-Corruption policy",                 "Bribery and corruption prevention measures"],
                    ["has_net_zero_target",       "Net-Zero target",                        "A formal commitment to reach net-zero emissions"],
                    ["has_diversity_policy",      "Diversity & Inclusion policy",           "Promotes equal opportunity in the workplace"],
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
                      <label className="label">Net-zero target year</label>
                      <input type="number" className="input" placeholder="e.g. 2040" value={policies.net_zero_target_year}
                        onChange={e => setPolicies(p => ({ ...p, net_zero_target_year: e.target.value }))} min={2025} max={2100} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Review & Generate Report</h2>
                    <p className="text-xs text-gray-500">Confirm your data and trigger AI analysis</p>
                  </div>
                </div>

                {completeness && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Data Completion</span>
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
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">CO₂ Preview</div>
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
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-green-600">{((preview.total_co2e_tonnes as number) || 0).toFixed(2)} tCO₂e</span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-5">
                  This will submit your data and trigger AI-powered ESG analysis. The full report takes approximately 30 seconds.
                </p>

                <button
                  className="btn-primary w-full py-3 text-base"
                  disabled={!completeness?.is_complete || generating}
                  onClick={handleSubmitAndGenerate}
                >
                  {generating ? "Generating report…" : "Submit & Generate ESG Report →"}
                </button>
                {!completeness?.is_complete && (
                  <p className="text-red-500 text-xs text-center mt-2">Resolve blocking issues above before submitting.</p>
                )}
              </>
            )}

            {/* Nav buttons */}
            {step < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} className="btn-secondary" disabled={step === 0}>← Back</button>
                <button onClick={saveStep} className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : step === 3 ? "Save & Review →" : "Save & Continue →"}
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

function boolify(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]))
}
