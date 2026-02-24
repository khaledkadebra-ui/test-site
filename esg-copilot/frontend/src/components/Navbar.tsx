"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Leaf, Menu, X, ChevronDown } from "lucide-react"

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"))
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">ESG Copilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
              Go to dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary text-sm py-2 px-4">
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-3 shadow-lg">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-green-600 py-1"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {loggedIn ? (
              <Link href="/dashboard" className="btn-primary text-sm text-center py-2.5">
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm text-center py-2.5">Sign in</Link>
                <Link href="/register" className="btn-primary text-sm text-center py-2.5">Get started free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
