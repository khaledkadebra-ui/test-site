"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getMe, getCompany } from "@/lib/api"
import api from "@/lib/api"
import Sidebar from "@/components/Sidebar"
import { Upload, FileText, Trash2, AlertCircle } from "lucide-react"

type Doc = { id: string; filename: string; file_type: string; size_bytes: number; created_at: string; submission_id?: string }

export default function UploadsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [meta, setMeta] = useState({ companyName: "", userEmail: "", plan: "" })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const me = await getMe()
      setMeta({ userEmail: me.email, plan: me.subscription_plan || "free", companyName: "" })
      if (me.company_id) {
        const c = await getCompany(me.company_id)
        setMeta(m => ({ ...m, companyName: c.name }))
      }
      const r = await api.get("/documents").catch(() => ({ data: [] }))
      setDocs(r.data || [])
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError("")
    try {
      const form = new FormData()
      form.append("file", file)
      const r = await api.post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setDocs(d => [r.data, ...d])
    } catch {
      setError("Upload mislykkedes — kun PDF, Excel og CSV understøttes (maks 50 MB)")
    } finally {
      setUploading(false)
    }
  }

  async function deleteDoc(id: string) {
    try {
      await api.delete(`/documents/${id}`)
      setDocs(d => d.filter(doc => doc.id !== id))
    } catch { setError("Sletning mislykkedes") }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function fmt(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyName={meta.companyName} userEmail={meta.userEmail} subscriptionPlan={meta.plan} />
      <div className="ml-60 flex-1">
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-500" /> Data & Upload
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload fakturaer og dokumenter til automatisk dataudtræk</p>
        </div>

        <div className="p-8 max-w-3xl space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragOver ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-green-500" : "text-gray-300"}`} />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                Uploader…
              </div>
            ) : (
              <>
                <div className="text-gray-700 font-medium mb-1">Træk filer hertil eller klik for at vælge</div>
                <div className="text-xs text-gray-400">PDF, Excel, CSV — maks 50 MB</div>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* File list */}
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : docs.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-sm">Ingen filer uploadet endnu</div>
            </div>
          ) : (
            <div className="card">
              <h2 className="section-title">Uploadede filer ({docs.length})</h2>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.filename}</div>
                      <div className="text-xs text-gray-400">{doc.file_type?.toUpperCase()} · {fmt(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString("da-DK")}</div>
                    </div>
                    <button onClick={() => deleteDoc(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-600 leading-relaxed">
            <strong>Tip:</strong> Upload elregninger, gasregninger og vandregninger — systemet udtrækker automatisk forbrugsdata og foreslår værdier til dine datafelter (kommer snart).
          </div>
        </div>
      </div>
    </div>
  )
}
