'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sun, ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { SolarInsight } from '@/lib/solar-types'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function KpiRow({ label, value, highlight, large }: { label: string; value: string; highlight?: boolean; large?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-green-600 dark:text-green-400' : 'text-[var(--txt)]'}`}>{value}</span>
    </div>
  )
}

function BigKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center">
      <span className="text-3xl font-bold text-[var(--txt)] tabular-nums leading-none">{value}</span>
      {sub && <span className="text-xs text-[var(--muted)] mt-1">{sub}</span>}
      <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--muted)] mt-3">{label}</span>
    </div>
  )
}

function AccordionSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--txt)]">{title}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

export default function SolarReportClient() {
  const params = useSearchParams()
  const address = params.get('address') ?? ''
  const lat = params.get('lat') ? parseFloat(params.get('lat')!) : null
  const lng = params.get('lng') ? parseFloat(params.get('lng')!) : null

  const [insight, setInsight] = useState<SolarInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roofOpen, setRoofOpen] = useState(true)
  const [estimateOpen, setEstimateOpen] = useState(true)

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); setError('No location provided'); return }
    fetch(`/api/solar?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setInsight(d as SolarInsight)
      })
      .catch(() => setError('Could not fetch solar data'))
      .finally(() => setLoading(false))
  }, [lat, lng])

  const staticMapUrl = lat && lng
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=1400x600&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${MAPS_KEY}`
    : null

  const installedCost = insight?.recommendedKw
    ? Math.round((insight.recommendedKw * 3100) / 100) * 100 : null
  const afterITC = installedCost ? Math.round(installedCost * 0.70) : null

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <Link href="/new-chat" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--txt)] truncate">{address || 'Solar Report'}</p>
        </div>
        <div className="flex items-center gap-1.5 text-solar">
          <Sun className="h-5 w-5" />
          <span className="text-sm font-bold text-[var(--txt)]">SolarGPT</span>
        </div>
      </div>

      {/* Hero satellite image */}
      <div className="relative w-full bg-[var(--inp-bg)] shrink-0" style={{ height: 280 }}>
        {staticMapUrl ? (
          <img src={staticMapUrl} alt="Satellite view" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sun className="h-16 w-16 text-solar/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-6 right-6">
          <p className="text-white text-xl font-bold leading-tight">{address}</p>
          <p className="text-white/70 text-sm mt-0.5">Solar Potential Report</p>
        </div>
        {staticMapUrl && (
          <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
            Satellite
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        {loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1,2].map(i => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 flex flex-col items-center gap-2">
                  <div className="h-8 w-20 rounded bg-[var(--inp-bg)] animate-pulse" />
                  <div className="h-3 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
                  <div className="h-3 w-24 rounded bg-[var(--inp-bg)] animate-pulse" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-[var(--inp-bg)] animate-pulse" />
              </div>
              {[1,2,3,4].map(i => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                  <div className="h-4 w-28 rounded bg-[var(--inp-bg)] animate-pulse" />
                  <div className="h-4 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-4">
            {/* Big KPIs */}
            <div className="grid grid-cols-2 gap-3">
              {insight.recommendedKw != null && (
                <BigKpi label="System Size" value={`${insight.recommendedKw} kW`} />
              )}
              {afterITC != null && (
                <BigKpi label="After ITC" value={`$${afterITC.toLocaleString()}`} sub="30% federal credit applied" />
              )}
              {insight.savings20yr != null && (
                <BigKpi label="20-Year Savings" value={`$${insight.savings20yr.toLocaleString()}`} />
              )}
              {insight.paybackYears != null && (
                <BigKpi label="Payback Period" value={`~${insight.paybackYears} yrs`} />
              )}
            </div>

            {/* Roof Analysis accordion */}
            <AccordionSection title="Roof Analysis" open={roofOpen} onToggle={() => setRoofOpen(v => !v)}>
              {insight.maxSunshineHoursPerYear != null && (
                <KpiRow label="Sunshine hours/year" value={`${insight.maxSunshineHoursPerYear.toLocaleString()} hrs`} />
              )}
              {insight.maxAreaSqFt != null && (
                <KpiRow label="Usable roof area" value={`${insight.maxAreaSqFt.toLocaleString()} sq ft`} />
              )}
              {insight.maxPanelsCount != null && (
                <KpiRow label="Max solar panels" value={String(insight.maxPanelsCount)} />
              )}
              {insight.yearlyEnergyKwh != null && (
                <KpiRow label="Annual output (est.)" value={`${(insight.yearlyEnergyKwh / 1000).toFixed(1)} MWh/yr`} />
              )}
            </AccordionSection>

            {/* System Estimate accordion */}
            <AccordionSection title="System Estimate" open={estimateOpen} onToggle={() => setEstimateOpen(v => !v)}>
              {insight.recommendedKw != null && (
                <KpiRow label="System size" value={`${insight.recommendedKw} kW`} />
              )}
              {installedCost != null && (
                <KpiRow label="Installed cost (est.)" value={`$${installedCost.toLocaleString()}`} />
              )}
              {afterITC != null && (
                <KpiRow label="After 30% federal ITC" value={`$${afterITC.toLocaleString()}`} highlight />
              )}
              {insight.paybackYears != null && (
                <KpiRow label="Payback period" value={`~${insight.paybackYears} years`} />
              )}
              {insight.savings20yr != null && (
                <KpiRow label="20-year savings" value={`$${insight.savings20yr.toLocaleString()}`} highlight />
              )}
            </AccordionSection>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href="/free-quote"
                className="block w-full rounded-xl bg-[#1a1a1a] dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity text-center"
              >
                Get a Free Quote
              </Link>
              <p className="text-center text-[10px] text-[var(--muted2)] mt-3">
                Data from Google Project Sunroof · AI-powered by SolarGPT
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
