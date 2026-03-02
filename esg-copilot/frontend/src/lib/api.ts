/**
 * API client for ESG Copilot backend.
 * All requests are authenticated via Bearer token stored in localStorage.
 */

import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const api = axios.create({ baseURL: `${API_URL}/api/v1` })

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password })
  localStorage.setItem("token", data.access_token)
  return data
}

export async function register(email: string, password: string, fullName: string) {
  const { data } = await api.post("/auth/register", { email, password, full_name: fullName })
  return data
}

export async function getMe() {
  const { data } = await api.get("/auth/me")
  return data
}

export function logout() {
  localStorage.removeItem("token")
  window.location.href = "/login"
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function cvrLookup(cvr: string) {
  const { data } = await api.get("/companies/cvr-lookup", { params: { cvr } })
  return data as {
    name: string; cvr: string; industry_code: string; industry_desc: string;
    city: string; country_code: string; employee_count: number | null;
  }
}

export async function createCompany(payload: Record<string, unknown>) {
  const { data } = await api.post("/companies", payload)
  return data
}

export async function getCompany(id: string) {
  const { data } = await api.get(`/companies/${id}`)
  return data
}

export async function listSubmissions(companyId: string) {
  const { data } = await api.get(`/companies/${companyId}/submissions`)
  return data
}

export async function createSubmission(companyId: string, year: number) {
  const { data } = await api.post(`/companies/${companyId}/submissions`, { reporting_year: year })
  return data
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function saveEnergy(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/energy`, payload)
  return data
}

export async function saveTravel(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/travel`, payload)
  return data
}

export async function saveProcurement(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/procurement`, payload)
  return data
}

export async function savePolicies(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/policies`, payload)
  return data
}

export async function saveWorkforce(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/workforce`, payload)
  return data
}

export async function saveEnvironment(submissionId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/submissions/${submissionId}/environment`, payload)
  return data
}

export async function getCompleteness(submissionId: string) {
  const { data } = await api.get(`/submissions/${submissionId}/completeness`)
  return data
}

export async function calculatePreview(submissionId: string) {
  const { data } = await api.get(`/submissions/${submissionId}/calculate-preview`)
  return data
}

export async function scorePreview(submissionId: string) {
  const { data } = await api.get(`/submissions/${submissionId}/score-preview`)
  return data
}

export async function submitSubmission(submissionId: string) {
  const { data } = await api.post(`/submissions/${submissionId}/submit`)
  return data
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function listReports() {
  const { data } = await api.get("/reports")
  return data
}

export async function generateReport(submissionId: string, includeAI = true) {
  const { data } = await api.post("/reports/generate", {
    submission_id: submissionId,
    include_ai_narrative: includeAI,
  })
  return data
}

export async function getReportStatus(reportId: string) {
  const { data } = await api.get(`/reports/${reportId}/status`)
  return data
}

export async function getReport(reportId: string) {
  const { data } = await api.get(`/reports/${reportId}`)
  return data
}

export async function getPdfUrl(reportId: string) {
  const { data } = await api.get(`/reports/${reportId}/pdf`)
  return data
}

// ── Billing ────────────────────────────────────────────────────────────────────

export async function getSubscriptionStatus() {
  const { data } = await api.get("/billing/status")
  return data
}

export async function createCheckoutSession(plan: string) {
  const { data } = await api.post("/billing/checkout", { plan })
  return data
}

export async function createPortalSession() {
  const { data } = await api.post("/billing/portal")
  return data
}

// ── Materiality Assessment ─────────────────────────────────────────────────────

export async function runMaterialityAssessment(companyId: string) {
  const { data } = await api.post(`/companies/${companyId}/materiality`, undefined, { timeout: 60000 })
  return data
}

export async function getMaterialityAssessment(companyId: string) {
  const { data } = await api.get(`/companies/${companyId}/materiality`)
  return data
}

export async function clearMaterialityAssessment(companyId: string) {
  await api.delete(`/companies/${companyId}/materiality`)
}

// ── Document Extraction ────────────────────────────────────────────────────────

export async function uploadDocument(file: File, submissionId?: string) {
  const form = new FormData()
  form.append("file", file)
  if (submissionId) form.append("submission_id", submissionId)
  const { data } = await api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export async function extractDocument(
  documentId: string,
  documentType: "electricity_bill" | "gas_invoice" | "water_bill" | "fuel_receipt" | "waste_invoice" | "general" = "general"
) {
  const form = new FormData()
  form.append("document_type", documentType)
  const { data } = await api.post(`/documents/${documentId}/extract`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export async function listDocuments() {
  const { data } = await api.get("/documents")
  return data
}

// ── Agent / AI Coach ───────────────────────────────────────────────────────────

export interface ChatMessage { role: "user" | "assistant"; content: string }

export async function agentChat(
  message: string,
  history: ChatMessage[] = [],
  context: Record<string, unknown> = {}
) {
  const { data } = await api.post("/agent/chat", { message, history, context })
  return data as { response: string; ok: boolean }
}

export async function agentAnalyze(
  userMessage: string,
  context: Record<string, unknown> = {},
  history: Array<Record<string, unknown>> = []
) {
  const { data } = await api.post("/agent/analyze", {
    user_message: userMessage,
    context,
    history,
  })
  return data as { answer: string; trace: unknown[]; ok: boolean }
}

export async function agentCompliance(submissionData: Record<string, unknown>, industryCode = "technology") {
  const { data } = await api.post("/agent/compliance", {
    submission_data: submissionData,
    industry_code: industryCode,
  })
  return data
}

export async function agentClimateRisk(params: {
  industry_code: string; country_code?: string;
  scope1_co2e?: number; scope2_co2e?: number; scope3_co2e?: number;
}) {
  const { data } = await api.post("/agent/climate-risk", params)
  return data
}

export async function agentBenchmark(params: {
  industry_code: string; esg_score_total: number;
  total_co2e_tonnes?: number; employee_count?: number;
}) {
  const { data } = await api.post("/agent/benchmark", params)
  return data
}

export async function agentImprove(params: {
  esg_score_total: number; gap_areas: string[];
  esg_score_e?: number; esg_score_s?: number; esg_score_g?: number;
  industry_code?: string;
}) {
  const { data } = await api.post("/agent/improve", params)
  return data
}

export async function agentRoadmap(params: {
  improvement_actions: string[]; reporting_year?: number; company_size?: string;
}) {
  const { data } = await api.post("/agent/roadmap", params)
  return data
}

export async function agentGHGCalculate(params: {
  scope1?: Record<string, unknown>; scope2?: Record<string, unknown>; scope3?: Record<string, unknown>;
  employee_count?: number; revenue_dkk?: number; industry_code?: string; explain_anomalies?: boolean;
}) {
  const { data } = await api.post("/agent/ghg-calculate", params)
  return data
}

export async function agentMateriality(params: {
  industry_code: string; employee_count?: number; revenue_eur?: number; country_code?: string;
}) {
  const { data } = await api.post("/agent/materiality", params)
  return data
}

export async function agentWriteReport(params: {
  company_name: string; reporting_year?: number;
  calc_dict: Record<string, unknown>; esg_score_dict: Record<string, unknown>;
  gap_report_dict?: Record<string, unknown>; workforce_data?: Record<string, unknown>;
  policy_data?: Record<string, unknown>; industry_code?: string; run_qa?: boolean;
}) {
  const { data } = await api.post("/agent/write-report", params)
  return data
}

// ── Email verification ─────────────────────────────────────────────────────────

export async function verifyEmail(token: string) {
  const { data } = await api.post("/auth/verify-email", { token })
  return data
}

export async function resendVerification() {
  const { data } = await api.post("/auth/resend-verification")
  return data
}
