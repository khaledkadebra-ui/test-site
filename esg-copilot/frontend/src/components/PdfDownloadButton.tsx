"use client"
/**
 * PdfDownloadButton.tsx — Generates PDF on click using pdf().toBlob()
 *
 * Uses the pdf() renderer API instead of PDFDownloadLink so we get:
 * - A real <button> element (no anchor-nesting issues)
 * - try/catch error handling (shows user-facing error if generation fails)
 * - Lazy generation — only runs when the user clicks, not on mount
 */
import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { ReportPdfDocument, ReportPdfProps } from "./ReportPdf"
import { FileDown, Loader2 } from "lucide-react"

interface PdfDownloadButtonProps extends ReportPdfProps {
  className?: string
}

export default function PdfDownloadButton({ className, ...props }: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const filename = `${props.companyName.replace(/\s+/g, "_")}_VSME_Rapport_${props.reportYear}.pdf`

  async function handleClick() {
    setLoading(true)
    setError(false)
    try {
      const blob = await pdf(<ReportPdfDocument {...props} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF generation failed:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={className ?? "btn-primary flex items-center gap-2 py-2"}
      onClick={handleClick}
      disabled={loading}
      title={error ? "PDF-generering fejlede — prøv igen" : undefined}
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Genererer PDF…</>
        : error
          ? <><FileDown className="w-4 h-4" /> Fejl — prøv igen</>
          : <><FileDown className="w-4 h-4" /> Download PDF</>
      }
    </button>
  )
}
