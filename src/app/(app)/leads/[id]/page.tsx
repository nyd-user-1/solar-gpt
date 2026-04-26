'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Send, MessageSquare, ScrollText,
  Phone, Mail,
  Calendar, Clock,
} from 'lucide-react'
import { SAMPLE_LEADS } from '@/data/leads'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

interface ScoreCard {
  title: string
  value: string
  delta: number
}

interface OutreachCard {
  title: string
  subtitle: string
  icon: typeof Calendar
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const [infoExpanded, setInfoExpanded] = useState(true)

  const lead = SAMPLE_LEADS.find(l => l.id === Number(id))

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

  const infoRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Phone', value: lead.phone, highlight: true },
    { label: 'Email', value: lead.email, highlight: true },
    { label: 'Address', value: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}` },
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
    { label: 'Estimated Cost', value: `$${lead.estimated_cost.toLocaleString()}` },
    { label: 'Annual Savings', value: `$${lead.estimated_savings_annual.toLocaleString()}` },
    { label: 'Estimated Payback', value: `${estimatedPayback} years` },
    { label: 'Financing Interest', value: lead.financing_interest },
    { label: 'Credit Score Range', value: lead.credit_score_range },
    { label: 'Status', value: lead.contact_status },
  ]

  const scoreCards: ScoreCard[] = [
    {
      title: 'Roof condition',
      value: lead.roof_type,
      delta: lead.roof_age_years < 10 ? 1 : 0,
    },
    {
      title: 'Bill size',
      value: `$${lead.monthly_electric_bill}/mo`,
      delta: lead.monthly_electric_bill >= 250 ? 1 : 0,
    },
    {
      title: 'Sun exposure',
      value: `${lead.avg_daily_sun_hours} hrs/day`,
      delta: lead.avg_daily_sun_hours >= 4.5 ? 1 : 0,
    },
  ]

  const outreachCards: OutreachCard[] = [
    {
      title: 'Drip Campaign',
      subtitle: 'Scheduled touches reacting to lead activity',
      icon: Calendar,
    },
    {
      title: 'User History',
      subtitle: 'Everything this lead has done since their visit',
      icon: Clock,
    },
    {
      title: 'Follow-up email',
      subtitle: 'Post-call email with quote details and next steps',
      icon: Mail,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-4">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Link href="/leads" className="hover:text-solar transition-colors">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-solar font-medium">{fullName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-[var(--txt)]">{fullName}</h1>

          <div className="hidden sm:flex items-center shrink-0">
            <div className="inline-flex -space-x-px">
              <Link
                href={prev ? `/leads/${prev.id}` : '#'}
                aria-disabled={!prev}
                aria-label="Previous lead"
                className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-l-full text-[var(--muted)] transition-colors ${prev ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <a
                href={`mailto:${lead.email}`}
                aria-label={`Email ${firstName}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href={`sms:${lead.phone}`}
                aria-label={`SMS ${firstName}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <Link
                href="/leads"
                aria-label="All leads"
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <ScrollText className="h-4 w-4" />
              </Link>
              <Link
                href={next ? `/leads/${next.id}` : '#'}
                aria-disabled={!next}
                aria-label="Next lead"
                className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-r-full text-[var(--muted)] transition-colors ${next ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Lead information */}
        <div className="mb-10">
          <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <button
              onClick={() => setInfoExpanded(!infoExpanded)}
              className="flex w-full items-center justify-between px-4 py-3 bg-[var(--inp-bg)]"
            >
              <span className="text-sm font-semibold text-[var(--txt)]">Lead information</span>
              <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${infoExpanded ? 'rotate-180' : ''}`} />
            </button>
            {infoExpanded && (
              <table className="w-full text-sm">
                <tbody>
                  {infoRows.map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 text-[var(--muted)]">{row.label}</td>
                      <td className={`px-4 py-3 text-right font-medium ${row.highlight ? 'text-solar' : 'text-[var(--txt)]'}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="mb-10">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--txt)]">Score</h2>
              <div className="flex items-center gap-2">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </div>
            <CarouselContent>
              {scoreCards.map((c) => (
                <CarouselItem key={c.title} className="basis-full sm:basis-1/2 md:basis-1/3">
                  <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 min-h-[90px]">
                    <p className="text-sm font-semibold text-[var(--txt)] mb-1">{c.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {c.value}{' '}
                      <span className={c.delta > 0 ? 'text-emerald-600 font-semibold' : ''}>
                        (+{c.delta})
                      </span>
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Contact */}
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-[var(--txt)]">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--inp-bg)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--txt)]">Call {firstName}</p>
                <p className="text-xs text-[var(--muted)] truncate">{lead.phone}</p>
              </div>
              <Phone className="h-4 w-4 text-[var(--muted)] shrink-0 ml-3" />
            </a>
            <a
              href={`sms:${lead.phone}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--inp-bg)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--txt)]">SMS {firstName}</p>
                <p className="text-xs text-[var(--muted)] truncate">{lead.phone}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-[var(--muted)] shrink-0 ml-3" />
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--inp-bg)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--txt)]">Email {firstName}</p>
                <p className="text-xs text-[var(--muted)] truncate">{lead.email}</p>
              </div>
              <Mail className="h-4 w-4 text-[var(--muted)] shrink-0 ml-3" />
            </a>
          </div>
        </div>

        {/* Outreach */}
        <div className="mb-10">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--txt)]">Outreach</h2>
              <div className="flex items-center gap-2">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </div>
            <CarouselContent>
              {outreachCards.map((c) => {
                const Icon = c.icon
                return (
                  <CarouselItem key={c.title} className="basis-full sm:basis-1/2 md:basis-1/3">
                    <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 min-h-[90px]">
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
