"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { register, login } from "@/lib/api"

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
      setError(msg || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-black text-sm">E</span>
            </div>
            <span className="text-xl font-bold">ESG Copilot</span>
          </div>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Jane Doe" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div>
              <label className="label">Work Email</label>
              <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="min 8 characters" value={form.password} onChange={set("password")} minLength={8} required />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 hover:text-green-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
