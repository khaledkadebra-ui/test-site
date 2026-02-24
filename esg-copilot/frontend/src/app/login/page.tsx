"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { login } from "@/lib/api"
import { Leaf } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || "Invalid email or password")
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
            AI-powered ESG<br />reporting for SMEs
          </div>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Calculate your carbon footprint, score your ESG performance, and get a board-ready report in minutes.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[["CO₂", "Scope 1, 2 & 3"], ["ESG Score", "A–E rating"], ["Report", "AI-generated"]].map(([title, sub]) => (
              <div key={title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-green-400 font-bold text-lg">{title}</div>
                <div className="text-slate-400 text-xs mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-slate-600 text-xs">© 2025 ESG Copilot. All rights reserved.</div>
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your ESG Copilot account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Work Email</label>
              <input type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{" "}
            <Link href="/register" className="text-green-600 font-medium hover:text-green-700">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
