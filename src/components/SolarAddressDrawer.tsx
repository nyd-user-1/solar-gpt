'use client'

import { X, Sun, CheckCircle, Home, Zap, AlertCircle } from 'lucide-react'
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
        <div className="flex items-start gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar shrink-0 mt-0.5">
            <Sun className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--txt)] leading-tight">Solar Analysis</p>
            <p className="text-xs text-[var(--muted)] truncate mt-0.5">{address}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors shrink-0"
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

          <div className="px-4 py-4 space-y-4">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--inp-bg)] px-4 py-4">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-solar animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-sm text-[var(--muted)]">Analyzing your roof…</span>
              </div>
            )}

            {/* Error state */}
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
            {insight && !loading && (
              <>
                {/* Analysis complete */}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-[var(--muted)]">Analysis complete. Your roof has:</span>
                </div>

                {/* Metric rows */}
                <div className="space-y-3">
                  {insight.maxSunshineHoursPerYear != null && (
                    <div className="flex items-start gap-3 rounded-xl bg-[var(--inp-bg)] px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
                        <Sun className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--txt)]">
                          {insight.maxSunshineHoursPerYear.toLocaleString()} hours of usable sunlight per year
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          Based on day-to-day analysis of weather patterns
                        </p>
                      </div>
                    </div>
                  )}

                  {insight.maxAreaSqFt != null && (
                    <div className="flex items-start gap-3 rounded-xl bg-[var(--inp-bg)] px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 shrink-0">
                        <Home className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--txt)]">
                          {insight.maxAreaSqFt.toLocaleString()} sq ft available for solar panels
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          Based on 3D modeling of your roof and nearby trees
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Savings + system size card */}
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  {insight.savings20yr != null && (
                    <div className="px-4 py-4 border-b border-[var(--border)]">
                      <p className="text-2xl font-bold text-[var(--txt)]">
                        {fmtMoney(insight.savings20yr)} savings
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Estimated net savings for your roof over 20 years
                      </p>
                    </div>
                  )}

                  {insight.recommendedKw != null && (
                    <div className="px-4 py-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                          Your Recommended Solar Installation Size
                        </p>
                        <Zap className="h-3.5 w-3.5 text-solar shrink-0" />
                      </div>
                      <p className="text-4xl font-bold text-[var(--txt)] text-center tabular-nums">
                        {insight.recommendedKw} kW
                      </p>
                      {insight.maxAreaSqFt != null && (
                        <p className="text-sm text-[var(--muted)] text-center mt-1">
                          ({insight.maxAreaSqFt.toLocaleString()} ft²)
                        </p>
                      )}
                      {insight.paybackYears != null && (
                        <p className="text-xs text-[var(--muted)] text-center mt-2">
                          ~{insight.paybackYears} year payback period
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        {(insight || error) && !loading && (
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)] flex gap-2">
            <button className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
              Save Report
            </button>
            <button className="flex-1 rounded-xl bg-[#1a1a1a] dark:bg-white py-3 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity">
              Get a Free Quote
            </button>
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
