"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Minimize2, Bot, User } from "lucide-react"
import { agentChat, type ChatMessage } from "@/lib/api"

interface Props {
  context?: Record<string, unknown>
}

const STARTERS = [
  "Hvordan bruger jeg guiden/wizarden?",
  "Hvad betyder vores ESG-score?",
  "Hvad er Scope 1, 2 og 3?",
  "Hvad mangler vi for en bedre score?",
]

// ── Markdown renderer ──────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

function MarkdownMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const textColor = isUser ? "#fff" : "#111827"
  const headingColor = isUser ? "#d1fae5" : "#065f46"
  const dividerColor = isUser ? "rgba(255,255,255,0.25)" : "#e5e7eb"
  const bulletColor  = isUser ? "rgba(255,255,255,0.7)" : "#6b7280"

  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let bulletBuffer: { text: string; num?: number }[] = []
  let key = 0

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    elements.push(
      <ul key={key++} style={{ margin: "4px 0 4px 0", paddingLeft: 0, listStyle: "none" }}>
        {bulletBuffer.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 6, marginBottom: 3, color: textColor, fontSize: 13, lineHeight: 1.5 }}>
            <span style={{ color: bulletColor, flexShrink: 0, marginTop: 1 }}>
              {b.num != null ? `${b.num}.` : "•"}
            </span>
            <span>{renderInline(b.text)}</span>
          </li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      flushBullets()
      elements.push(
        <hr key={key++} style={{ border: "none", borderTop: `1px solid ${dividerColor}`, margin: "8px 0" }} />
      )
      continue
    }

    // Empty line → paragraph break
    if (trimmed === "") {
      flushBullets()
      continue
    }

    // Headings
    const h3 = trimmed.match(/^###\s+(.+)/)
    const h2 = trimmed.match(/^##\s+(.+)/)
    const h1 = trimmed.match(/^#\s+(.+)/)
    if (h3 || h2 || h1) {
      flushBullets()
      const txt = (h3 || h2 || h1)![1]
      const size = h1 ? 15 : h2 ? 14 : 13
      elements.push(
        <div key={key++} style={{ fontWeight: 700, fontSize: size, color: headingColor, marginTop: 8, marginBottom: 2 }}>
          {renderInline(txt)}
        </div>
      )
      continue
    }

    // Bullet — unordered
    const bullet = trimmed.match(/^[-*•]\s+(.+)/)
    if (bullet) {
      bulletBuffer.push({ text: bullet[1] })
      continue
    }

    // Bullet — ordered
    const numbered = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numbered) {
      bulletBuffer.push({ text: numbered[2], num: parseInt(numbered[1]) })
      continue
    }

    // Emoji bullet (🌱 ✅ 💡 etc.)
    const emojiBullet = trimmed.match(/^([\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF])\s+(.+)/u)
    if (emojiBullet) {
      flushBullets()
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 6, marginBottom: 3, fontSize: 13, lineHeight: 1.5, color: textColor }}>
          <span style={{ flexShrink: 0 }}>{emojiBullet[1]}</span>
          <span>{renderInline(emojiBullet[2])}</span>
        </div>
      )
      continue
    }

    // Regular paragraph
    flushBullets()
    elements.push(
      <p key={key++} style={{ margin: "3px 0", fontSize: 13, lineHeight: 1.55, color: textColor }}>
        {renderInline(trimmed)}
      </p>
    )
  }

  flushBullets()
  return <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{elements}</div>
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ChatWidget({ context = {} }: Props) {
  const [open, setOpen]         = useState(false)
  const [minimised, setMin]     = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hej! Jeg er din ESG Coach 🌱\n\nJeg kender ESG Copilot systemet indeni og udvendigt, og jeg kan hjælpe dig med:\n\n- **Navigere systemet** — guiden, rapporten, CO₂-siden\n- **Forstå din ESG-score** og hvad du kan forbedre\n- **VSME-rapportering** og hvad det kræver\n- **CO₂-beregning** og emissionsfaktorer\n\nHvad kan jeg hjælpe dig med i dag?",
    },
  ])
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open, minimised])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")
    setError("")

    const userMsg: ChatMessage = { role: "user", content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }))
      const res = await agentChat(msg, history, context)
      setMessages(prev => [...prev, { role: "assistant", content: res.response }])
    } catch {
      setError("Beklager — kunne ikke nå serveren. Prøv igen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
          aria-label="Åbn ESG Coach"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all"
          style={{
            width: "390px",
            height: minimised ? "60px" : "560px",
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0 cursor-pointer select-none"
            style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 100%)" }}
            onClick={() => setMin(!minimised)}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm leading-tight">ESG Coach</div>
              <div className="text-emerald-200 text-xs">Online · Svarer på dansk</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); setMin(!minimised) }}
                className="text-white/70 hover:text-white p-1 rounded transition"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false) }}
                className="text-white/70 hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                      style={{ background: m.role === "assistant" ? "#d1fae5" : "#e0f2fe" }}
                    >
                      {m.role === "assistant"
                        ? <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        : <User className="w-3 h-3 text-blue-700" />}
                    </div>
                    <div
                      className="max-w-[82%] rounded-2xl px-3 py-2.5"
                      style={{
                        background: m.role === "assistant" ? "#fff" : "#059669",
                        border:     m.role === "assistant" ? "1px solid #e5e7eb" : "none",
                        borderBottomLeftRadius:  m.role === "assistant" ? "4px" : undefined,
                        borderBottomRightRadius: m.role === "user" ? "4px" : undefined,
                      }}
                    >
                      <MarkdownMessage content={m.content} isUser={m.role === "user"} />
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-100 mt-1">
                      <Bot className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl px-3 py-2.5 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500 text-center px-2">{error}</p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick starters */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50 border-t border-gray-100 pt-2">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-100 px-3 py-3 flex gap-2 bg-white">
                <input
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                  placeholder="Stil et spørgsmål..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                  style={{ background: "#059669" }}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
