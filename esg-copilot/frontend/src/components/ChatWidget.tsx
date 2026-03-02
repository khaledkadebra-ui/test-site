"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Minimize2, Bot, User } from "lucide-react"
import { agentChat, type ChatMessage } from "@/lib/api"

interface Props {
  context?: Record<string, unknown>
}

const STARTERS = [
  "Hvad er Scope 3 emissioner?",
  "Hvornår skal vi overholde CSRD?",
  "Hvordan beregner vi vores CO₂-baseline?",
  "Hvad mangler vi for en god ESG-score?",
]

export default function ChatWidget({ context = {} }: Props) {
  const [open, setOpen]     = useState(false)
  const [minimised, setMin] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hej! Jeg er din ESG Coach 🌱 Jeg kan hjælpe dig med VSME-rapportering, CO₂-beregning, ESG-strategi og meget mere. Hvad kan jeg hjælpe dig med i dag?",
    },
  ])
  const [input, setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
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
      // Send history excluding the initial greeting
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
            width: "380px",
            height: minimised ? "60px" : "540px",
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0 cursor-pointer"
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
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: m.role === "assistant" ? "#d1fae5" : "#e0f2fe" }}
                    >
                      {m.role === "assistant"
                        ? <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        : <User className="w-3 h-3 text-blue-700" />}
                    </div>
                    <div
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                      style={{
                        background: m.role === "assistant" ? "#fff" : "#059669",
                        color:      m.role === "assistant" ? "#111827" : "#fff",
                        border:     m.role === "assistant" ? "1px solid #e5e7eb" : "none",
                        borderBottomLeftRadius:  m.role === "assistant" ? "4px" : undefined,
                        borderBottomRightRadius: m.role === "user" ? "4px" : undefined,
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-100">
                      <Bot className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl px-3 py-2 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick starters — show only at start */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
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
