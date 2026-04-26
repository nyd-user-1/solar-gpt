'use client'

import { useState, useRef, useCallback } from 'react'
import { CheckCircle2, Sun } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface FormData {
  zip: string
  propertyType: string
  ownership: string
  roofType: string
  roofAge: string
  roofShading: string
  monthlyBill: string
  utilityProvider: string
  solarInterest: string
  timeline: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

function defaultFormData(): FormData {
  return {
    zip: '', propertyType: '', ownership: '', roofType: '', roofAge: '',
    roofShading: '', monthlyBill: '', utilityProvider: '', solarInterest: '',
    timeline: '', firstName: '', lastName: '', email: '', phone: '',
  }
}

const ROOF_TYPES = ['Asphalt Shingle', 'Metal', 'Tile', 'Slate', 'Flat / TPO', 'Wood Shake', 'Other']
const UTILITY_PROVIDERS = ['ConEd', 'PSEG', 'National Grid', 'Central Hudson', 'Orange & Rockland', 'LIPA', 'Other']

/* ------------------------------------------------------------------ */
/*  Small UI helpers                                                   */
/* ------------------------------------------------------------------ */

function SectionCard({ title, subtitle, children, sectionRef }: {
  title: string; subtitle?: string; children: React.ReactNode
  sectionRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={sectionRef} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--txt)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
      {children}
    </label>
  )
}

function Chip({ label, selected, onClick, className = '' }: {
  label: string; selected: boolean; onClick: () => void; className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[90px] rounded-lg border px-3.5 py-2 text-sm font-medium text-center transition-all ${className} ${
        selected
          ? 'border-solar bg-solar/10 text-solar'
          : 'border-[var(--border)] bg-[var(--inp-bg)] text-[var(--txt)] hover:border-solar/50'
      }`}
    >
      {label}
    </button>
  )
}

function ChipGrid({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'
  return <div className={`grid ${colClass} gap-1.5`}>{children}</div>
}

function StyledInput({ value, onChange, placeholder, type = 'text', autoFocus, id, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
  autoFocus?: boolean; id?: string; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className="w-full rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3.5 py-2.5 text-sm text-[var(--txt)] outline-none transition-colors focus:border-solar placeholder:text-[var(--muted)]"
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function NewLeadPage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData())
  const [smsConsent, setSmsConsent] = useState(true)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const refs = {
    zip: useRef<HTMLDivElement>(null),
    propertyType: useRef<HTMLDivElement>(null),
    ownership: useRef<HTMLDivElement>(null),
    roofType: useRef<HTMLDivElement>(null),
    roofAge: useRef<HTMLDivElement>(null),
    roofShading: useRef<HTMLDivElement>(null),
    monthlyBill: useRef<HTMLDivElement>(null),
    utilityProvider: useRef<HTMLDivElement>(null),
    solarInterest: useRef<HTMLDivElement>(null),
    timeline: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  }

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [])

  const update = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }, [])

  const handleSubmit = () => {
    setSubmitStatus('loading')
    // TODO: persist to leads table once schema is defined
    console.log('Lead submission:', { ...formData, smsConsent })
    setTimeout(() => setSubmitStatus('success'), 600)
  }

  /* Success screen */
  if (submitStatus === 'success') {
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-y-auto bg-[var(--surface)] px-4 py-6">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="text-base font-semibold text-[var(--txt)]">Quote request submitted</p>
              <p className="text-sm text-[var(--muted)]">{formData.firstName} {formData.lastName} · {formData.email}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Summary</p>
            <div className="space-y-2 text-sm">
              {[
                { k: 'ZIP Code', v: formData.zip || '—' },
                { k: 'Property Type', v: formData.propertyType || '—' },
                { k: 'Ownership', v: formData.ownership || '—' },
                { k: 'Roof Type', v: formData.roofType || '—' },
                { k: 'Monthly Bill', v: formData.monthlyBill || '—' },
                { k: 'Timeline', v: formData.timeline || '—' },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[var(--muted)]">{k}</span>
                  <span className="font-medium text-[var(--txt)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setFormData(defaultFormData()); setSubmitStatus('idle') }}
            className="text-sm text-solar hover:underline text-left"
          >
            + Submit another lead
          </button>
        </div>
      </div>
    )
  }

  /* Main form */
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto bg-[var(--surface)] px-4 py-6">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">

        {/* Page header */}
        <div className="mb-2">
          <h1 className="text-xl font-bold text-[var(--txt)]">New Solar Lead</h1>
          <p className="text-sm text-[var(--muted)]">Complete the form to submit a new solar installation prospect.</p>
        </div>

        {/* ZIP Code */}
        <SectionCard title="ZIP Code" sectionRef={refs.zip}>
          <StyledInput
            value={formData.zip}
            onChange={v => {
              const digits = v.replace(/\D/g, '').slice(0, 5)
              update('zip', digits)
              if (digits.length === 5) scrollTo(refs.propertyType)
            }}
            placeholder="e.g. 10001"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && formData.zip.length === 5) scrollTo(refs.propertyType) }}
          />
        </SectionCard>

        {/* Property Type */}
        <SectionCard title="Property Type" sectionRef={refs.propertyType}>
          <ChipGrid cols={2}>
            {['Single-Family', 'Multi-Family', 'Commercial', 'Mobile Home', 'Condo / Co-op', 'Other'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.propertyType === o}
                className="w-full min-w-0"
                onClick={() => { update('propertyType', o); scrollTo(refs.ownership) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Homeowner Status */}
        <SectionCard title="Homeowner Status" subtitle="Solar financing options depend on ownership" sectionRef={refs.ownership}>
          <div className="flex gap-2">
            {['Own', 'Rent', 'Buying (mortgage)'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.ownership === o}
                onClick={() => { update('ownership', o); scrollTo(refs.roofType) }}
              />
            ))}
          </div>
        </SectionCard>

        {/* Roof Type */}
        <SectionCard title="Roof Type" sectionRef={refs.roofType}>
          <ChipGrid cols={3}>
            {ROOF_TYPES.map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.roofType === o}
                className="w-full min-w-0"
                onClick={() => { update('roofType', o); scrollTo(refs.roofAge) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Roof Age */}
        <SectionCard title="Roof Age" subtitle="Roofs under 5 years old are preferred for solar installation" sectionRef={refs.roofAge}>
          <ChipGrid cols={4}>
            {['0–5 yrs', '6–10 yrs', '11–15 yrs', '16–20 yrs', '20+ yrs', 'Not Sure'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.roofAge === o}
                className="w-full min-w-0"
                onClick={() => { update('roofAge', o); scrollTo(refs.roofShading) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Roof Shading */}
        <SectionCard title="Roof Shading" subtitle="How much shade does the roof receive during peak sun hours?" sectionRef={refs.roofShading}>
          <ChipGrid cols={2}>
            {[
              { label: '☀ None', value: 'None' },
              { label: '🌤 Minimal', value: 'Minimal' },
              { label: '⛅ Moderate', value: 'Moderate' },
              { label: '🌥 Heavy', value: 'Heavy' },
            ].map(({ label, value }) => (
              <Chip
                key={value}
                label={label}
                selected={formData.roofShading === value}
                className="w-full min-w-0"
                onClick={() => { update('roofShading', value); scrollTo(refs.monthlyBill) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Monthly Electric Bill */}
        <SectionCard title="Average Monthly Electric Bill" sectionRef={refs.monthlyBill}>
          <ChipGrid cols={3}>
            {['Under $100', '$100–$150', '$150–$200', '$200–$300', '$300–$500', '$500+'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.monthlyBill === o}
                className="w-full min-w-0"
                onClick={() => { update('monthlyBill', o); scrollTo(refs.utilityProvider) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Utility Provider */}
        <SectionCard title="Electric Utility Provider" sectionRef={refs.utilityProvider}>
          <ChipGrid cols={3}>
            {UTILITY_PROVIDERS.map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.utilityProvider === o}
                className="w-full min-w-0"
                onClick={() => { update('utilityProvider', o); scrollTo(refs.solarInterest) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Solar Interest */}
        <SectionCard title="Primary Reason for Going Solar" sectionRef={refs.solarInterest}>
          <ChipGrid cols={2}>
            {['Lower energy bills', 'Environmental impact', 'Increase home value', 'Energy independence', 'Tax incentives', 'Just exploring'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.solarInterest === o}
                className="w-full min-w-0"
                onClick={() => { update('solarInterest', o); scrollTo(refs.timeline) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Purchase Timeline" sectionRef={refs.timeline}>
          <ChipGrid cols={3}>
            {['ASAP', '1–3 months', '3–6 months', '6–12 months', '1+ year', 'Just looking'].map(o => (
              <Chip
                key={o}
                label={o}
                selected={formData.timeline === o}
                className="w-full min-w-0"
                onClick={() => { update('timeline', o); scrollTo(refs.contact) }}
              />
            ))}
          </ChipGrid>
        </SectionCard>

        {/* Contact Info */}
        <SectionCard title="Contact Information" sectionRef={refs.contact}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <FieldLabel>First Name</FieldLabel>
              <StyledInput value={formData.firstName} onChange={v => update('firstName', v)} placeholder="Jane" />
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <StyledInput value={formData.lastName} onChange={v => update('lastName', v)} placeholder="Smith" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <FieldLabel>Email</FieldLabel>
              <StyledInput type="email" value={formData.email} onChange={v => update('email', v)} placeholder="jane@example.com" />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <StyledInput
                type="tel"
                value={formData.phone}
                placeholder="(555) 555-5555"
                onChange={v => {
                  const digits = v.replace(/\D/g, '').slice(0, 10)
                  let f = ''
                  if (digits.length > 0) f += '(' + digits.slice(0, 3)
                  if (digits.length >= 3) f += ') '
                  if (digits.length > 3) f += digits.slice(3, 6)
                  if (digits.length >= 6) f += '-'
                  if (digits.length > 6) f += digits.slice(6, 10)
                  update('phone', f)
                }}
              />
            </div>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={e => setSmsConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-solar"
            />
            <span className="text-xs leading-relaxed text-[var(--muted)]">
              By submitting, you agree to receive SMS and email communications from a solar advisor. Reply STOP to opt out.
            </span>
          </label>
        </SectionCard>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitStatus === 'loading'}
          className="w-full rounded-xl bg-solar px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-solar-dark disabled:opacity-60"
        >
          {submitStatus === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <Sun className="h-4 w-4 animate-pulse-solar" />
              Submitting…
            </span>
          ) : 'Submit Lead'}
        </button>

        <div className="pb-6" />
      </div>
    </div>
  )
}
