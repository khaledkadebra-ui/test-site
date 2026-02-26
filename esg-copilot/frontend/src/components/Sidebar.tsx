"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/api"
import {
  LayoutDashboard, Wind, Target, FileText, TrendingUp,
  Upload, Settings, CreditCard, LogOut, Leaf, Zap, Microscope
} from "lucide-react"

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

export default function Sidebar({ companyName, userEmail, subscriptionPlan }: SidebarProps) {
  const pathname = usePathname()

  const planLabel = { free: "Free", starter: "Starter", professional: "Pro" }[subscriptionPlan || "free"] || "Free"
  const isPro = subscriptionPlan === "professional"

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0d1f2d] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:bg-green-600 transition-colors">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">ESG Copilot</div>
            <div className="text-green-400 text-[10px] font-medium tracking-wider uppercase">AI Powered</div>
          </div>
        </Link>
        {companyName && (
          <div className="mt-3 px-2 py-1.5 bg-white/5 rounded-lg">
            <div className="text-slate-300 text-xs font-medium truncate">{companyName}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
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
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-green-400" : "text-slate-500"}`} />
                    <span className="truncate">{label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
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
          <Link href="/billing" className="block bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-xl p-3 hover:from-green-500/30 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">{planLabel} plan</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {subscriptionPlan === "starter" ? "Opgrader til Pro for ubegrænsede rapporter" : "Opgrader for PDF-eksport og flere rapporter"}
            </p>
            <div className="mt-1.5 text-green-400 text-xs font-semibold">Opgrader →</div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-slate-300 text-xs font-medium truncate mb-3">{userEmail || "—"}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log ud
        </button>
      </div>
    </aside>
  )
}
