"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { saveEnergy, saveTravel, saveProcurement, savePolicies, getCompleteness, submitSubmission, calculatePreview, generateReport } from "@/lib/api"

const STEPS = ["Energy", "Travel", "Procurement", "Policies", "Review"]

export default function SubmitPage() {
  const router = useRouter()
  const params = useSearchParams()
  const submissionId = params.get("id") || ""
  const startReview = params.get("review") === "1"

  const [step, setStep] = useState(startReview ? 4 : 0)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [completeness, setCompleteness] = useState<{ is_complete: boolean; completion_pct: number; blocking_issues: string[] } | null>(null)
  const [generating, setGenerating] = useState(false)

  // Energy state
  const [energy, setEnergy] = useState({ electricity_kwh: "", natural_gas_m3: "", diesel_liters: "", renewable_electricity_pct: "" })
  // Travel state
  const [travel, setTravel] = useState({ air_short_haul_km: "", air_long_haul_km: "", rail_km: "", avg_commute_km_one_way: "" })
  // Procurement state
  const [procurement, setProcurement] = useState({ purchased_goods_spend_eur: "", supplier_count: "", has_supplier_code_of_conduct: false })
  // Policy state
  const [policies, setPolicies] = useState({
    has_esg_policy: false, has_data_privacy_policy: false, has_code_of_conduct: false,
    has_health_safety_policy: false, has_anti_corruption_policy: false,
    has_net_zero_target: false, net_zero_target_year: "", has_diversity_policy: false,
  })

  useEffect(() => {
    if (step === 4) loadReview()
  }, [step])

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
    <div className="min-h-screen">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
            <span className="text-slate-900 font-black text-xs">E</span>
          </div>
          <span className="font-bold">ESG Copilot</span>
        </div>
        <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-slate-200 text-sm">← Dashboard</button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < step ? "bg-green-500 text-slate-900" : i === step ? "bg-green-500/20 border border-green-500 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "text-slate-100 font-medium" : "text-slate-500"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="h-px w-6 bg-slate-700" />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 0: Energy */}
          {step === 0 && (
            <>
              <h2 className="section-title">Energy &amp; Fuel Data</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your annual consumption figures. Leave blank if not applicable.</p>
              <div className="space-y-4">
                <Field label="Electricity (kWh)" value={energy.electricity_kwh} onChange={v => setEnergy(e => ({ ...e, electricity_kwh: v }))} />
                <Field label="Natural Gas (m³)" value={energy.natural_gas_m3} onChange={v => setEnergy(e => ({ ...e, natural_gas_m3: v }))} />
                <Field label="Diesel (litres)" value={energy.diesel_liters} onChange={v => setEnergy(e => ({ ...e, diesel_liters: v }))} />
                <Field label="Renewable Electricity (%)" value={energy.renewable_electricity_pct} onChange={v => setEnergy(e => ({ ...e, renewable_electricity_pct: v }))} />
              </div>
            </>
          )}

          {/* Step 1: Travel */}
          {step === 1 && (
            <>
              <h2 className="section-title">Business Travel &amp; Commuting</h2>
              <div className="space-y-4">
                <Field label="Short-haul flights (passenger-km)" value={travel.air_short_haul_km} onChange={v => setTravel(t => ({ ...t, air_short_haul_km: v }))} />
                <Field label="Long-haul flights (passenger-km)" value={travel.air_long_haul_km} onChange={v => setTravel(t => ({ ...t, air_long_haul_km: v }))} />
                <Field label="Rail (passenger-km)" value={travel.rail_km} onChange={v => setTravel(t => ({ ...t, rail_km: v }))} />
                <Field label="Average commute one-way (km)" value={travel.avg_commute_km_one_way} onChange={v => setTravel(t => ({ ...t, avg_commute_km_one_way: v }))} />
              </div>
            </>
          )}

          {/* Step 2: Procurement */}
          {step === 2 && (
            <>
              <h2 className="section-title">Supply Chain &amp; Procurement</h2>
              <div className="space-y-4">
                <Field label="Purchased goods &amp; services spend (EUR)" value={procurement.purchased_goods_spend_eur} onChange={v => setProcurement(p => ({ ...p, purchased_goods_spend_eur: v }))} />
                <Field label="Number of suppliers" value={procurement.supplier_count} onChange={v => setProcurement(p => ({ ...p, supplier_count: v }))} />
                <Check label="We have a supplier code of conduct" checked={procurement.has_supplier_code_of_conduct} onChange={v => setProcurement(p => ({ ...p, has_supplier_code_of_conduct: v }))} />
              </div>
            </>
          )}

          {/* Step 3: Policies */}
          {step === 3 && (
            <>
              <h2 className="section-title">ESG Policies &amp; Governance</h2>
              <div className="space-y-3">
                {([
                  ["has_esg_policy", "We have a formal ESG / sustainability policy"],
                  ["has_data_privacy_policy", "We have a data privacy policy (GDPR)"],
                  ["has_code_of_conduct", "We have a code of conduct"],
                  ["has_health_safety_policy", "We have a health &amp; safety policy"],
                  ["has_anti_corruption_policy", "We have an anti-corruption policy"],
                  ["has_net_zero_target", "We have a net-zero target"],
                  ["has_diversity_policy", "We have a diversity &amp; inclusion policy"],
                ] as [string, string][]).map(([key, label]) => (
                  <Check
                    key={key}
                    label={label}
                    checked={policies[key as keyof typeof policies] as boolean}
                    onChange={v => setPolicies(p => ({ ...p, [key]: v }))}
                  />
                ))}
                {policies.has_net_zero_target && (
                  <Field label="Net-zero target year" value={policies.net_zero_target_year} onChange={v => setPolicies(p => ({ ...p, net_zero_target_year: v }))} />
                )}
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <>
              <h2 className="section-title">Review &amp; Generate Report</h2>
              {completeness && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Completion</span>
                    <span className="text-sm font-bold text-green-400">{completeness.completion_pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completeness.completion_pct}%` }} />
                  </div>
                  {completeness.blocking_issues.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {completeness.blocking_issues.map((issue, i) => (
                        <div key={i} className="text-sm text-red-400 flex items-center gap-2">
                          <span>✗</span>{issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {preview && (
                <div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">CO₂ Preview</div>
                  {(["scope1", "scope2", "scope3"] as const).map(scope => (
                    <div key={scope} className="flex justify-between text-sm">
                      <span className="text-slate-400">{scope.replace("scope", "Scope ")} (direct/energy/value chain)</span>
                      <span className="font-mono font-semibold">
                        {((preview[`${scope}_co2e_tonnes`] as number) || 0).toFixed(2)} t
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-400">{((preview.total_co2e_tonnes as number) || 0).toFixed(2)} tCO₂e</span>
                  </div>
                </div>
              )}

              <p className="text-slate-400 text-sm mb-6">
                This will submit your data and trigger AI-powered ESG analysis. The full report including narrative takes ~30 seconds.
              </p>

              <button
                className="btn-primary w-full"
                disabled={!completeness?.is_complete || generating}
                onClick={handleSubmitAndGenerate}
              >
                {generating ? "Generating report…" : "Submit &amp; Generate ESG Report"}
              </button>
              {!completeness?.is_complete && (
                <p className="text-red-400 text-xs text-center mt-2">Fix blocking issues above before submitting.</p>
              )}
            </>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} className="btn-secondary" disabled={step === 0}>Back</button>
              <button onClick={saveStep} className="btn-primary" disabled={saving}>{saving ? "Saving…" : step === 3 ? "Save & Review" : "Save & Continue"}</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label" dangerouslySetInnerHTML={{ __html: label }} />
      <input type="number" className="input" value={value} onChange={e => onChange(e.target.value)} min={0} step="any" />
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
        ${checked ? "bg-green-500 border-green-500" : "border-slate-600 group-hover:border-slate-400"}`}
        onClick={() => onChange(!checked)}>
        {checked && <span className="text-slate-900 text-xs font-bold">✓</span>}
      </div>
      <span className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: label }} />
    </label>
  )
}

function numify(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? 0 : typeof v === "string" ? Number(v) : v]))
}

function boolify(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]))
}
