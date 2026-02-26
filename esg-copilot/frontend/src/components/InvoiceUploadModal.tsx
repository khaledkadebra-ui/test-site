"use client"
/**
 * InvoiceUploadModal — drag-and-drop document uploader with AI extraction
 *
 * Usage:
 *   <InvoiceUploadModal
 *     documentType="electricity_bill"
 *     submissionId={submissionId}
 *     onExtracted={(fields) => { /* pre-fill wizard fields *\/ }}
 *     onClose={() => setShowModal(false)}
 *   />
 */
import { useState, useRef } from "react"
import { uploadDocument, extractDocument } from "@/lib/api"
import { Upload, Loader2, CheckCircle2, X, FileText, AlertCircle } from "lucide-react"

type DocumentType = "electricity_bill" | "gas_invoice" | "water_bill" | "fuel_receipt" | "waste_invoice" | "general"

interface InvoiceUploadModalProps {
  documentType: DocumentType
  submissionId?: string
  onExtracted: (fields: Record<string, number | string | null>) => void
  onClose: () => void
}

const DOC_LABELS: Record<DocumentType, string> = {
  electricity_bill: "elregning",
  gas_invoice:      "gasregning",
  water_bill:       "vandregning",
  fuel_receipt:     "brændstofkvittering",
  waste_invoice:    "affaldsopgørelse",
  general:          "ESG-dokument",
}

type Phase = "idle" | "uploading" | "extracting" | "done" | "error"

export default function InvoiceUploadModal({ documentType, submissionId, onExtracted, onClose }: InvoiceUploadModalProps) {
  const [phase, setPhase]         = useState<Phase>("idle")
  const [dragOver, setDragOver]   = useState(false)
  const [result, setResult]       = useState<{ fields: Record<string, number | string | null>; confidence: number; excerpt: string } | null>(null)
  const [errorMsg, setErrorMsg]   = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const allowed = ["pdf", "jpg", "jpeg", "png"]
    if (!allowed.includes(ext)) {
      setErrorMsg(`Filtype '.${ext}' understøttes ikke. Brug PDF, JPG eller PNG.`)
      setPhase("error")
      return
    }

    setPhase("uploading")
    setErrorMsg("")

    try {
      // Step 1: Upload file
      const uploaded = await uploadDocument(file, submissionId)
      const docId = uploaded.document_id

      // Step 2: AI extraction
      setPhase("extracting")
      const extraction = await extractDocument(docId, documentType)

      setResult({
        fields: extraction.fields,
        confidence: extraction.confidence,
        excerpt: extraction.raw_text_excerpt || "",
      })
      setPhase("done")
    } catch (err) {
      console.error("Upload/extraction failed:", err)
      setErrorMsg("Udtræk mislykkedes. Kontrollér at filen er læsbar og prøv igen.")
      setPhase("error")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleUseValues() {
    if (result) onExtracted(result.fields)
    onClose()
  }

  const docLabel = DOC_LABELS[documentType]
  const fieldsFound = result ? Object.values(result.fields).filter(v => v !== null).length : 0
  const confidencePct = result ? Math.round(result.confidence * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Upload {docLabel}</h2>
            <p className="text-xs text-gray-400 mt-0.5">AI udtrækker værdier automatisk</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Idle — drop zone */}
          {phase === "idle" && (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-700 mb-1">Træk fil hertil eller klik for at vælge</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG · Maks 50 MB</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Uploading */}
          {phase === "uploading" && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Uploader fil…</p>
            </div>
          )}

          {/* Extracting */}
          {phase === "extracting" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileText className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-gray-800 mb-1">AI læser dokumentet…</p>
              <p className="text-sm text-gray-400">Claude analyserer {docLabel} og udtrækker tal</p>
            </div>
          )}

          {/* Done */}
          {phase === "done" && result && (
            <div>
              {/* Confidence banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 ${
                result.confidence >= 0.8 ? "bg-emerald-50 border border-emerald-200" :
                result.confidence >= 0.5 ? "bg-amber-50 border border-amber-200" :
                "bg-red-50 border border-red-200"
              }`}>
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                  result.confidence >= 0.8 ? "text-emerald-600" :
                  result.confidence >= 0.5 ? "text-amber-600" : "text-red-500"
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    result.confidence >= 0.8 ? "text-emerald-800" :
                    result.confidence >= 0.5 ? "text-amber-800" : "text-red-700"
                  }`}>
                    {fieldsFound} {fieldsFound === 1 ? "felt fundet" : "felter fundet"} · {confidencePct}% sikkerhed
                  </p>
                  {result.excerpt && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">"{result.excerpt}"</p>
                  )}
                </div>
              </div>

              {/* Extracted fields */}
              <div className="space-y-2 mb-5">
                {Object.entries(result.fields).map(([field, value]) => (
                  value !== null && (
                    <div key={field} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600 capitalize">{field.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-gray-900 text-sm">{String(value)}</span>
                    </div>
                  )
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={handleUseValues} className="btn-primary flex-1 py-2.5">
                  Brug disse værdier
                </button>
                <button
                  onClick={() => { setPhase("idle"); setResult(null) }}
                  className="btn-secondary py-2.5 px-4"
                >
                  Upload anden fil
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Udtræk mislykkedes</p>
              <p className="text-sm text-gray-400 mb-5">{errorMsg}</p>
              <button onClick={() => setPhase("idle")} className="btn-primary py-2">
                Prøv igen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
