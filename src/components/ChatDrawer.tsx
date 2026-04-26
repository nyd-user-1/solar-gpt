'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Sun, ArrowUp } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  context?: string
}

function DrawerContent({ open, onClose, title = 'SolarGPT', context }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setMessages([])
  }, [open, context])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'AI integration coming soon. Explore the data pages for solar potential insights.',
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

  return (
    <div
      className={`fixed inset-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        open ? 'w-full sm:w-[380px] sm:ml-[18px]' : 'w-0'
      }`}
    >
      {/* Mobile backdrop */}
      {open && (
        <div
          className="absolute inset-0 bg-black/40 sm:hidden"
          onClick={onClose}
        />
      )}

      <div className="relative h-full w-full sm:w-[380px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar">
            <Sun className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-sm font-semibold text-[var(--txt)]">{title}</span>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Context chip */}
        {context && (
          <div className="px-4 pt-3 shrink-0">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-[var(--muted)]">
              Context: <span className="font-medium text-[var(--txt)]">{context}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                <Sun className="h-6 w-6 text-solar" />
              </div>
              <p className="text-sm text-[var(--muted)] max-w-[220px]">
                Ask anything about solar potential for this region.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solar mr-2 mt-0.5">
                      <Sun className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
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
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solar mr-2 mt-0.5">
                    <Sun className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-[var(--inp-bg)] rounded-2xl rounded-bl-sm px-3 py-2.5">
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

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-[var(--border)]">
          <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3 py-2.5 focus-within:border-solar transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this region…"
              className="flex-1 resize-none bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
              style={{ minHeight: '20px' }}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChatDrawer(props: ChatDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const root = document.getElementById('chat-panel-root')
  if (!root) return null

  return createPortal(<DrawerContent {...props} />, root)
}
