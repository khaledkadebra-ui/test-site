"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/api"
import { LayoutDashboard, FileText, PlusCircle, LogOut, Leaf, CreditCard, Zap } from "lucide-react"

interface SidebarProps {
  companyName?: string
  userEmail?: string
  subscriptionPlan?: string
}

const NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/submit",    label: "Data Entry",  icon: PlusCircle },
  { href: "/billing",   label: "Billing",     icon: CreditCard },
]

export default function Sidebar({ companyName, userEmail, subscriptionPlan }: SidebarProps) {
  const pathname = usePathname()

  const planLabel = { free: "Free", starter: "Starter", professional: "Pro" }[subscriptionPlan || "free"] || "Free"
  const isPro = subscriptionPlan === "professional"
  const isStarter = subscriptionPlan === "starter"

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
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
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
              <Icon className={`w-4 h-4 ${active ? "text-green-400" : "text-slate-500"}`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge + upsell */}
      {!isPro && (
        <div className="px-3 pb-4">
          <Link href="/billing" className="block bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-xl p-3 hover:from-green-500/30 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">{planLabel} plan</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {subscriptionPlan === "starter" ? "Upgrade to Pro for unlimited reports & API access" : "Upgrade for PDF export & more reports"}
            </p>
            <div className="mt-2 text-green-400 text-xs font-semibold">Upgrade →</div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-5 border-t border-white/10">
        <div className="text-slate-300 text-xs font-medium truncate mb-3">{userEmail || "—"}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
