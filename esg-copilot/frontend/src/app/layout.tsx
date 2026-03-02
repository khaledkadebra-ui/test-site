import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ESG Copilot — AI-drevet VSME-rapportering til SMV'er",
  description: "Generer en komplet VSME-bæredygtighedsrapport med klimaaftryk, AI-analyse og professionel PDF på under 30 minutter. 13 specialiserede AI-agenter. 100% dansk.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
