'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Sun, ChevronDown, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { SolarInsight } from '@/lib/solar-types'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

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
    <div className="rounded-xl border border-[var(--border)] overflow-hidden mx-4 mb-3">
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

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
      <div className="h-4 w-24 rounded bg-[var(--inp-bg)] animate-pulse" />
      <div className="h-4 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
    </div>
  )
}

// Adds a marker at the given position using the native Maps API
function AddressMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    })
    return () => { marker.setMap(null) }
  }, [map, lat, lng])
  return null
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

  const installedCost = insight?.recommendedKw
    ? Math.round((insight.recommendedKw * 3100) / 100) * 100 : null
  const afterITC = installedCost ? Math.round(installedCost * 0.70) : null

  const mapCenter = lat && lng ? { lat, lng } : { lat: 39.5, lng: -98.35 }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Full-screen satellite map ── */}
      {lat && lng ? (
        <div className="flex-1 relative min-w-0">
          <APIProvider apiKey={MAPS_KEY}>
            <Map
              mapTypeId="satellite"
              defaultCenter={mapCenter}
              defaultZoom={19}
              disableDefaultUI
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
            >
              <AddressMarker lat={lat} lng={lng} />
            </Map>
          </APIProvider>
          {/* Address overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none px-5 py-5">
            <p className="text-white font-bold text-lg leading-tight drop-shadow">{address}</p>
            <p className="text-white/70 text-sm mt-0.5">Solar Potential Report</p>
          </div>
          {/* Satellite badge */}
          <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
            Satellite
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[var(--inp-bg)]">
          <Sun className="h-16 w-16 text-solar/20" />
        </div>
      )}

      {/* ── Side panel ── */}
      <div className="w-[380px] shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
          <Link href="/new-chat" className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--txt)] transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--txt)] truncate">{address || 'Solar Report'}</p>
          </div>
          <div className="flex items-center gap-1.5 text-solar shrink-0">
            <Sun className="h-4 w-4" />
            <span className="text-xs font-bold text-[var(--txt)]">SolarGPT</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3">

          {/* Loading skeleton */}
          {loading && (
            <>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden mx-4 mb-3">
                <div className="px-4 py-3"><div className="h-4 w-28 rounded bg-[var(--inp-bg)] animate-pulse" /></div>
                {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
              </div>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden mx-4 mb-3">
                <div className="px-4 py-3"><div className="h-4 w-32 rounded bg-[var(--inp-bg)] animate-pulse" /></div>
                {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
              </div>
            </>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="mx-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Big KPIs */}
          {insight && !loading && (
            <>
              {(insight.recommendedKw != null || afterITC != null) && (
                <div className="grid grid-cols-2 gap-3 px-4 mb-3">
                  {insight.recommendedKw != null && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-4 flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-[var(--txt)] tabular-nums leading-none">{insight.recommendedKw} kW</span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mt-2">System Size</span>
                    </div>
                  )}
                  {afterITC != null && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-4 flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-[var(--txt)] tabular-nums leading-none">${afterITC.toLocaleString()}</span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mt-2">After ITC</span>
                    </div>
                  )}
                </div>
              )}

              {/* Roof Analysis */}
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

              {/* System Estimate */}
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
          )}
        </div>

        {/* Footer */}
        {(insight || error) && !loading && (
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)] space-y-2">
            <Link
              href="/free-quote"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#1a1a1a] dark:bg-white py-3 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity text-center"
            >
              Get a Free Quote
            </Link>
            <p className="text-center text-[10px] text-[var(--muted2)]">
              Data from Google Project Sunroof · AI-powered by SolarGPT
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
