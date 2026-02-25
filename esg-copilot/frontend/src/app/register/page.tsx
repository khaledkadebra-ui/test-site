"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { register, login } from "@/lib/api"
import { Leaf } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "", fullName: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(form.email, form.password, form.fullName)
      await login(form.email, form.password)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || "Registrering mislykkedes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0d1f2d] flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">ESG Copilot</span>
        </div>
        <div>
          <div className="text-4xl font-bold text-white leading-snug mb-4">
            Start din ESG-<br />rejse i dag
          </div>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Slut dig til hundredvis af SMV&apos;er, der bruger ESG Copilot til at måle, rapportere og forbedre deres bæredygtighedspræstation.
          </p>
          <div className="space-y-3">
            {["Gratis at starte", "Energistyrelsen 2024 emissionsfaktorer", "AI-genereret VSME-rapport", "GDPR-kompatibel — EU-data"].map(f => (
              <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="text-slate-600 text-xs">© 2026 ESG Copilot. Alle rettigheder forbeholdes.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">ESG Copilot</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Opret din konto</h1>
          <p className="text-gray-500 text-sm mb-8">Modtag din første VSME-rapport på under 30 minutter</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Fulde navn</label>
              <input className="input" placeholder="Jane Jensen" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div>
              <label className="label">E-mail (arbejde)</label>
              <input type="email" className="input" placeholder="dig@virksomhed.dk" value={form.email} onChange={set("email")} required />
            </div>
            <div>
              <label className="label">Adgangskode</label>
              <input type="password" className="input" placeholder="Minimum 8 tegn" value={form.password} onChange={set("password")} minLength={8} required />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? "Opretter konto…" : "Opret konto"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Har du allerede en konto?{" "}
            <Link href="/login" className="text-green-600 font-medium hover:text-green-700">Log ind</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
