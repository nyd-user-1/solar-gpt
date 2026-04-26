'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { NY_COUNTIES } from '@/data/geo'

const ROOF_TYPES = ['Asphalt Shingle', 'Metal', 'Tile', 'Slate', 'Flat / TPO', 'Wood Shake', 'Other']
const SHADING = ['None', 'Minimal', 'Moderate', 'Heavy']
const FINANCING = ['Cash', 'Solar Loan', 'Lease / PPA', 'PACE Financing', 'Home Equity Loan', 'Unsure']
const CREDIT_RANGES = ['780+', '720–779', '680–719', '640–679', 'Below 640', 'Unsure']
const STORIES = ['1 story', '2 stories', '3+ stories']

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  county: string
  roof_type: string
  roof_age: string
  roof_sqft: string
  monthly_bill: string
  shading: string
  ownership: string
  stories: string
  financing: string
  credit_range: string
  notes: string
}

const EMPTY: FormData = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', state: 'NY', zip: '', county: '',
  roof_type: '', roof_age: '', roof_sqft: '', monthly_bill: '',
  shading: '', ownership: '', stories: '', financing: '', credit_range: '',
  notes: '',
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--txt)] mb-1.5">
        {label}{required && <span className="text-solar ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-2.5 text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none focus:border-solar transition-colors'
const selectClass = `${inputClass} appearance-none`

export default function NewLeadPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitted, setSubmitted] = useState(false)

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const steps = [
    { title: 'Your Home', icon: '🏠' },
    { title: 'Your Roof', icon: '🔧' },
    { title: 'Contact Info', icon: '📋' },
  ]

  if (submitted) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-5 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-solar/10">
            <Check className="h-10 w-10 text-solar" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--txt)] mb-3">Quote Request Submitted!</h1>
          <p className="text-[var(--muted)] mb-8">
            Thank you, {form.first_name}! We'll calculate your personalized solar estimate and contact you within 1 business day.
          </p>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] p-5 text-left mb-8">
            <h3 className="font-semibold text-[var(--txt)] mb-3">What happens next?</h3>
            <div className="space-y-2">
              {['A solar advisor reviews your quote request', 'Site assessment scheduled (30 min)', 'Custom design and final quote delivered', 'Installation typically within 4–6 weeks'].map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-[var(--txt)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-solar text-white text-xs font-bold">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push('/leads')}
            className="rounded-full bg-solar px-6 py-3 font-semibold text-white hover:bg-solar-dark transition-colors"
          >
            View All Leads
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-5 w-5 text-solar" />
            <span className="text-sm font-medium text-[var(--muted)]">Solar Installation Quote</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--txt)]">Get Your Solar Estimate</h1>
          <p className="text-[var(--muted)] mt-1">Free, no-obligation quote based on your home and energy usage</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px flex-1 w-8 ${i <= step ? 'bg-solar' : 'bg-[var(--border)]'}`} />}
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === step ? 'bg-solar text-white' : i < step ? 'bg-solar/10 text-solar' : 'bg-[var(--inp-bg)] text-[var(--muted)]'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Step 0: Home info */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Street Address" required>
                <input className={inputClass} placeholder="123 Main St" value={form.address} onChange={set('address')} />
              </Field>
              <Field label="City" required>
                <input className={inputClass} placeholder="Albany" value={form.city} onChange={set('city')} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="State">
                <select className={selectClass} value={form.state} onChange={set('state')}>
                  <option>NY</option><option>NJ</option><option>CT</option><option>PA</option><option>MA</option>
                </select>
              </Field>
              <Field label="ZIP Code" required>
                <input className={inputClass} placeholder="12201" value={form.zip} onChange={set('zip')} maxLength={5} />
              </Field>
              <Field label="County">
                <select className={selectClass} value={form.county} onChange={set('county')}>
                  <option value="">Select…</option>
                  {NY_COUNTIES.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Home Ownership" required>
                <select className={selectClass} value={form.ownership} onChange={set('ownership')}>
                  <option value="">Select…</option>
                  <option>Own</option>
                  <option>Rent</option>
                  <option>Buying (mortgage)</option>
                </select>
              </Field>
              <Field label="Number of Stories" required>
                <select className={selectClass} value={form.stories} onChange={set('stories')}>
                  <option value="">Select…</option>
                  {STORIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Average Monthly Electric Bill ($)" required>
              <input
                className={inputClass}
                type="number"
                placeholder="200"
                value={form.monthly_bill}
                onChange={set('monthly_bill')}
              />
            </Field>
          </div>
        )}

        {/* Step 1: Roof info */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Roof Type" required>
                <select className={selectClass} value={form.roof_type} onChange={set('roof_type')}>
                  <option value="">Select…</option>
                  {ROOF_TYPES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Roof Age (years)" required>
                <input
                  className={inputClass}
                  type="number"
                  placeholder="10"
                  value={form.roof_age}
                  onChange={set('roof_age')}
                />
              </Field>
            </div>
            <Field label="Roof Square Footage (approx)">
              <input
                className={inputClass}
                type="number"
                placeholder="2000"
                value={form.roof_sqft}
                onChange={set('roof_sqft')}
              />
            </Field>
            <Field label="Roof Shading" required>
              <div className="grid grid-cols-2 gap-2">
                {SHADING.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, shading: s }))}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${
                      form.shading === s ? 'border-solar bg-solar/5 text-solar' : 'border-[var(--border)] bg-[var(--inp-bg)] text-[var(--txt)] hover:border-solar/50'
                    }`}
                  >
                    {s === 'None' && '☀️ '}
                    {s === 'Minimal' && '🌤️ '}
                    {s === 'Moderate' && '⛅ '}
                    {s === 'Heavy' && '🌥️ '}
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Financing Interest">
              <select className={selectClass} value={form.financing} onChange={set('financing')}>
                <option value="">Select…</option>
                {FINANCING.map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Credit Score Range">
              <select className={selectClass} value={form.credit_range} onChange={set('credit_range')}>
                <option value="">Select…</option>
                {CREDIT_RANGES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Additional Notes">
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Anything else we should know about your home or energy situation?"
                value={form.notes}
                onChange={set('notes')}
              />
            </Field>
          </div>
        )}

        {/* Step 2: Contact info */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required>
                <input className={inputClass} placeholder="Jane" value={form.first_name} onChange={set('first_name')} />
              </Field>
              <Field label="Last Name" required>
                <input className={inputClass} placeholder="Smith" value={form.last_name} onChange={set('last_name')} />
              </Field>
            </div>
            <Field label="Email Address" required>
              <input className={inputClass} type="email" placeholder="jane@example.com" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone Number" required>
              <input className={inputClass} type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={set('phone')} />
            </Field>

            {/* Summary card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] p-5">
              <h3 className="font-semibold text-[var(--txt)] mb-3 text-sm">Quote Summary</h3>
              <dl className="space-y-2 text-sm">
                {[
                  { k: 'Address', v: form.address && form.city ? `${form.address}, ${form.city}, ${form.state} ${form.zip}` : '—' },
                  { k: 'County', v: form.county || '—' },
                  { k: 'Monthly Bill', v: form.monthly_bill ? `$${form.monthly_bill}/mo` : '—' },
                  { k: 'Roof Type', v: form.roof_type || '—' },
                  { k: 'Roof Age', v: form.roof_age ? `${form.roof_age} years` : '—' },
                  { k: 'Shading', v: form.shading || '—' },
                  { k: 'Financing', v: form.financing || '—' },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-[var(--muted)]">{k}</dt>
                    <dd className="font-medium text-[var(--txt)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="text-xs text-[var(--muted)]">
              By submitting, you agree to receive a call or email from a solar advisor. We never sell your information.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : undefined}
            className={`flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 rounded-full bg-solar px-6 py-2.5 text-sm font-semibold text-white hover:bg-solar-dark transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 rounded-full bg-solar px-6 py-2.5 text-sm font-semibold text-white hover:bg-solar-dark transition-colors"
            >
              <Sun className="h-4 w-4" />
              Submit Quote Request
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
