'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, CheckCircle, X, ArrowUp, Sun, MapPin } from 'lucide-react'
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
  roofDirection: string
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
  'roofShade', 'roofDirection', 'goal', 'timeline', 'creditScore', 'contact',
] as const

type QuestionStep = typeof QUESTION_STEPS[number]
type Step = QuestionStep | 'loading' | 'result'

function defaultFormData(): FormData {
  return {
    address: '', placeId: '', lat: null, lng: null,
    homeownership: '', monthlyBill: '', roofAge: '', roofShade: '', roofDirection: '',
    goal: '', timeline: '', creditScore: '',
    firstName: '', lastName: '', email: '', phone: '',
  }
}

// ─── Estimate ────────────────────────────────────────────────────────────────

const BILL_MAP: Record<string, number> = {
  '$300+': 320,
  '$200-$300': 250,
  '$100-$200': 150,
  'Under $100': 75,
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

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// ─── Progress label ───────────────────────────────────────────────────────────

function stepProgress(stepIdx: number): number {
  if (stepIdx <= 2) return 25
  if (stepIdx <= 5) return 50
  if (stepIdx <= 8) return 75
  return 90
}

function progressLabel(pct: number) {
  if (pct <= 25) return 'Getting started'
  if (pct <= 50) return 'Halfway there'
  if (pct <= 75) return 'Almost done'
  return 'Just a few more details'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ stepIdx }: { stepIdx: number }) {
  const pct = stepProgress(stepIdx)
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

function CardOption({ label, sub, tooltip, selected, onClick }: {
  label: string; sub?: string; tooltip?: string; selected: boolean; onClick: () => void
}) {
  return (
    <div className="relative group">
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-black text-white text-xs rounded-lg px-3 py-1.5 text-center leading-snug whitespace-nowrap max-w-[180px] break-words">
            {tooltip}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
      )}
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
    </div>
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
          <span className="flex-1 text-base font-semibold text-gray-900">Solar Assistant</span>
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
  const router = useRouter()
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
  const suggestionsCache = useRef<Map<string, PlaceSuggestion[]>>(new Map())

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

  async function submitForm() {
    setStep('loading')
    try {
      const res = await fetch('/api/solar-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, solarInsight }),
      })
      const data = await res.json()
      if (data.token) {
        router.push(`/quote/${data.token}`)
        return
      }
    } catch { /* fall through to inline result */ }
    // API failed — show inline result as fallback
    setTimeout(() => setStep('result'), 500)
  }

  const fetchSuggestions = useCallback((val: string, loc?: { lat: number; lng: number } | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); return }

    // Show cached result instantly if available (stale-while-revalidate)
    const cached = suggestionsCache.current.get(val)
    if (cached) setSuggestions(cached)

    debounceRef.current = setTimeout(async () => {
      try {
        let url = `/api/places?input=${encodeURIComponent(val)}`
        if (loc) url += `&lat=${loc.lat}&lng=${loc.lng}`
        const res = await fetch(url)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          suggestionsCache.current.set(val, data)
          setSuggestions(data)
        }
      } catch { /* keep stale results showing */ }
    }, 150)
  }, [])

  const selectAddress = useCallback((s: PlaceSuggestion) => {
    setFormData(prev => ({ ...prev, address: s.description, placeId: s.place_id }))
    setSuggestions([])
    // Advance immediately — Solar API runs in background
    goNext()
    ;(async () => {
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
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx])

  const estimate = calcEstimate(solarInsight, formData.monthlyBill)

  const canContinue: Partial<Record<QuestionStep, boolean>> = {
    address: !!formData.address && !solarLoading,
    homeownership: !!formData.homeownership,
    monthlyBill: !!formData.monthlyBill,
    roofAge: !!formData.roofAge,
    roofShade: !!formData.roofShade,
    roofDirection: !!formData.roofDirection,
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
          <Sun className="h-12 w-12 text-solar animate-spin" />
          <p className="text-xl font-semibold text-gray-800">Calculating your solar estimate…</p>
          <p className="text-sm text-gray-500 max-w-xs">Analyzing roof potential, local incentives, and energy savings</p>
        </div>
      </div>
    )
  }

  // ─── Result screen ──────────────────────────────────────────────────────────

  if (step === 'result') {
    const appliedIncentives = [
      { name: 'Federal Solar Tax Credit (ITC)', savings: '30% off', anchor: 'federal-itc' },
      { name: 'Net metering credit', savings: 'Ongoing savings', anchor: 'net-metering' },
      { name: 'State solar incentive', savings: 'Varies by state', anchor: 'state-solar-incentive' },
    ]
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const basedOnItems = [
      solarInsight?.maxSunshineHoursPerYear != null && {
        label: 'Sunshine hours/year',
        value: solarInsight.maxSunshineHoursPerYear.toLocaleString(),
      },
      solarInsight?.maxAreaSqFt != null && {
        label: 'Usable roof area',
        value: `${solarInsight.maxAreaSqFt.toLocaleString()} sq ft`,
      },
      solarInsight?.maxPanelsCount != null && {
        label: 'Max panels',
        value: String(solarInsight.maxPanelsCount),
      },
    ].filter(Boolean) as { label: string; value: string }[]

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 pb-10 pt-4">
            <div className="mx-auto max-w-lg">
              <h1 className="text-2xl font-bold text-gray-900">Here's your solar estimate</h1>
              <p className="mt-1 text-sm text-gray-400">
                {formData.address}
              </p>

              {/* Quote card */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-4xl font-bold text-gray-900">
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
                    <Link
                      key={d.name}
                      href={`/glossary#${d.anchor}`}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-gray-800 group-hover:underline underline-offset-2">{d.name}</span>
                      </div>
                      <span className="font-medium text-green-600">{d.savings}</span>
                    </Link>
                  ))}
                </div>

                {/* Based on — solar API data */}
                {basedOnItems.length > 0 && (
                  <>
                    <div className="my-4 flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-xs text-gray-300">Based on</span>
                      <div className="flex-1 border-t border-gray-100" />
                    </div>
                    <div className="space-y-1">
                      {basedOnItems.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-300 shrink-0" />
                            <span className="text-gray-400">{label}</span>
                          </div>
                          <span className="text-gray-500 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
    <div className={`flex flex-1 flex-col bg-white animate-zoom-in transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Question area — scrollable + vertically centered */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-center px-4 py-6">
          <div className="mx-auto w-full max-w-3xl min-h-[400px]">

            {/* Previous Question — sits just above the question heading */}
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="mb-4 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Question
              </button>
            )}

            {/* ADDRESS */}
            {currentStep === 'address' && (
              <div>
                <p className="mb-4 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-400">
                  Use Google Solar to
                </p>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Generate a tailored solar energy report.</h2>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border-2 border-transparent bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.10)] focus-within:border-[#e8751c] focus-within:shadow-none transition-all">
                    <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => {
                        update('address', e.target.value)
                        update('placeId', '')
                        fetchSuggestions(e.target.value, userLocation)
                      }}
                      placeholder="Enter an address"
                      className="flex-1 text-lg text-gray-700 outline-none bg-transparent"
                    />
                    {solarLoading && (
                      <Sun className="h-4 w-4 text-solar shrink-0" style={{ animation: 'spin 1.5s linear infinite' }} />
                    )}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] z-10 overflow-hidden">
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
                  *Supported by data from NREL and Google Solar.
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
                <div className="h-[68px]" />
                <OrangeButton onClick={goNext} disabled={!formData.homeownership}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* MONTHLY BILL */}
            {currentStep === 'monthlyBill' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's your average monthly electric bill?
                </h2>
                <div className="grid grid-cols-2 gap-3">
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

            {/* ROOF SUN */}
            {currentStep === 'roofShade' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  How much sun does your roof get?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'Full Sun', tooltip: 'All day' },
                    { val: 'Mostly Sunny', tooltip: 'Minor obstructions' },
                    { val: 'Partial Sun', tooltip: 'Some shade' },
                    { val: 'Mostly Shaded', tooltip: 'Heavy shade' },
                  ].map(({ val, tooltip }) => (
                    <CardOption
                      key={val}
                      label={val}
                      tooltip={tooltip}
                      selected={formData.roofShade === val}
                      onClick={() => { update('roofShade', val); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.roofShade}>CONTINUE →</OrangeButton>
              </div>
            )}

            {/* ROOF DIRECTION */}
            {currentStep === 'roofDirection' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Which direction does your roof face?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'South', tooltip: 'Optimal' },
                    { val: 'West', tooltip: 'Great' },
                    { val: 'East', tooltip: 'Great' },
                    { val: 'North', tooltip: 'Lower' },
                  ].map(({ val, tooltip }) => (
                    <CardOption
                      key={val}
                      label={val}
                      tooltip={tooltip}
                      selected={formData.roofDirection === val}
                      onClick={() => { update('roofDirection', val); setTimeout(goNext, 120) }}
                    />
                  ))}
                </div>
                <OrangeButton onClick={goNext} disabled={!formData.roofDirection}>CONTINUE →</OrangeButton>
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
                    { val: 'Excellent (750+)', tooltip: 'Best financing rates' },
                    { val: 'Good (700-749)', tooltip: 'Great options available' },
                    { val: 'Fair (650-699)', tooltip: 'Some options available' },
                    { val: 'Below 650', tooltip: 'Lease options may apply' },
                  ].map(({ val, tooltip }) => (
                    <CardOption
                      key={val}
                      label={val}
                      tooltip={tooltip}
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {formData.firstName ? `${formData.firstName}, great news!` : 'Great news!'} Your home is solar-ready.
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => update('firstName', e.target.value)}
                    placeholder="Peter"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#e8751c]"
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => update('lastName', e.target.value)}
                    placeholder="Parker"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#e8751c]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="peter@mail.com"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#e8751c]"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => update('phone', formatPhone(e.target.value))}
                    placeholder="(555) 555-5555"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-lg text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#e8751c]"
                  />
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

                <OrangeButton onClick={submitForm} disabled={!canContinue.contact}>
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

      {/* Bottom bar: progress only */}
      <div className="shrink-0 px-4 pt-2 pb-4">
        <div className="mx-auto max-w-3xl">
          <ProgressBar stepIdx={stepIdx} />
        </div>
      </div>

    </div>
  )
}

