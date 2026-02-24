import Link from "next/link"
import { Leaf } from "lucide-react"

const LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "GDPR", href: "/gdpr" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "mailto:hello@esg-copilot.com" },
    { label: "Dashboard", href: "/dashboard" },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#0d1f2d] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">ESG Copilot</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              AI-powered ESG reporting for modern businesses. Generate VSME-compliant reports in under 30 minutes.
            </p>
            <div className="flex gap-3">
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-slate-300">GDPR Compliant</span>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-slate-300">EU Data</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-white mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2025 ESG Copilot. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-500 text-xs">
            <span>DEFRA 2023 Emission Factors</span>
            <span>·</span>
            <span>VSME Ready</span>
            <span>·</span>
            <span>ISO 14064 Aligned</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
