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

// ── Email verification ─────────────────────────────────────────────────────────

export async function verifyEmail(token: string) {
  const { data } = await api.post("/auth/verify-email", { token })
  return data
}

export async function resendVerification() {
  const { data } = await api.post("/auth/resend-verification")
  return data
}
