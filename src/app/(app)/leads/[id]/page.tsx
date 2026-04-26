'use client'

import { useParams, useRouter } from 'next/navigation'
import { SAMPLE_LEADS, STATUS_STYLES, CONTACT_STATUSES } from '@/data/leads'
import { ArrowLeft, Sun, MapPin, Phone, Mail, Zap, Home, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function LeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
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

  const style = STATUS_STYLES[lead.contact_status] ?? STATUS_STYLES['New']
  const estimatedPayback = Math.round(lead.estimated_cost / lead.estimated_savings_annual)
  const roiPct = Math.round((lead.estimated_savings_annual / lead.estimated_cost) * 100 * 10) / 10

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-5 py-6">

        {/* Back + status */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </button>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold', style.bg, style.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
            {lead.contact_status}
          </span>
        </div>

        {/* Hero */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-solar/10 text-solar text-2xl font-bold shrink-0">
              {lead.first_name[0]}{lead.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--txt)]">{lead.first_name} {lead.last_name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted)]">
                <MapPin className="h-3.5 w-3.5" />
                {lead.address}, {lead.city}, {lead.state} {lead.zip}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                {lead.county} County · {lead.gea_region}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* System estimate */}
          <div className="col-span-1 md:col-span-2 rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--txt)] mb-4 flex items-center gap-2">
              <Sun className="h-4 w-4 text-solar" />
              Solar System Estimate
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'System Size', value: `${lead.system_size_kw} kW` },
                { label: 'Est. Cost', value: `$${lead.estimated_cost.toLocaleString()}` },
                { label: 'Annual Savings', value: `$${lead.estimated_savings_annual.toLocaleString()}` },
                { label: 'Payback', value: `${estimatedPayback} yrs` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-[var(--inp-bg)]">
                  <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
                  <p className="text-xl font-bold text-[var(--txt)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-solar/5 border border-solar/20 px-4 py-3">
              <Zap className="h-4 w-4 text-solar shrink-0" />
              <p className="text-sm text-[var(--txt)]">
                <span className="font-semibold">{roiPct}% annual ROI</span> · After 30% federal tax credit the net cost is <span className="font-semibold">${Math.round(lead.estimated_cost * 0.7).toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--txt)] mb-4">Contact</h2>
            <div className="space-y-3">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-sm hover:text-solar transition-colors">
                <Phone className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <span className="text-[var(--txt)]">{lead.phone}</span>
              </a>
              <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-sm hover:text-solar transition-colors">
                <Mail className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <span className="text-[var(--txt)] truncate">{lead.email}</span>
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] mb-1">Status</p>
              <select
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--inp-bg)] px-3 py-2 text-sm text-[var(--txt)] outline-none focus:border-solar transition-colors"
                defaultValue={lead.contact_status}
              >
                {CONTACT_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Property details */}
          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--txt)] mb-4 flex items-center gap-2">
              <Home className="h-4 w-4 text-solar" />
              Property Details
            </h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  { label: 'Roof Type', value: lead.roof_type },
                  { label: 'Roof Age', value: `${lead.roof_age_years} years` },
                  { label: 'Roof Sq Ft', value: `${lead.roof_sqft.toLocaleString()} sq ft` },
                  { label: 'Shading', value: lead.shading },
                  { label: 'Ownership', value: lead.ownership },
                  { label: 'Stories', value: `${lead.num_stories} story` },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="py-2.5 text-[var(--muted)]">{label}</td>
                    <td className="py-2.5 text-right font-medium text-[var(--txt)]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Energy & financing */}
          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--txt)] mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-solar" />
              Energy & Financing
            </h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  { label: 'Monthly Electric Bill', value: `$${lead.monthly_electric_bill}/mo`, highlight: true },
                  { label: 'Daily Sun Hours', value: `${lead.avg_daily_sun_hours} hrs` },
                  { label: 'Utility Provider', value: lead.utility_provider },
                  { label: 'Financing Interest', value: lead.financing_interest },
                  { label: 'Credit Score Range', value: lead.credit_score_range },
                  { label: 'GEA Region', value: lead.gea_region },
                ].map(({ label, value, highlight }) => (
                  <tr key={label}>
                    <td className="py-2.5 text-[var(--muted)]">{label}</td>
                    <td className={cn('py-2.5 text-right font-medium', highlight ? 'text-solar' : 'text-[var(--txt)]')}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location links */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            View solar data for this area:
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href={`/counties/${lead.county.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}`} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--txt)] hover:border-solar hover:text-solar transition-colors">
              {lead.county} County
            </Link>
            <Link href={`/gea-regions/${lead.gea_region.toLowerCase().replace(/\s+/g, '-')}`} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--txt)] hover:border-solar hover:text-solar transition-colors">
              {lead.gea_region}
            </Link>
            <Link href={`/zips/${lead.zip}`} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--txt)] hover:border-solar hover:text-solar transition-colors">
              ZIP {lead.zip}
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
