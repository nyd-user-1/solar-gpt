'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sun, ArrowUp, Map, X, MapPin } from 'lucide-react'
import { SolarAddressDrawer } from '@/components/SolarAddressDrawer'
import { SolarPlusMenu } from '@/components/SolarPlusMenu'
import { MarkdownContent } from '@/components/MarkdownContent'
import type { SolarInsight } from '@/lib/solar-types'

/* ------------------------------------------------------------------ */
/*  Model definitions                                                  */
/* ------------------------------------------------------------------ */

type ModelProvider = 'openai' | 'anthropic' | 'google' | 'xai'
type ModelOption = { id: string; label: string; provider: ModelProvider }

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o',                          label: 'GPT-4o',           provider: 'openai'    },
  { id: 'gpt-4o-mini',                     label: 'GPT-4o Mini',      provider: 'openai'    },
  { id: 'gpt-4-turbo',                     label: 'GPT-4 Turbo',      provider: 'openai'    },
  { id: 'claude-sonnet-4-6',               label: 'Claude Sonnet',    provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001',       label: 'Claude Haiku',     provider: 'anthropic' },
  { id: 'google/gemini-2.5-flash',         label: 'Gemini 2.5 Flash', provider: 'google'    },
  { id: 'xai/grok-4.1-fast-non-reasoning', label: 'Grok Fast',        provider: 'xai'       },
]

const OPENAI_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>)
const ANTHROPIC_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 3.541H13.86L7.432 20.46h3.047l1.374-3.768h5.656l1.374 3.768h3.048L17.304 3.54zM12.79 13.695l1.941-5.31 1.94 5.31h-3.88zM6.696 3.541H3.25L9.678 20.46h3.047L6.696 3.54z"/></svg>)
const GEMINI_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="#4285F4"><path d="M12 1.5C12 1.5 8.5 8.5 1.5 12C8.5 15.5 12 22.5 12 22.5C12 22.5 15.5 15.5 22.5 12C15.5 8.5 12 1.5 12 1.5Z"/></svg>)
const GROK_ICON = (<svg className="h-4 w-4" viewBox="0 0 2000 1920" fill="currentColor"><path d="M1997.505,5.546c-1.276,1.84-2.543,3.686-3.831,5.517c-44.395,63.091-89.508,125.693-132.964,189.424c-35.057,51.414-65.323,105.683-89.053,163.428c-34.447,83.828-47.232,171.046-42.05,261.249c3.355,58.404,12.861,115.859,25.887,172.786c16.297,71.216,24.256,143.247,20.188,216.29c-10.123,181.765-76.927,339.812-201.209,472.789c-107.86,115.406-239.56,189.915-394.446,221.624c-157.969,32.34-310.586,13.132-457.667-52.146c-43.51-19.311-84.795-42.677-124.218-69.344c-1.094-.74-2.147-1.54-3.745-2.692c1.543-.883,2.689-1.656,3.927-2.231c72.526-33.658,145.071-67.276,217.555-101.023c3.285-1.53,5.91-1.054,8.984.124c74.663,28.608,151.849,42.899,231.896,39.624c123.328-5.045,232.105-47.967,325.71-128.201c99.013-84.869,160.993-191.673,184.036-320.194c18.823-104.981,7.281-207.124-32.8-305.964c-13.942-34.381-52.565-47.733-86.226-30.057c-4.108,2.157-7.994,4.818-11.734,7.582c-216.828,160.265-433.63,320.565-650.436,480.86c-1.834,1.356-3.69,2.684-5.536,4.025c-.344-.374-.689-.747-1.033-1.121C1184.605,820.085,1590.468,412.274,1996.331,4.463C1996.722,4.824,1997.114,5.185,1997.505,5.546z"/><path d="M635.931,1353.173C425.433,1541.452,215.15,1729.537,4.867,1917.623c-.275-.19-.551-.38-.826-.57c1.039-1.478,2.041-2.984,3.123-4.431c29.898-39.969,63.26-76.964,97.26-113.421c40.804-43.752,82.042-87.114,122.109-131.532c35.108-38.921,66.724-80.614,91.953-126.809c19.879-36.398,34.424-74.673,40.535-115.893c7.782-52.496,1.059-103.422-17.762-152.706c-13.437-35.185-26.864-70.312-36.291-106.847c-21.394-82.908-28.324-166.979-21.201-252.304c19.974-239.28,151.763-453.739,355.913-578.35c90.292-55.114,188.023-89.471,292.95-102.908c130.165-16.669,256.024-.09,377.981,48.558c52.942,21.118,102.709,47.566,149.092,80.552c1.22.868,2.42,1.767,3.601,2.688c.244.19.36.544.758,1.179c-1.649.801-3.241,1.608-4.86,2.357c-71.815,33.205-143.623,66.428-215.499,99.5c-2.256,1.038-5.598,1.456-7.816.587c-152.615-59.802-303.123-52.584-449.63,18.494c-142.377,69.074-234.294,183.195-283.161,332.63c-22.431,68.594-30.403,139.234-23.761,211.172c11.547,125.044,63.341,231.057,152.534,319.089c1.067,1.053,2.142,2.099,3.193,3.168C635.287,1352.055,635.421,1352.372,635.931,1353.173z"/></svg>)

function modelIcon(p: ModelProvider) {
  if (p === 'anthropic') return ANTHROPIC_ICON
  if (p === 'google') return GEMINI_ICON
  if (p === 'xai') return GROK_ICON
  return OPENAI_ICON
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StateChip = { name: string; slug: string; flag_url: string | null; untapped: string; grade: string }
type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Suggestion = { place_id: string; description: string }
type SelectedAddress = { description: string; lat: number; lng: number }

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewChatClient({ stateChips }: { stateChips: StateChip[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o')
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [modelMenuAbove, setModelMenuAbove] = useState(true)

  // Address + Solar
  const [addressMode, setAddressMode] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
  const [solarInsight, setSolarInsight] = useState<SolarInsight | null>(null)
  const [solarLoading, setSolarLoading] = useState(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)
  const modelBtnRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedModel = MODEL_OPTIONS.find(m => m.id === selectedModelId) ?? MODEL_OPTIONS[0]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelMenuOpen(false)
    }
    if (modelMenuOpen) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [modelMenuOpen])

  useEffect(() => {
    if (addressMode) setTimeout(() => addressInputRef.current?.focus(), 50)
  }, [addressMode])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(value)}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      } catch { setSuggestions([]) }
    }, 300)
  }, [])

  const selectAddress = useCallback(async (s: Suggestion) => {
    setAddressMode(false)
    setAddressInput('')
    setSuggestions([])
    setSolarInsight(null)
    setSolarError(null)
    try {
      const geoRes = await fetch(`/api/places/geocode?place_id=${s.place_id}`)
      const geo = await geoRes.json()
      if (!geo.lat || !geo.lng) throw new Error('Geocode failed')
      const addr: SelectedAddress = { description: s.description, lat: geo.lat, lng: geo.lng }
      setSelectedAddress(addr)
      setDrawerOpen(true)
      setSolarLoading(true)
      const solarRes = await fetch(`/api/solar?lat=${geo.lat}&lng=${geo.lng}`)
      const solarData = await solarRes.json()
      if (!solarRes.ok || solarData.error) {
        setSolarError(solarData.error ?? 'Solar API not available for this address')
      } else {
        setSolarInsight(solarData as SolarInsight)
      }
    } catch { setSolarError('Could not fetch solar data') }
    finally { setSolarLoading(false) }
  }, [])

  const clearAddress = useCallback(() => {
    setSelectedAddress(null); setSolarInsight(null); setSolarError(null); setDrawerOpen(false)
  }, [])

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading || streaming) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setSelectedStateName(null)
    setModelMenuOpen(false)
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.focus() }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        model: selectedModelId,
      }
      if (selectedAddress) {
        body.address = selectedAddress.description
        if (solarInsight) body.solarInsight = solarInsight
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.' }])
        setLoading(false); return
      }
      const assistantId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])
      setLoading(false); setStreaming(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      }
      if (selectedAddress) setDrawerOpen(true)
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Connection error. Please check your network and try again.' }])
    } finally { setLoading(false); setStreaming(false) }
  }

  const isEmpty = messages.length === 0

  /* ---- Address input box ---- */
  const addressInputBox = (
    <div className="relative">
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-10">
          {suggestions.map(s => (
            <button key={s.place_id} onClick={() => selectAddress(s)}
              className="flex w-full items-start gap-3 px-4 py-3 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors text-left border-b border-[var(--border)] last:border-0">
              <MapPin className="h-4 w-4 text-solar shrink-0 mt-0.5" />
              <span>{s.description}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 rounded-[28px] border-2 border-solar bg-[var(--surface)] px-4 py-3 shadow-sm">
        <MapPin className="h-4 w-4 text-solar shrink-0" />
        <input ref={addressInputRef} type="text" value={addressInput}
          onChange={e => { setAddressInput(e.target.value); fetchSuggestions(e.target.value) }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setAddressMode(false); setSuggestions([]) }
            if (e.key === 'Enter' && suggestions.length > 0) selectAddress(suggestions[0])
          }}
          placeholder="Enter your address…"
          className="flex-1 bg-transparent text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none" />
        <button onClick={() => { setAddressMode(false); setAddressInput(''); setSuggestions([]) }}
          className="text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
        AI-powered solar intelligence · Data from Google Sunroof &amp; NREL Cambium
      </p>
    </div>
  )

  /* ---- Main chat input ---- */
  const chatInputBox = (
    <div className="relative">
      <div className="flex flex-col rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-4 pt-3 pb-3 shadow-sm transition-shadow hover:shadow-md gap-1">

        {selectedAddress && (
          <div className="flex items-center gap-2 pb-2.5 mb-1 border-b border-[var(--border)]">
            <MapPin className="h-3.5 w-3.5 text-solar shrink-0" />
            <span className="text-xs text-solar truncate flex-1 font-medium">{selectedAddress.description}</span>
            <button onClick={clearAddress} className="text-[var(--muted)] hover:text-solar transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {selectedStateName ? (
          <div
            className="w-full py-1 text-[17px] leading-relaxed cursor-text"
            onClick={() => {
              setInput(`What is the solar energy potential in ${selectedStateName}?`)
              setSelectedStateName(null)
              setTimeout(() => textareaRef.current?.focus(), 0)
            }}
          >
            <span className="text-[var(--txt)]">What is the solar energy potential in </span>
            <span className="text-solar font-semibold">{selectedStateName}</span>
            <span className="text-[var(--txt)]">?</span>
          </div>
        ) : (
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) }
              if (e.key === 'Escape') { setModelMenuOpen(false) }
            }}
            placeholder={selectedAddress ? 'Ask about this property…' : 'Ask about solar potential…'}
            className="w-full resize-none bg-transparent py-1 text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none leading-relaxed"
            style={{ minHeight: '40px' }} />
        )}

        <div className="flex items-center pt-1">
          {/* Left: + then MapPin */}
          <SolarPlusMenu
            stateChips={stateChips}
            onSelect={(text) => { setInput(text); textareaRef.current?.focus() }}
          />
          <button onClick={() => { setAddressMode(true) }}
            className={`ml-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${selectedAddress ? 'text-solar bg-solar/10' : 'text-[var(--muted)] hover:text-[var(--txt)]'}`}
            title="Look up an address">
            <MapPin className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          {/* Right: model selector + send */}
          <div className="relative shrink-0" ref={modelRef}>
            <button ref={modelBtnRef} type="button"
              onClick={() => {
                if (!modelMenuOpen && modelBtnRef.current) {
                  const rect = modelBtnRef.current.getBoundingClientRect()
                  setModelMenuAbove(rect.top > 300)
                }
                setModelMenuOpen(v => !v)
              }}
              className="inline-flex items-center text-[var(--muted)] hover:text-[var(--txt)] transition-colors rounded-lg p-1.5"
              aria-label={`Model: ${selectedModel.label}`}>
              {modelIcon(selectedModel.provider)}
            </button>
            {modelMenuOpen && (
              <div className={`absolute right-0 w-[200px] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden py-1 z-20 ${modelMenuAbove ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                {MODEL_OPTIONS.map(m => (
                  <button key={m.id} onClick={() => { setSelectedModelId(m.id); setModelMenuOpen(false) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--inp-bg)] transition-colors">
                    <span className="shrink-0 text-[var(--muted)]">{modelIcon(m.provider)}</span>
                    <span className="flex-1 text-left font-medium text-[var(--txt)]">{m.label}</span>
                    {m.id === selectedModelId && (
                      <svg className="h-4 w-4 shrink-0 text-[var(--txt)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button"
            onClick={() => submit(selectedStateName ? `What is the solar energy potential in ${selectedStateName}?` : input)}
            disabled={(!input.trim() && !selectedStateName) || loading || streaming}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] disabled:opacity-25 hover:opacity-80 transition-opacity">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
        AI-powered solar intelligence · Data from Google Sunroof &amp; NREL Cambium
      </p>
    </div>
  )

  const inputBox = addressMode ? addressInputBox : chatInputBox

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
              <div className="w-full max-w-[773px] flex flex-col gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <Sun className="h-7 w-7 text-solar" />
                    <h1 className="text-3xl font-bold text-[var(--txt)]">SolarGPT</h1>
                  </div>
                </div>
                {inputBox}
                <div className="max-w-[744px] mx-auto w-full">
                  <p className="text-base font-semibold text-[var(--txt)] mb-6">Explore</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    {stateChips.map(s => (
                      <button key={s.slug} type="button"
                        onClick={() => { setSelectedStateName(s.name); setInput('') }}
                        className="group shrink-0 w-[176px] h-[97px] rounded-2xl overflow-hidden relative hover:opacity-90 transition-opacity snap-start">
                        {s.flag_url
                          ? <img src={`${s.flag_url}?width=400`} alt={s.name} className="absolute inset-0 w-full h-full object-cover" />
                          : <div className="absolute inset-0 bg-solar/10 flex items-center justify-center"><Map className="h-8 w-8 text-solar" /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <p className="text-sm font-bold text-white">{s.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4 py-6 max-w-[773px] mx-auto w-full">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar mt-0.5">
                      <Sun className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed bg-[var(--txt)] text-[var(--bg)]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 text-[17px] pt-0.5">
                      {msg.content ? (
                        <MarkdownContent content={msg.content} />
                      ) : (
                        <div className="flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
                        </div>
                      )}
                    </div>
                  )}
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

        {!isEmpty && (
          <div className="shrink-0 px-4 pb-4 pt-2">
            <div className="mx-auto max-w-[773px]">{inputBox}</div>
          </div>
        )}
      </div>

      <SolarAddressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        address={selectedAddress?.description ?? ''}
        insight={solarInsight}
        loading={solarLoading}
        error={solarError}
      />
    </>
  )
}
