"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/api"
import {
  LayoutDashboard, Wind, Target, FileText, TrendingUp,
  Upload, Settings, CreditCard, LogOut, Leaf, Zap, Microscope, BarChart2
} from "lucide-react"
import ChatWidget from "./ChatWidget"

interface SidebarProps {
  companyName?: string
  userEmail?: string
  subscriptionPlan?: string
}

const NAV_GROUPS = [
  {
    label: "Analyse",
    items: [
      { href: "/dashboard",    label: "Dashboard",          icon: LayoutDashboard },
      { href: "/co2",          label: "CO₂ Emissioner",     icon: Wind },
      { href: "/improvements", label: "Forbedringer",       icon: Target },
      { href: "/reports",      label: "VSME Rapport",       icon: FileText },
      { href: "/goals",        label: "Mål & Målsætninger", icon: TrendingUp },
      { href: "/trends",       label: "ESG Historik",       icon: BarChart2 },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/uploads",     label: "Data & Upload",          icon: Upload },
      { href: "/materiality", label: "Væsentlighedsanalyse",   icon: Microscope },
    ],
  },
  {
    label: "Konto",
    items: [
      { href: "/settings", label: "Indstillinger", icon: Settings },
      { href: "/billing",  label: "Fakturering",   icon: CreditCard },
    ],
  },
]

export default function Sidebar({ companyName, userEmail, subscriptionPlan, chatContext }: SidebarProps & { chatContext?: Record<string, unknown> }) {
  const pathname = usePathname()

  const planLabel = { free: "Free", starter: "Starter", professional: "Pro" }[subscriptionPlan || "free"] || "Free"
  const isPro = subscriptionPlan === "professional"

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:bg-emerald-600 transition-colors">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-gray-900 font-bold text-base leading-tight">ESG Copilot</div>
            <div className="text-emerald-500 text-[10px] font-semibold tracking-wider uppercase">AI Powered</div>
          </div>
        </Link>
        {companyName && (
          <div className="mt-3 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-gray-500 text-xs font-medium truncate">{companyName}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className="truncate">{label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plan badge + upsell */}
      {!isPro && (
        <div className="px-3 pb-3">
          <Link href="/billing" className="block bg-emerald-50 border border-emerald-100 rounded-xl p-3 hover:bg-emerald-100/60 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">{planLabel} plan</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              {subscriptionPlan === "starter" ? "Opgrader til Pro for ubegrænsede rapporter" : "Opgrader for PDF-eksport og flere rapporter"}
            </p>
            <div className="mt-1.5 text-emerald-600 text-xs font-semibold">Opgrader →</div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="text-gray-500 text-xs font-medium truncate mb-3">{userEmail || "—"}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log ud
        </button>
      </div>

      {/* Floating ESG Coach chat widget — rendered outside sidebar stacking context */}
      <ChatWidget context={chatContext} />
    </aside>
  )
}
