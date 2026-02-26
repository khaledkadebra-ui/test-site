"use client"
/**
 * PdfDownloadButton.tsx — Client-side PDF download using @react-pdf/renderer
 *
 * Loaded with dynamic import (ssr: false) from the report page so that
 * @react-pdf/renderer never runs on the server (it is browser-only).
 */
import { PDFDownloadLink } from "@react-pdf/renderer"
import { ReportPdfDocument, ReportPdfProps } from "./ReportPdf"
import { FileDown, Loader2 } from "lucide-react"

interface PdfDownloadButtonProps extends ReportPdfProps {
  className?: string
}

export default function PdfDownloadButton({ className, ...props }: PdfDownloadButtonProps) {
  const filename = `${props.companyName.replace(/\s+/g, "_")}_VSME_Rapport_${props.reportYear}.pdf`

  return (
    <PDFDownloadLink document={<ReportPdfDocument {...props} />} fileName={filename}>
      {({ loading, error }) => (
        <button
          className={className ?? "btn-primary flex items-center gap-2 py-2"}
          disabled={loading}
          title={error ? "PDF-generering fejlede — prøv igen" : undefined}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Forbereder PDF…</>
            : <><FileDown className="w-4 h-4" /> Download PDF</>
          }
        </button>
      )}
    </PDFDownloadLink>
  )
}
