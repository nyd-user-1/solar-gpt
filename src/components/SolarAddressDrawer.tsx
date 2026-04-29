'use client'

import { X, Sun, AlertCircle, ChevronDown } from 'lucide-react'
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
  lat?: number | null
  lng?: number | null
  insight: SolarInsight | null
  loading: boolean
  error?: string | null
}

function KpiRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-green-600 dark:text-green-400' : 'text-[var(--txt)]'}`}>{value}</span>
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

function DrawerContent({ open, onClose, address, lat, lng, insight, loading, error }: Props) {
  const mapLat = lat ?? insight?.center?.latitude
  const mapLng = lng ?? insight?.center?.longitude
  const staticMapUrl =
    mapLat != null && mapLng != null
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapLat},${mapLng}&zoom=19&size=700x380&maptype=satellite&markers=color:red%7C${mapLat},${mapLng}&key=${MAPS_KEY}`
      : null

  const [roofOpen, setRoofOpen] = useState(true)
  const [estimateOpen, setEstimateOpen] = useState(true)

  const reportUrl = address
    ? `/solar-report?address=${encodeURIComponent(address)}${mapLat != null ? `&lat=${mapLat}` : ''}${mapLng != null ? `&lng=${mapLng}` : ''}`
    : '/solar-report'

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
          <span className="flex-1 text-base font-semibold text-[var(--txt)] truncate">{address || 'Solar Analysis'}</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors shrink-0"
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
            {staticMapUrl && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                Satellite
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* Loading shimmer */}
            {loading && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--surface)]">
                    <div className="h-4 w-32 rounded bg-[var(--inp-bg)] animate-pulse" />
                  </div>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                      <div className="h-4 w-24 rounded bg-[var(--inp-bg)] animate-pulse" />
                      <div className="h-4 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--surface)]">
                    <div className="h-4 w-36 rounded bg-[var(--inp-bg)] animate-pulse" />
                  </div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                      <div className="h-4 w-28 rounded bg-[var(--inp-bg)] animate-pulse" />
                      <div className="h-4 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
                    </div>
                  ))}
                </div>
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

            {/* Data */}
            {insight && !loading && (() => {
              const installedCost = insight.recommendedKw
                ? Math.round((insight.recommendedKw * 3100) / 100) * 100 : null
              const afterITC = installedCost ? Math.round(installedCost * 0.70) : null

              return (
                <>
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
                    {(insight as { yearlyEnergyKwh?: number | null }).yearlyEnergyKwh != null && (
                      <KpiRow
                        label="Annual output (est.)"
                        value={`${((insight as { yearlyEnergyKwh?: number | null }).yearlyEnergyKwh! / 1000).toFixed(1)} MWh/yr`}
                      />
                    )}
                  </AccordionSection>

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
                </>
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
            <Link
              href={reportUrl}
              className="flex-1 rounded-xl bg-[#1a1a1a] dark:bg-white py-3 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity text-center"
            >
              Full Report
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
