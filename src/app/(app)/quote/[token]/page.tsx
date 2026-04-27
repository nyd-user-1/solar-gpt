'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCircle, MapPin, X, ArrowUp, Sun, Plus } from 'lucide-react'
import { MarkdownContent } from '@/components/MarkdownContent'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuoteData {
  token: string
  first_name: string
  last_name: string
  email: string
  address: string
  lat: number | null
  lng: number | null
  homeownership: string
  monthly_bill: string
  roof_age: string
  roof_shade: string
  roof_direction: string
  goal: string
  timeline: string
  credit_score: string
  system_kw: number
  gross_cost: number
  itc_amount: number
  net_cost: number
  monthly_savings: number
  payback_years: number
  savings_20yr: number
  sunshine_hours: number | null
  roof_area_sqft: number | null
  max_panels: number | null
  created_at: string
}

const ACCENT = '#e8751c'
const ACCENT_HOVER = '#d4681a'

// ─── Solar Assistant Drawer ───────────────────────────────────────────────────

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

function SolarAssistantContent({ open, onClose, quote }: {
  open: boolean
  onClose: () => void
  quote: QuoteData
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
      const q = [
        `How did you arrive at this solar estimate of $${Number(quote.net_cost).toLocaleString()} for my home at ${quote.address}?`,
        `For context: my roof is ${quote.roof_age} old, faces ${quote.roof_direction}, and gets ${quote.roof_shade.toLowerCase()} sun.`,
        `My monthly bill is ${quote.monthly_bill} and my main goal is to ${quote.goal.toLowerCase()}.`,
        `What factors most influence this quote?`,
      ].join(' ')
      sendMsg(q)
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
      const solarInsight = quote.sunshine_hours || quote.roof_area_sqft || quote.max_panels ? {
        maxSunshineHoursPerYear: quote.sunshine_hours,
        maxAreaSqFt: quote.roof_area_sqft,
        maxPanelsCount: quote.max_panels,
        recommendedKw: quote.system_kw,
        savings20yr: quote.savings_20yr,
        paybackYears: quote.payback_years,
      } : null

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          address: quote.address,
          solarInsight,
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
        prev.map(m => m.id === assistantId
          ? { ...m, content: 'Sorry, I had trouble generating a response. Please try again.' }
          : m)
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
    <div className={`fixed inset-y-0 right-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
      open ? 'w-full sm:w-[418px] sm:ml-[18px]' : 'w-0'
    }`}>
      {open && <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={onClose} />}
      <div className="relative h-full w-full sm:w-[418px] bg-white sm:rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 shrink-0">
          <span className="flex-1 text-base font-semibold text-gray-900">Solar Assistant</span>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

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
                  ) : loading && i === messages.length - 1 ? (
                    <div className="flex items-center gap-2 py-2">
                      <Sun className="h-4 w-4 text-solar animate-pulse" />
                      <span className="text-gray-400">Thinking…</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="pointer-events-none relative h-8 -mt-8 shrink-0 bg-gradient-to-t from-white to-transparent" />

        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <textarea ref={textareaRef} rows={1} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Ask about your estimate…"
              className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '120px' }} />
            <button onClick={handleSubmit} disabled={!input.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: ACCENT }}>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SolarAssistantDrawer(props: Parameters<typeof SolarAssistantContent>[0]) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const root = document.getElementById('chat-panel-root')
  if (!root) return null
  return createPortal(<SolarAssistantContent {...props} />, root)
}

// ─── Streaming intro ──────────────────────────────────────────────────────────

function StreamingIntro({ quote }: { quote: QuoteData }) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/solar-quotes/${quote.token}/intro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote),
        })
        if (!res.ok || !res.body) return
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { done: d, value } = await reader.read()
          if (d) break
          setText(prev => prev + dec.decode(value, { stream: true }))
        }
      } catch { /* silent */ } finally { setDone(true) }
    })()
  }, [quote])

  return (
    <div className="mb-8">
      {text ? (
        <div className="text-[17px] text-gray-800 leading-relaxed">
          <MarkdownContent content={text} />
        </div>
      ) : (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i === 2 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      )}
      {!done && text && (
        <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  )
}

// ─── Satellite map ────────────────────────────────────────────────────────────

function SatelliteMap({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=800x400&maptype=satellite&key=${key}`

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-6 bg-gray-100" style={{ aspectRatio: '2/1' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Satellite view of ${address}`} className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1">
        <MapPin className="h-3.5 w-3.5 text-white shrink-0" />
        <span className="text-xs text-white font-medium truncate max-w-[240px]">{address.split(',')[0]}</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuotePage() {
  const params = useParams()
  const token = params.token as string

  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/solar-quotes/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setQuote(data as QuoteData)
      })
      .catch(() => setError('Failed to load quote'))
  }, [token])

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3 text-center px-4">
        <Sun className="h-10 w-10 text-solar" />
        <p className="text-lg font-semibold text-gray-800">Quote not found</p>
        <p className="text-sm text-gray-500">{error}</p>
        <Link href="/free-quote" className="mt-2 text-sm font-medium underline" style={{ color: ACCENT }}>
          Get a new quote →
        </Link>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Sun className="h-8 w-8 text-solar animate-spin" />
      </div>
    )
  }

  const date = new Date(quote.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const appliedIncentives = [
    { name: 'Federal Solar Tax Credit (ITC)', savings: '30% off', anchor: 'federal-itc' },
    { name: 'Net metering credit', savings: 'Ongoing savings', anchor: 'net-metering' },
    { name: 'State solar incentive', savings: 'Varies by state', anchor: 'state-solar-incentive' },
  ]

  const basedOnItems = [
    quote.sunshine_hours != null && { label: 'Sunshine hours/year', value: Number(quote.sunshine_hours).toLocaleString() },
    quote.roof_area_sqft != null && { label: 'Usable roof area', value: `${Number(quote.roof_area_sqft).toLocaleString()} sq ft` },
    quote.max_panels != null && { label: 'Max panels', value: String(quote.max_panels) },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 pb-10 pt-4">
          <div className="mx-auto max-w-lg">

            {/* Streaming intro */}
            <StreamingIntro quote={quote} />

            {/* Satellite map */}
            {quote.lat && quote.lng && (
              <SatelliteMap lat={quote.lat} lng={quote.lng} address={quote.address} />
            )}

            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900">Here's your solar estimate</h1>
            <p className="mt-1 text-sm text-gray-400">{quote.address}</p>

            {/* Quote card */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-4xl font-bold text-gray-900">
                    ${Number(quote.net_cost).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">after 30% federal tax credit</p>
                  <p className="mt-1 text-sm font-medium text-green-600">
                    ~${quote.monthly_savings}/mo estimated savings
                  </p>
                </div>
                <button type="button" onClick={() => setAssistantOpen(true)}
                  className="relative rounded-xl bg-orange-50 px-3 py-2 border border-transparent hover:border-[#e8751c] transition-colors shrink-0"
                  style={{ color: ACCENT }} title="Ask about your estimate">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 size-2.5 animate-bounce rounded-full"
                    style={{ backgroundColor: ACCENT }} />
                </button>
              </div>

              <div className="mt-5 space-y-1">
                {appliedIncentives.map(d => (
                  <Link key={d.name} href={`/glossary#${d.anchor}`}
                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-gray-800 group-hover:underline underline-offset-2">{d.name}</span>
                    </div>
                    <span className="font-medium text-green-600">{d.savings}</span>
                  </Link>
                ))}
              </div>

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

            {/* Quote details */}
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'System size', value: `${quote.system_kw} kW` },
                  { label: 'Gross cost', value: `$${Number(quote.gross_cost).toLocaleString()}` },
                  { label: 'Federal tax credit', value: `-$${Number(quote.itc_amount).toLocaleString()}` },
                  { label: 'Payback period', value: `~${quote.payback_years} years` },
                  { label: '20-year savings', value: `$${Number(quote.savings_20yr).toLocaleString()}` },
                  { label: 'Estimate date', value: date },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-400 text-center">Ready to get competing installer quotes?</p>
              <button className="mt-4 w-full rounded-xl py-3 text-base font-semibold text-white transition-colors"
                style={{ backgroundColor: ACCENT }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ACCENT}>
                Get a Free Consultation
              </button>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-xs text-gray-300">or</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
              <p className="text-sm text-gray-400 text-center">Have questions? Talk to a solar advisor.</p>
              <a href="tel:18005551234"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                (800) 555-1234
              </a>
              <p className="mt-3 text-center text-xs text-gray-400">No obligation · Free estimate · Licensed installers</p>
            </div>

            <p className="mt-6 text-center text-xs text-gray-300">
              This is a sample estimate. Actual costs vary based on roof assessment, permitting, and installer pricing.
              Unique quote ID: {token}
            </p>
          </div>
        </div>
      </div>

      <SolarAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        quote={quote}
      />
    </div>
  )
}
