'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Send, MessageSquare, ScrollText,
  Phone, Mail, Calendar, Clock, ExternalLink, MapPin,
} from 'lucide-react'
import { SAMPLE_LEADS } from '@/data/leads'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface DbLead {
  id: number; first_name: string; last_name: string; email: string; phone: string
  address: string; lat: number | null; lng: number | null
  homeownership: string; monthly_bill: string; roof_age: string
  roof_shade: string; roof_direction: string; goal: string
  timeline: string; credit_score: string; created_at: string
  token: string | null; system_kw: number | null; net_cost: number | null
  monthly_savings: number | null; payback_years: number | null
  savings_20yr: number | null; sunshine_hours: number | null
  roof_area_sqft: number | null; max_panels: number | null
}

function SatelliteMap({ center, label }: { center: string; label: string }) {
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=18&size=800x400&maptype=satellite&key=${MAPS_KEY}`
  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-8 bg-[var(--inp-bg)] h-64 sm:h-96">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Satellite view of ${label}`} className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1">
        <MapPin className="h-3.5 w-3.5 text-white shrink-0" />
        <span className="text-xs text-white font-medium truncate max-w-[240px]">{label}</span>
      </div>
    </div>
  )
}

function InfoTable({ rows, expanded }: {
  rows: { label: string; value: string; highlight?: boolean }[]
  expanded: boolean
}) {
  const visible = expanded ? rows : rows.slice(0, 4)
  return (
    <table className="w-full text-sm">
      <tbody>
        {visible.map((row, i) => (
          <tr key={i} className="border-t border-[var(--border)]">
            <td className="px-4 py-3 text-[var(--muted)]">{row.label}</td>
            <td className={`px-4 py-3 text-right font-medium ${row.highlight ? 'text-solar' : 'text-[var(--txt)]'}`}>
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const numId = Number(id)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [dbLead, setDbLead] = useState<DbLead | null>(null)
  const [dbChecked, setDbChecked] = useState(false)

  // Try DB first for any numeric ID
  useEffect(() => {
    if (!numId) { setDbChecked(true); return }
    fetch(`/api/leads?id=${numId}`)
      .then(r => r.json())
      .then((rows: DbLead[]) => {
        if (rows.length) setDbLead(rows[0])
        setDbChecked(true)
      })
      .catch(() => setDbChecked(true))
  }, [numId])

  // Wait until DB check completes before deciding
  if (!dbChecked) {
    return <div className="flex flex-1 items-center justify-center" />
  }

  // ─── DB lead view ────────────────────────────────────────────────────────────

  if (dbLead) {
    const date = new Date(dbLead.created_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
    const fullName = `${dbLead.first_name} ${dbLead.last_name}`
    const mapCenter = (dbLead.lat && dbLead.lng)
      ? `${dbLead.lat},${dbLead.lng}`
      : dbLead.address

    const infoRows = [
      { label: 'Email', value: dbLead.email, highlight: true },
      { label: 'Phone', value: dbLead.phone, highlight: true },
      { label: 'Homeownership', value: dbLead.homeownership },
      { label: 'Monthly bill', value: dbLead.monthly_bill },
      { label: 'Roof age', value: dbLead.roof_age },
      { label: 'Sun exposure', value: dbLead.roof_shade },
      { label: 'Roof direction', value: dbLead.roof_direction },
      { label: 'Goal', value: dbLead.goal },
      { label: 'Timeline', value: dbLead.timeline },
      { label: 'Credit score', value: dbLead.credit_score },
      ...(dbLead.system_kw != null ? [{ label: 'System size', value: `${dbLead.system_kw} kW` }] : []),
      ...(dbLead.net_cost != null ? [{ label: 'Est. cost (after ITC)', value: `$${Number(dbLead.net_cost).toLocaleString()}` }] : []),
      ...(dbLead.monthly_savings != null ? [{ label: 'Monthly savings', value: `~$${dbLead.monthly_savings}/mo` }] : []),
      ...(dbLead.payback_years != null ? [{ label: 'Payback period', value: `~${dbLead.payback_years} years` }] : []),
      { label: 'Lead date', value: date },
    ]

    return (
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-4">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Link href="/leads" className="hover:text-solar transition-colors">Leads</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-solar font-medium">{fullName}</span>
          </nav>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-[var(--txt)]">{fullName}</h1>
            {dbLead.token && (
              <Link href={`/quote/${dbLead.token}`}
                className="flex items-center gap-2 rounded-full bg-solar text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
                View Quote
              </Link>
            )}
          </div>

          {/* Satellite map */}
          <SatelliteMap center={mapCenter} label={dbLead.address.split(',')[0]} />

          {/* Lead information accordion */}
          <div className="mb-8 rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <button
              onClick={() => setInfoExpanded(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3 bg-[var(--inp-bg)]"
            >
              <span className="text-sm font-semibold text-[var(--txt)]">Lead information</span>
              <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${infoExpanded ? 'rotate-180' : ''}`} />
            </button>
            <InfoTable rows={infoRows} expanded={infoExpanded} />
            {!infoExpanded && infoRows.length > 4 && (
              <button onClick={() => setInfoExpanded(true)}
                className="w-full py-2 text-xs text-[var(--muted)] hover:text-solar transition-colors border-t border-[var(--border)]">
                Show {infoRows.length - 4} more fields ↓
              </button>
            )}
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--txt)]">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: `tel:${dbLead.phone}`, label: `Call ${dbLead.first_name}`, sub: dbLead.phone, icon: Phone },
                { href: `sms:${dbLead.phone}`, label: `SMS ${dbLead.first_name}`, sub: dbLead.phone, icon: MessageSquare },
                { href: `mailto:${dbLead.email}`, label: `Email ${dbLead.first_name}`, sub: dbLead.email, icon: Mail },
              ].map(({ href, label, sub, icon: Icon }) => (
                <a key={label} href={href}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--inp-bg)] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--txt)]">{label}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{sub}</p>
                  </div>
                  <Icon className="h-4 w-4 text-[var(--muted)] shrink-0 ml-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Sample lead view (fallback) ─────────────────────────────────────────────

  const lead = SAMPLE_LEADS.find(l => l.id === numId)

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">Lead not found.</p>
          <Link href="/leads" className="text-solar hover:underline text-sm">← Back to leads</Link>
        </div>
      </div>
    )
  }

  const sorted = SAMPLE_LEADS.slice().sort((a, b) => a.id - b.id)
  const idx = sorted.findIndex(l => l.id === lead.id)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null
  const fullName = `${lead.first_name} ${lead.last_name}`
  const firstName = lead.first_name
  const estimatedPayback = Math.round(lead.estimated_cost / lead.estimated_savings_annual)
  const fullAddress = `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`

  const infoRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Phone', value: lead.phone, highlight: true },
    { label: 'Email', value: lead.email, highlight: true },
    { label: 'Estimated Cost', value: `$${lead.estimated_cost.toLocaleString()}` },
    { label: 'Annual Savings', value: `$${lead.estimated_savings_annual.toLocaleString()}` },
    { label: 'Address', value: fullAddress },
    { label: 'County', value: `${lead.county} County` },
    { label: 'GEA Region', value: lead.gea_region },
    { label: 'Roof Type', value: lead.roof_type },
    { label: 'Roof Age', value: `${lead.roof_age_years} years` },
    { label: 'Roof Sq Ft', value: `${lead.roof_sqft.toLocaleString()} sq ft` },
    { label: 'Shading', value: lead.shading },
    { label: 'Stories', value: `${lead.num_stories} story` },
    { label: 'Monthly Electric Bill', value: `$${lead.monthly_electric_bill}/mo` },
    { label: 'Daily Sun Hours', value: `${lead.avg_daily_sun_hours} hrs` },
    { label: 'Utility Provider', value: lead.utility_provider },
    { label: 'System Size', value: `${lead.system_size_kw} kW` },
    { label: 'Estimated Payback', value: `${estimatedPayback} years` },
    { label: 'Financing Interest', value: lead.financing_interest },
    { label: 'Credit Score Range', value: lead.credit_score_range },
    { label: 'Status', value: lead.contact_status },
  ]

  const scoreCards = [
    { title: 'Roof condition', value: lead.roof_type, delta: lead.roof_age_years < 10 ? 1 : 0 },
    { title: 'Bill size', value: `$${lead.monthly_electric_bill}/mo`, delta: lead.monthly_electric_bill >= 250 ? 1 : 0 },
    { title: 'Sun exposure', value: `${lead.avg_daily_sun_hours} hrs/day`, delta: lead.avg_daily_sun_hours >= 4.5 ? 1 : 0 },
  ]

  const outreachCards = [
    { title: 'Drip Campaign', subtitle: 'Scheduled touches reacting to lead activity', icon: Calendar },
    { title: 'User History', subtitle: 'Everything this lead has done since their visit', icon: Clock },
    { title: 'Follow-up email', subtitle: 'Post-call email with quote details and next steps', icon: Mail },
  ]

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-4">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Link href="/leads" className="hover:text-solar transition-colors">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-solar font-medium">{fullName}</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-[var(--txt)]">{fullName}</h1>
          <div className="hidden sm:flex items-center shrink-0">
            <div className="inline-flex -space-x-px">
              <Link href={prev ? `/leads/${prev.id}` : '#'} aria-disabled={!prev}
                className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] rounded-l-full text-[var(--muted)] transition-colors ${prev ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <a href={`mailto:${lead.email}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <Send className="h-4 w-4" />
              </a>
              <a href={`sms:${lead.phone}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <MessageSquare className="h-4 w-4" />
              </a>
              <Link href="/leads"
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ScrollText className="h-4 w-4" />
              </Link>
              <Link href={next ? `/leads/${next.id}` : '#'} aria-disabled={!next}
                className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] rounded-r-full text-[var(--muted)] transition-colors ${next ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Satellite map */}
        <SatelliteMap center={fullAddress} label={lead.address} />

        {/* Lead information accordion */}
        <div className="mb-8 rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <button
            onClick={() => setInfoExpanded(v => !v)}
            className="flex w-full items-center justify-between px-4 py-3 bg-[var(--inp-bg)]"
          >
            <span className="text-sm font-semibold text-[var(--txt)]">Lead information</span>
            <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${infoExpanded ? 'rotate-180' : ''}`} />
          </button>
          <InfoTable rows={infoRows} expanded={infoExpanded} />
          {!infoExpanded && infoRows.length > 4 && (
            <button onClick={() => setInfoExpanded(true)}
              className="w-full py-2 text-xs text-[var(--muted)] hover:text-solar transition-colors border-t border-[var(--border)]">
              Show {infoRows.length - 4} more fields ↓
            </button>
          )}
        </div>

        {/* Score */}
        <div className="mb-8">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--txt)]">Score</h2>
              <div className="flex items-center gap-2"><CarouselPrevious /><CarouselNext /></div>
            </div>
            <CarouselContent>
              {scoreCards.map(c => (
                <CarouselItem key={c.title} className="basis-full sm:basis-1/2 md:basis-1/3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 min-h-[90px]">
                    <p className="text-sm font-semibold text-[var(--txt)] mb-1">{c.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {c.value} <span className={c.delta > 0 ? 'text-emerald-600 font-semibold' : ''}>(+{c.delta})</span>
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Contact */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--txt)]">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: `tel:${lead.phone}`, label: `Call ${firstName}`, sub: lead.phone, icon: Phone },
              { href: `sms:${lead.phone}`, label: `SMS ${firstName}`, sub: lead.phone, icon: MessageSquare },
              { href: `mailto:${lead.email}`, label: `Email ${firstName}`, sub: lead.email, icon: Mail },
            ].map(({ href, label, sub, icon: Icon }) => (
              <a key={label} href={href}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--inp-bg)] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--txt)]">{label}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{sub}</p>
                </div>
                <Icon className="h-4 w-4 text-[var(--muted)] shrink-0 ml-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Outreach */}
        <div className="mb-8">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--txt)]">Outreach</h2>
              <div className="flex items-center gap-2"><CarouselPrevious /><CarouselNext /></div>
            </div>
            <CarouselContent>
              {outreachCards.map(c => {
                const Icon = c.icon
                return (
                  <CarouselItem key={c.title} className="basis-full sm:basis-1/2 md:basis-1/3">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 min-h-[90px]">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-[var(--txt)]">{c.title}</p>
                        <Icon className="h-4 w-4 text-[var(--muted)]" />
                      </div>
                      <p className="text-xs text-[var(--muted)] line-clamp-2">{c.subtitle}</p>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  )
}
