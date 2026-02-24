"use client"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2, Leaf } from "lucide-react"
import api from "@/lib/api"

function VerifyEmailInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link.")
      return
    }
    api.post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success")
        setTimeout(() => router.push("/dashboard"), 3000)
      })
      .catch((err) => {
        setStatus("error")
        setMessage(err?.response?.data?.detail || "Verification failed. The link may have expired.")
      })
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">ESG Copilot</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
              <p className="text-gray-500 text-sm">Just a moment.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Your email has been confirmed. Redirecting to your dashboard…
              </p>
              <Link href="/dashboard" className="btn-primary px-6 py-2.5">
                Go to dashboard →
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link href="/dashboard" className="btn-primary px-6 py-2.5 block text-center">
                  Go to dashboard
                </Link>
                <ResendButton />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ResendButton() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function resend() {
    setLoading(true)
    try {
      await api.post("/auth/resend-verification")
      setSent(true)
    } catch {
      alert("Could not resend. Please log in first.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <p className="text-green-600 text-sm font-medium">New verification email sent!</p>
  return (
    <button onClick={resend} disabled={loading} className="btn-secondary px-6 py-2.5">
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}
