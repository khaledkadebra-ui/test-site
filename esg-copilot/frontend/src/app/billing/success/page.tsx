"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Suspense } from "react"

function SuccessInner() {
  const router = useRouter()
  useEffect(() => {
    // Delay then redirect to dashboard
    const t = setTimeout(() => router.push("/dashboard"), 5000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription activated!</h1>
          <p className="text-gray-500 mb-8">
            Your subscription is now active. You'll receive a confirmation email shortly.
            Redirecting to your dashboard in a moment…
          </p>
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
            Go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  )
}
