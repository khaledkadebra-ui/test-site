"use client"
/**
 * PdfDownloadButton.tsx — Client-side PDF download using @react-pdf/renderer
 *
 * Uses PDFDownloadLink with className applied directly to the <a> element —
 * never nest a <button> inside <a> as browsers block the click event.
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
    <PDFDownloadLink
      document={<ReportPdfDocument {...props} />}
      fileName={filename}
      className={className ?? "btn-primary flex items-center gap-2 py-2"}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) =>
        loading
          ? <><Loader2 className="w-4 h-4 animate-spin" style={{ display: "inline" }} /> Forbereder PDF…</>
          : <><FileDown className="w-4 h-4" style={{ display: "inline" }} /> Download PDF</>
      }
    </PDFDownloadLink>
  )
}
