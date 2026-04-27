'use client'

import { X, Sun, CheckCircle, Home, Zap, AlertCircle, Maximize2, BatteryCharging, PiggyBank, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import type { SolarInsight } from '@/lib/solar-types'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function fmtMoney(n: number | null) {
  if (n == null) return '—'
  return '$' + n.toLocaleString()
}

interface Props {
  open: boolean
  onClose: () => void
  address: string
  insight: SolarInsight | null
  loading: boolean
  error?: string | null
}

function DrawerContent({ open, onClose, address, insight, loading, error }: Props) {
  const lat = insight?.center?.latitude
  const lng = insight?.center?.longitude
  const staticMapUrl =
    lat != null && lng != null
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=700x380&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${MAPS_KEY}`
      : null

  return (
    <div
      className={`fixed inset-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        open ? 'w-full sm:w-[380px] sm:ml-[18px]' : 'w-0'
      }`}
    >
      {open && (
        <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={onClose} />
      )}

      <div className="relative h-full w-full sm:w-[380px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 shrink-0">
          <span className="flex-1 text-base font-semibold text-[var(--txt)]">Solar Assistant</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Satellite image */}
          <div className="relative w-full bg-[var(--inp-bg)] overflow-hidden" style={{ height: 200 }}>
            {staticMapUrl ? (
              <img
                src={staticMapUrl}
                alt="Satellite view of property"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Sun className="h-12 w-12 text-solar/20" />
              </div>
            )}
            {/* Slide: 1/1 indicator like QuoteTorch */}
            {staticMapUrl && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                Satellite
              </div>
            )}
          </div>

          <div className="px-4 py-4">
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-sm text-[var(--muted)]">Analyzing your roof…</span>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Solar data unavailable</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Data — two-section layout */}
            {insight && !loading && (() => {
              const installedCost = insight.recommendedKw
                ? Math.round((insight.recommendedKw * 3100) / 100) * 100 : null
              const afterITC = installedCost ? Math.round(installedCost * 0.70) : null

              const roofRows = [
                insight.maxSunshineHoursPerYear != null && {
                  icon: Sun, label: 'Sunshine hours/year',
                  value: insight.maxSunshineHoursPerYear.toLocaleString(),
                },
                insight.maxAreaSqFt != null && {
                  icon: Maximize2, label: 'Usable roof area',
                  value: `${insight.maxAreaSqFt.toLocaleString()} sq ft`,
                },
                insight.maxPanelsCount != null && {
                  icon: Home, label: 'Max solar panels',
                  value: String(insight.maxPanelsCount),
                },
                (insight as { yearlyEnergyKwh?: number | null }).yearlyEnergyKwh != null && {
                  icon: Zap, label: 'Annual output (est.)',
                  value: `${((insight as { yearlyEnergyKwh?: number | null }).yearlyEnergyKwh! / 1000).toFixed(1)} MWh/yr`,
                },
              ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[]

              const estimateRows = [
                insight.recommendedKw != null && {
                  icon: BatteryCharging, label: 'System size',
                  value: `${insight.recommendedKw} kW`, bold: true,
                },
                installedCost != null && {
                  icon: Zap, label: 'Installed cost (est.)',
                  value: `$${installedCost.toLocaleString()}`,
                },
                afterITC != null && {
                  icon: CheckCircle, label: 'After 30% federal ITC',
                  value: `$${afterITC.toLocaleString()}`, highlight: true,
                },
                insight.paybackYears != null && {
                  icon: Calendar, label: 'Payback period',
                  value: `~${insight.paybackYears} years`,
                },
                insight.savings20yr != null && {
                  icon: PiggyBank, label: '20-year savings',
                  value: `$${insight.savings20yr.toLocaleString()}`, highlight: true,
                },
              ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; bold?: boolean; highlight?: boolean }[]

              return (
                <div className="space-y-5">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-[var(--muted)]">Analysis complete</span>
                  </div>

                  {/* Section 1 — Roof */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2 px-1">
                      Roof Analysis
                    </p>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
                      {roofRows.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3">
                          <Icon className="h-4 w-4 text-solar shrink-0" />
                          <span className="flex-1 text-sm text-[var(--muted)]">{label}</span>
                          <span className="text-sm font-semibold text-[var(--txt)] tabular-nums">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2 — System estimate */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2 px-1">
                      System Estimate
                    </p>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
                      {estimateRows.map(({ icon: Icon, label, value, highlight }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3">
                          <Icon className={`h-4 w-4 shrink-0 ${highlight ? 'text-green-500' : 'text-solar'}`} />
                          <span className="flex-1 text-sm text-[var(--muted)]">{label}</span>
                          <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-green-600' : 'text-[var(--txt)]'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Footer CTA */}
        {(insight || error) && !loading && (
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)] flex gap-2">
            <button className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
              Save Report
            </button>
            <Link href="/free-quote"
              className="flex-1 rounded-xl bg-[#1a1a1a] dark:bg-white py-3 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity text-center">
              Get a Free Quote
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function SolarAddressDrawer(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const root = document.getElementById('chat-panel-root')
  if (!root) return null
  return createPortal(<DrawerContent {...props} />, root)
}
