'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Home, Sun, Zap, Calendar, ExternalLink } from 'lucide-react'

interface Lead {
  id: number; first_name: string; last_name: string; email: string; phone: string
  address: string; homeownership: string; monthly_bill: string
  roof_age: string; roof_shade: string; roof_direction: string
  goal: string; timeline: string; credit_score: string; created_at: string
  token: string | null; system_kw: number | null; net_cost: number | null
  monthly_savings: number | null; payback_years: number | null
  savings_20yr: number | null; sunshine_hours: number | null
  roof_area_sqft: number | null; max_panels: number | null
}

export default function SolarLeadDetailPage() {
  const params = useParams()
  const rawId = ((params.id as string) ?? '').replace(/^sl/, '')
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/leads?id=${rawId}`)
      .then(r => r.json())
      .then((rows: Lead[]) => {
        const found = rows.find(r => String(r.id) === rawId)
        setLead(found ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [rawId])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Sun className="h-8 w-8 text-solar animate-spin" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-[var(--muted)]">Lead not found.</p>
        <Link href="/leads" className="text-solar hover:underline text-sm">← Back to leads</Link>
      </div>
    )
  }

  const date = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fullName = `${lead.first_name} ${lead.last_name}`

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/leads" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--inp-bg)] transition-colors text-[var(--muted)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-solar/10 text-solar text-base font-bold shrink-0">
            {lead.first_name[0]}{lead.last_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--txt)]">{fullName}</h1>
            <p className="text-sm text-[var(--muted)]">{date}</p>
          </div>
          {lead.token && (
            <Link href={`/quote/${lead.token}`}
              className="ml-auto flex items-center gap-2 rounded-full bg-solar text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
              <ExternalLink className="h-3.5 w-3.5" />
              View Quote
            </Link>
          )}
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Contact</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Mail, label: 'Email', value: lead.email },
              { icon: Phone, label: 'Phone', value: lead.phone },
              { icon: Home, label: 'Homeowner', value: lead.homeownership },
              { icon: Calendar, label: 'Timeline', value: lead.timeline },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-4 w-4 text-[var(--muted)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="text-sm font-medium text-[var(--txt)]">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Property</p>
          <p className="text-sm text-[var(--txt)] mb-4 font-medium">{lead.address}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Monthly bill', value: lead.monthly_bill },
              { label: 'Roof age', value: lead.roof_age },
              { label: 'Sun exposure', value: lead.roof_shade },
              { label: 'Roof direction', value: lead.roof_direction },
              { label: 'Primary goal', value: lead.goal },
              { label: 'Credit score', value: lead.credit_score },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--inp-bg)] rounded-xl px-3 py-2.5">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="font-medium text-[var(--txt)]">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote estimate */}
        {lead.system_kw && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Solar Estimate</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'System size', value: `${lead.system_kw} kW` },
                { label: 'Net cost (after ITC)', value: lead.net_cost ? `$${Number(lead.net_cost).toLocaleString()}` : '—' },
                { label: 'Monthly savings', value: lead.monthly_savings ? `~$${lead.monthly_savings}/mo` : '—' },
                { label: 'Payback period', value: lead.payback_years ? `~${lead.payback_years} years` : '—' },
                { label: '20-year savings', value: lead.savings_20yr ? `$${Number(lead.savings_20yr).toLocaleString()}` : '—' },
                { label: 'Sunshine hrs/yr', value: lead.sunshine_hours ? Number(lead.sunshine_hours).toLocaleString() : '—' },
                { label: 'Roof area', value: lead.roof_area_sqft ? `${Number(lead.roof_area_sqft).toLocaleString()} sq ft` : '—' },
                { label: 'Max panels', value: lead.max_panels ? String(lead.max_panels) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--inp-bg)] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="font-medium text-[var(--txt)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-[var(--muted)]">Lead ID: sl{lead.id}</p>
        </div>
      </div>
    </div>
  )
}
