'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Bell, CheckCircle, X, ArrowUp, Sun, Plus, MapPin } from 'lucide-react'
import { MarkdownContent } from '@/components/MarkdownContent'
import type { SolarInsight } from '@/lib/solar-types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#e8751c'
const ACCENT_HOVER = '#d4681a'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  address: string
  placeId: string
  lat: number | null
  lng: number | null
  homeownership: string
  monthlyBill: string
  roofAge: string
  roofShade: string
  goal: string
  timeline: string
  creditScore: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface PlaceSuggestion {
  place_id: string
  description: string
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const QUESTION_STEPS = [
  'address', 'homeownership', 'monthlyBill', 'roofAge',
  'roofShade', 'goal', 'timeline', 'creditScore', 'contact',
] as const

type QuestionStep = typeof QUESTION_STEPS[number]
type Step = QuestionStep | 'loading' | 'result'

function defaultFormData(): FormData {
  return {
    address: '', placeId: '', lat: null, lng: null,
    homeownership: '', monthlyBill: '', roofAge: '', roofShade: '',
    goal: '', timeline: '', creditScore: '',
    firstName: '', lastName: '', email: '', phone: '',
  }
}

// ─── Estimate ────────────────────────────────────────────────────────────────

const BILL_MAP: Record<string, number> = {
  'Under $75': 55,
  '$75-$125': 100,
  '$125-$200': 160,
  '$200-$300': 250,
  '$300+': 320,
}

function calcEstimate(insight: SolarInsight | null, monthlyBill: string) {
  const kw = insight?.recommendedKw ?? 8.0
  const gross = Math.round((kw * 3100) / 100) * 100
  const itc = Math.round(gross * 0.30)
  const net = gross - itc
  const billAmt = BILL_MAP[monthlyBill] ?? 150
  const monthlySavings = Math.round(billAmt * 0.87)
  const payback = insight?.paybackYears ?? Math.round((net / (monthlySavings * 12)) * 10) / 10
  const savings20yr = insight?.savings20yr ?? monthlySavings * 12 * 20
  return { kw, gross, itc, net, monthlySavings, payback, savings20yr }
}

type Estimate = ReturnType<typeof calcEstimate>

// ─── Progress label ───────────────────────────────────────────────────────────

function progressLabel(pct: number) {
  if (pct < 20) return 'Getting started'
  if (pct < 50) return 'Making progress'
  if (pct < 80) return 'Halfway there'
  if (pct < 100) return 'Almost done'
  return 'Just a few more details'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ stepIdx, total }: { stepIdx: number; total: number }) {
  const pct = Math.round(((stepIdx + 1) / total) * 100)
  return (
    <div className="w-full">
      <div className="h-4 w-full rounded-full bg-gray-200">
        <div
          className="h-4 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
      </div>
      <p className="mt-2 text-center text-sm font-semibold" style={{ color: ACCENT }}>
        {pct}% · {progressLabel(pct)}
      </p>
    </div>
  )
}

function CardOption({ label, sub, selected, onClick }: {
  label: string; sub?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full cursor-pointer rounded-xl border-2 px-6 py-4 text-center text-lg font-medium transition-all ' +
        (selected
          ? 'border-[#e8751c] bg-[#e8751c] text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-[#e8751c]')
      }
    >
      {label}
      {sub && (
        <span className={`block text-sm font-normal ${selected ? 'text-orange-100' : 'text-[#e8751c]'}`}>
          {sub}
        </span>
      )}
    </button>
  )
}

function OrangeButton({ children, onClick, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 w-full cursor-pointer rounded-xl px-8 py-4 text-lg font-semibold text-white transition-colors disabled:opacity-50"
      style={{ backgroundColor: disabled ? '#ccc' : ACCENT }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = ACCENT_HOVER }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = ACCENT }}
    >
      {children}
    </button>
  )
}

function FormFooter() {
  return (
    <div className="bg-white px-4 py-10 text-center shrink-0">
      <p className="text-sm text-gray-500 mb-2">
        Free estimate · No obligation · Powered by Google Solar API
      </p>
      <p className="text-xs text-gray-400">Data from NREL Sunroof Project · Estimates are illustrative</p>
    </div>
  )
}

// ─── Quote Assistant Drawer ───────────────────────────────────────────────────

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

function QuoteAssistantContent({
  open, onClose, formData, insight, estimate,
}: {
  open: boolean
  onClose: () => void
  formData: FormData
  insight: SolarInsight | null
  estimate: Estimate
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [injected, setInjected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && !injected) {
      setInjected(true)
      const openingMsg = [
        `How did you arrive at this solar estimate of $${estimate.net.toLocaleString()} for my home at ${formData.address}?`,
        `For context: my roof is ${formData.roofAge} old with ${formData.roofShade.toLowerCase()} shade,`,
        `my monthly electric bill is ${formData.monthlyBill}, and my main goal is to ${formData.goal.toLowerCase()}.`,
        `What factors most influence this quote?`,
      ].join(' ')
      sendMsg(openingMsg)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMsg(text: string) {
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          address: formData.address,
          solarInsight: insight,
        }),
      })

      if (!res.ok || !res.body) throw new Error('failed')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
        )
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, I had trouble generating a response. Please try again.' }
            : m
        )
      )
    }

    setLoading(false)
  }

  function handleSubmit() {
    const t = input.trim()
    if (!t || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMsg(t)
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        open ? 'w-full sm:w-[418px] sm:ml-[18px]' : 'w-0'
      }`}
    >
      {open && <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={onClose} />}

      <div className="relative h-full w-full sm:w-[418px] bg-white sm:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar">
            <Sun className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-base font-semibold text-gray-900">Quote Assistant</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5">
                  <p className="text-sm text-gray-700">{msg.content}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {msg.content ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    loading && i === messages.length - 1 && (
                      <div className="flex items-center gap-2 py-2">
                        <Sun className="h-4 w-4 text-solar animate-pulse" />
                        <span className="text-gray-400">Thinking…</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Gradient fade */}
        <div className="pointer-events-none relative h-8 -mt-8 shrink-0 bg-gradient-to-t from-white to-transparent" />

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
              }}
              placeholder="Ask about your estimate…"
              className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ backgroundColor: ACCENT }}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuoteAssistantDrawer(props: Parameters<typeof QuoteAssistantContent>[0]) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const root = document.getElementById('chat-panel-root')
  if (!root) return null
  return createPortal(<QuoteAssistantContent {...props} />, root)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FreeQuotePage() {
  const [step, setStep] = useState<Step>('address')
  const [stepIdx, setStepIdx] = useState(0)
  const [formData, setFormData] = useState<FormData>(defaultFormData())
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [solarInsight, setSolarInsight] = useState<SolarInsight | null>(null)
  const [solarLoading, setSolarLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [smsConsent, setSmsConsent] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silent — location bias is best-effort
      )
    }
  }, [])

  const TOTAL = QUESTION_STEPS.length

  function update<K extends keyof FormData>(k: K, v: FormData[K]) {
    setFormData(prev => ({ ...prev, [k]: v }))
  }

  function goNext() {
    const nextIdx = stepIdx + 1
    setAnimating(true)
    setTimeout(() => {
      if (nextIdx < QUESTION_STEPS.length) {
        setStep(QUESTION_STEPS[nextIdx])
        setStepIdx(nextIdx)
      } else {
        setStep('loading')
        setTimeout(() => setStep('result'), 2200)
      }
      setAnimating(false)
    }, 150)
  }

  function goBack() {
    if (stepIdx === 0) return
    const prevIdx = stepIdx - 1
    setAnimating(true)
    setTimeout(() => {
      setStep(QUESTION_STEPS[prevIdx])
      setStepIdx(prevIdx)
      setAnimating(false)
    }, 150)
  }

  const fetchSuggestions = useCallback((val: string, loc?: { lat: number; lng: number } | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        let url = `/api/places?input=${encodeURIComponent(val)}`
        if (loc) url += `&lat=${loc.lat}&lng=${loc.lng}`
        const res = await fetch(url)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      } catch { setSuggestions([]) }
    }, 300)
  }, [])

  const selectAddress = useCallback(async (s: PlaceSuggestion) => {
    setFormData(prev => ({ ...prev, address: s.description, placeId: s.place_id }))
    setSuggestions([])
    try {
      const geoRes = await fetch(`/api/places/geocode?place_id=${s.place_id}`)
      const geo = await geoRes.json()
      if (geo.lat && geo.lng) {
        setFormData(prev => ({ ...prev, lat: geo.lat, lng: geo.lng }))
        setSolarLoading(true)
        const solarRes = await fetch(`/api/solar?lat=${geo.lat}&lng=${geo.lng}`)
        const solarData = await solarRes.json()
        if (!solarData.error) setSolarInsight(solarData as SolarInsight)
      }
    } catch { /* non-blocking */ } finally { setSolarLoading(false) }
  }, [])

  const estimate = calcEstimate(solarInsight, formData.monthlyBill)

  const canContinue: Partial<Record<QuestionStep, boolean>> = {
    address: !!formData.address && !solarLoading,
    homeownership: !!formData.homeownership,
    monthlyBill: !!formData.monthlyBill,
    roofAge: !!formData.roofAge,
    roofShade: !!formData.roofShade,
    goal: !!formData.goal,
    timeline: !!formData.timeline,
    creditScore: !!formData.creditScore,
    contact: !!(formData.firstName && formData.lastName && formData.email && formData.phone),
  }

  // ─── Loading screen ─────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Sun className="h-12 w-12 text-solar" style={{ animation: 'spin 2s linear infinite' }} />
          <p className="text-xl font-semibold text-gray-800">Calculating your solar estimate…</p>
          <p className="text-sm text-gray-500 max-w-xs">Analyzing roof potential, local incentives, and energy savings</p>
        </div>
      </div>
    )
  }

  // ─── Result screen ──────────────────────────────────────────────────────────

  if (step === 'result') {
    const appliedIncentives = [
      { name: 'Federal Solar Tax Credit (ITC)', savings: '30% off' },
      { name: 'Net metering credit', savings: 'Ongoing savings' },
      { name: 'State solar incentive', savings: 'Varies by state' },
    ]
    const potentialIncentives = [
      { name: 'PACE / $0-down financing', savings: 'Available' },
      { name: 'Property tax exemption', savings: 'Up to 100%' },
      { name: 'Sales tax exemption', savings: 'Varies' },
    ]
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 pb-10 pt-4">
            <div className="mx-auto max-w-lg">
              <h1 className="text-2xl font-bold text-gray-900">Here's your solar estimate</h1>
              <p className="mt-1 text-sm text-gray-400">
                {formData.address} · Estimate · {date}
              </p>

              {/* Quote card */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-5 w-5 text-solar fill-solar/30 shrink-0" />
                      <span className="text-base font-semibold text-gray-900">Your Estimate is Ready</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {estimate.kw} kW system · {formData.address.split(',')[0]} · Cash estimate
                    </p>
                    <p className="mt-4 text-4xl font-bold text-gray-900">
                      ${estimate.net.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">after 30% federal tax credit</p>
                    <p className="mt-1 text-sm font-medium text-green-600">
                      ~${estimate.monthlySavings}/mo estimated savings
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssistantOpen(true)}
                    className="relative rounded-xl bg-orange-50 px-3 py-2 border border-transparent hover:border-[#e8751c] transition-colors shrink-0"
                    style={{ color: ACCENT }}
                    title="Ask about your estimate"
                  >
                    <Bell className="h-4 w-4" />
                    <span
                      className="absolute -top-1 -right-1 size-2.5 animate-bounce rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                  </button>
                </div>

                {/* Applied incentives */}
                <div className="mt-5 space-y-1">
                  {appliedIncentives.map(d => (
                    <div
                      key={d.name}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-gray-800">{d.name}</span>
                      </div>
                      <span className="font-medium text-green-600">{d.savings}</span>
                    </div>
                  ))}
                </div>

                {/* Potential incentives */}
                <div className="my-4 flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-gray-300">Potential Incentives</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
                <div className="space-y-1">
                  {potentialIncentives.map(d => (
                    <div key={d.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-gray-300 shrink-0" />
                        <span className="text-gray-400">{d.name}</span>
                      </div>
                      <span className="text-gray-400">{d.savings}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA card */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-400 text-center">
                  Ready to get competing installer quotes?
                </p>
                <button
                  className="mt-4 w-full rounded-xl py-3 text-base font-semibold text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ACCENT}
                >
                  Get a Free Consultation
                </button>
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-gray-300">or</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
                <p className="text-sm text-gray-400 text-center">Have questions? Talk to a solar advisor.</p>
                <a
                  href="tel:18005551234"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  (800) 555-1234
                </a>
                <p className="mt-3 text-center text-xs text-gray-400">
                  No obligation · Free estimate · Licensed installers
                </p>
              </div>

              {insight_summary(solarInsight)}

              <p className="mt-6 text-center text-xs text-gray-300">
                This is a sample estimate based on your property data and typical installation costs. Your actual quote will vary. Powered by SolarGPT.
              </p>
            </div>
          </div>
        </div>

        <QuoteAssistantDrawer
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          formData={formData}
          insight={solarInsight}
          estimate={estimate}
        />
      </div>
    )
  }

  // ─── Form steps ──────────────────────────────────────────────────────────────

  const currentStep = step as QuestionStep

  return (
    <div className={`flex flex-1 flex-col bg-white transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Progress + back */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="mx-auto max-w-3xl">
          {stepIdx > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="mb-3 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous Question
            </button>
          )}
          <ProgressBar stepIdx={stepIdx} total={TOTAL} />
        </div>
      </div>

      {/* Question area — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl">

            {/* ADDRESS */}
            {currentStep === 'address' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Your Solar Potential</h2>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 focus-within:border-[#e8751c] transition-colors">
                    <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => {
                        update('address', e.target.value)
                        update('placeId', '')
                        fetchSuggestions(e.target.value, userLocation)
                      }}
                      placeholder="Enter your home address"
                      className="flex-1 text-lg text-gray-700 outline-none bg-transparent"
                    />
                    {solarLoading && (
                      <Sun className="h-4 w-4 text-solar shrink-0" style={{ animation: 'spin 1.5s linear infinite' }} />
                    )}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl z-10 overflow-hidden">
                      {suggestions.map(s => (
                        <button
                          key={s.place_id}
                          type="button"
                          onClick={() => selectAddress(s)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <MapPin className="h-4 w-4 text-solar shrink-0 mt-0.5" />
                          {s.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  *Used to analyze your roof's solar potential via Google Solar API
                </p>
                <OrangeButton onClick={goNext} disabled={!formData.address || solarLoading}>
                  {solarLoading ? 'Fetching solar data…' : 'GET MY ESTIMATE →'}
                </OrangeButton>
              </div>
            )}

            {/* HOMEOWNERSHIP */}
            {currentStep === 'homeownership' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Do you own your home?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Own', 'Rent'].map(o => (
                    <CardOption
                      key={o}
                      label={o}
                      selected={formData.homeownership === o}
                      onClick={() => { update('homeownership', o); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.homeownership}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* MONTHLY BILL */}
            {currentStep === 'monthlyBill' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's your average monthly electric bill?
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.keys(BILL_MAP).map(o => (
                    <CardOption
                      key={o}
                      label={o}
                      selected={formData.monthlyBill === o}
                      onClick={() => { update('monthlyBill', o); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.monthlyBill}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* ROOF AGE */}
            {currentStep === 'roofAge' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">How old is your roof?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Under 5 years', '5-10 years', '10-20 years', '20+ years'].map(o => (
                    <CardOption
                      key={o}
                      label={o}
                      selected={formData.roofAge === o}
                      onClick={() => { update('roofAge', o); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.roofAge}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* ROOF SHADE */}
            {currentStep === 'roofShade' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  How much shade does your roof get?
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: 'None', sub: 'Full sun all day' },
                    { val: 'Partial', sub: 'Some trees or nearby obstructions' },
                    { val: 'Mostly shaded', sub: 'Heavy shade for much of the day' },
                  ].map(({ val, sub }) => (
                    <CardOption
                      key={val}
                      label={val}
                      sub={sub}
                      selected={formData.roofShade === val}
                      onClick={() => { update('roofShade', val); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.roofShade}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* GOAL */}
            {currentStep === 'goal' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's your primary reason for going solar?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Lower my bill', 'Help the environment', 'Energy independence', 'Backup power'].map(o => (
                    <CardOption
                      key={o}
                      label={o}
                      selected={formData.goal === o}
                      onClick={() => { update('goal', o); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.goal}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* TIMELINE */}
            {currentStep === 'timeline' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  When are you looking to install solar?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {['ASAP', '3-6 months', '6-12 months', 'Just exploring'].map(o => (
                    <CardOption
                      key={o}
                      label={o}
                      selected={formData.timeline === o}
                      onClick={() => { update('timeline', o); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.timeline}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* CREDIT SCORE */}
            {currentStep === 'creditScore' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's your credit score range?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'Excellent (750+)', sub: 'Best financing rates' },
                    { val: 'Good (700-749)', sub: 'Great options available' },
                    { val: 'Fair (650-699)', sub: 'Some options available' },
                    { val: 'Below 650', sub: 'Lease options may apply' },
                  ].map(({ val, sub }) => (
                    <CardOption
                      key={val}
                      label={val}
                      sub={sub}
                      selected={formData.creditScore === val}
                      onClick={() => { update('creditScore', val); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.creditScore}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* CONTACT */}
            {currentStep === 'contact' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {formData.firstName ? `${formData.firstName}, great news!` : 'Great news!'} Your home is solar-ready.
                </h2>
                <p className="text-gray-500 mb-6">Enter your details to receive your free estimate.</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 outline-none focus:border-[#e8751c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 outline-none focus:border-[#e8751c]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => update('email', e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 outline-none focus:border-[#e8751c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="(555) 555-5555"
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 outline-none focus:border-[#e8751c]"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <input
                    id="sms-consent"
                    type="checkbox"
                    checked={smsConsent}
                    onChange={e => setSmsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4"
                    style={{ accentColor: ACCENT }}
                  />
                  <label htmlFor="sms-consent" className="text-xs text-gray-500 leading-relaxed">
                    By submitting this form, you agree to receive SMS messages from SolarGPT at the phone number provided. Message &amp; data rates may apply. Reply STOP to opt out and HELP for help.
                  </label>
                </div>

                <OrangeButton onClick={goNext} disabled={!canContinue.contact}>
                  Get My Solar Quote →
                </OrangeButton>

                <p className="mt-3 text-center text-xs text-gray-400">
                  By clicking &quot;Get My Solar Quote&quot;, I provide my express consent to be contacted by SolarGPT and its partners. Consent is not a condition of purchase.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <FormFooter />
    </div>
  )
}

// ─── Inline solar data summary (shown on result if we have real API data) ─────

function insight_summary(insight: SolarInsight | null) {
  if (!insight) return null
  const items = [
    insight.maxSunshineHoursPerYear && { label: 'Sunshine hours/year', value: insight.maxSunshineHoursPerYear.toLocaleString() },
    insight.maxAreaSqFt && { label: 'Usable roof area', value: `${insight.maxAreaSqFt.toLocaleString()} sq ft` },
    insight.maxPanelsCount && { label: 'Max panels', value: String(insight.maxPanelsCount) },
    insight.savings20yr && { label: '20-year savings', value: `$${insight.savings20yr.toLocaleString()}` },
    insight.paybackYears && { label: 'Payback period', value: `${insight.paybackYears} years` },
  ].filter(Boolean) as { label: string; value: string }[]

  if (!items.length) return null

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Google Solar API Data</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
