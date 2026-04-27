'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sun, ArrowUp, Map, Plus, X } from 'lucide-react'

type StateChip = {
  name: string
  slug: string
  flag_url: string | null
  untapped: string
  grade: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Which US state has the most untapped solar potential?',
  "What's the average payback period for residential solar?",
  'How does the NREL Cambium GEA model affect solar pricing?',
  'Compare solar adoption rates across the top 5 counties',
]

export default function NewChatClient({ stateChips }: { stateChips: StateChip[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)
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
    if (!trimmed || loading || streaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setPlusOpen(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        }])
        setLoading(false)
        return
      }

      const assistantId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])
      setLoading(false)
      setStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
        )
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Connection error. Please check your network and try again.',
      }])
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const isEmpty = messages.length === 0

  const inputBox = (
    <div className="relative">
      {/* Suggestions menu */}
      {plusOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-10">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); setPlusOpen(false); textareaRef.current?.focus() }}
              className="flex w-full items-start px-4 py-3 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors text-left border-b border-[var(--border)] last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm focus-within:border-[var(--border2,#ccc)] transition-colors">
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={e => { setInput(e.target.value); autoResize() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) }
            if (e.key === 'Escape') setPlusOpen(false)
          }}
          placeholder="Ask about solar potential..."
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
          style={{ minHeight: '60px', maxHeight: '160px' }}
        />
        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            onClick={() => setPlusOpen(v => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              plusOpen
                ? 'border-[var(--txt)] bg-[var(--inp-bg)] text-[var(--txt)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)]'
            }`}
          >
            {plusOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          <div className="flex-1" />
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <Sun className="h-3.5 w-3.5 text-solar" />
          </div>
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || loading || streaming}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] disabled:opacity-25 hover:opacity-80 transition-opacity"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
        AI-powered solar intelligence · Data from Google Sunroof &amp; NREL Cambium
      </p>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state — QuoteTorch layout */
          <div className="flex flex-col items-center px-4 py-12 min-h-full">
            <div className="w-full max-w-2xl flex flex-col gap-8">
              {/* Logo */}
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold text-[var(--txt)]">SolarGPT</h1>
              </div>

              {/* Input */}
              {inputBox}

              {/* Explore */}
              <div>
                <p className="text-base font-semibold text-[var(--txt)] mb-3">Explore</p>
                <div className="-mx-4 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 px-4 pb-2">
                    {stateChips.map(s => (
                      <Link
                        key={s.slug}
                        href={`/states/${s.slug}`}
                        className="group shrink-0 w-40 sm:w-52 aspect-[4/3] rounded-xl overflow-hidden relative hover:opacity-90 transition-opacity"
                      >
                        {s.flag_url ? (
                          <img
                            src={`${s.flag_url}?width=400`}
                            alt={s.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-solar/10 flex items-center justify-center">
                            <Map className="h-8 w-8 text-solar" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <p className="text-sm font-bold text-white">{s.name}</p>
                          <p className="text-[11px] text-white/70">{s.untapped}/yr</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active chat */
          <div className="flex flex-col gap-4 px-4 py-6 max-w-2xl mx-auto w-full">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar mt-0.5">
                    <Sun className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[var(--txt)] text-[var(--bg)] rounded-br-sm'
                    : 'bg-[var(--inp-bg)] text-[var(--txt)] rounded-bl-sm'
                }`}>
                  {msg.content || (
                    <div className="flex gap-1 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar">
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

      {/* Bottom input (active state only) */}
      {!isEmpty && (
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="mx-auto max-w-2xl">
            {inputBox}
          </div>
        </div>
      )}
    </div>
  )
}
