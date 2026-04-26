'use client'

import { useState, useRef, useEffect } from 'react'
import { Sun, Send, ArrowUp } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Which US state has the most untapped solar potential?',
  "What's the average payback period for residential solar?",
  'How does the Cambium GEA model affect solar pricing?',
  'Compare solar adoption rates across NY counties',
]

export default function NewChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    // Placeholder response — AI integration not yet wired
    await new Promise(r => setTimeout(r, 800))
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "I'm SolarGPT — AI analysis coming soon. In the meantime, explore the States, Counties, and GEA Regions pages for detailed solar potential data.",
    }
    setMessages(prev => [...prev, assistantMsg])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages / empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4 pb-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mb-5">
              <Sun className="h-8 w-8 text-solar" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--txt)] mb-2">SolarGPT</h1>
            <p className="text-[var(--muted)] text-sm max-w-xs mb-8">
              Ask anything about rooftop solar potential, installation costs, payback periods, or regional data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] hover:border-solar hover:bg-[var(--inp-bg)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4 max-w-2xl mx-auto w-full">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar mr-2 mt-0.5">
                    <Sun className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--txt)] text-[var(--bg)] rounded-br-sm'
                      : 'bg-[var(--inp-bg)] text-[var(--txt)] rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar mr-2 mt-0.5">
                  <Sun className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-[var(--inp-bg)] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 focus-within:border-solar transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about solar potential…"
              className="flex-1 resize-none bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-solar text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
            AI responses are illustrative · Data from Google Sunroof &amp; NREL Cambium
          </p>
        </div>
      </div>
    </div>
  )
}
