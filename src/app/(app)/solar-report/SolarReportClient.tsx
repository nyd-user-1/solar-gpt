'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sun, ChevronDown, ArrowLeft } from 'lucide-react'
// Sun is still used in the empty-state fallback below
import Link from 'next/link'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { SolarInsight } from '@/lib/solar-types'
import { SolarFluxOverlay, type BoundingBox } from '@/components/SolarFluxOverlay'

type LayersData = {
  annualFluxUrl: string | null
  monthlyFluxUrl: string | null
  dsmUrl: string | null
  boundingBox: BoundingBox | null
  imageryQuality: string | null
  _keys?: string[]
}

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
        strokeWeight: 2.5,
      },
    })
    return () => { marker.setMap(null) }
  }, [map, lat, lng])
  return null
}

// Side panel — portaled into #chat-panel-root so it sits outside the main container
function SolarSidePanel({
  address,
  insight,
  loading,
  error,
}: {
  address: string
  insight: SolarInsight | null
  loading: boolean
  error: string | null
}) {
  const [roofOpen, setRoofOpen] = useState(true)
  const [estimateOpen, setEstimateOpen] = useState(true)

  const installedCost = insight?.recommendedKw
    ? Math.round((insight.recommendedKw * 3100) / 100) * 100 : null
  const afterITC = installedCost ? Math.round(installedCost * 0.70) : null

  return (
    <div className="w-[380px] h-full rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none sm:ml-[18px]">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
        <Link href="/new-chat" className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--txt)] transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-[var(--txt)]">Solar Assistant Report</span>
      </div>

      {/* Big KPIs */}
      {(insight?.recommendedKw != null || afterITC != null) && !loading && (
        <div className="shrink-0 grid grid-cols-2 gap-px border-b border-[var(--border)]">
          {insight?.recommendedKw != null && (
            <div className="flex flex-col items-center justify-center px-4 py-5 bg-[var(--surface)]">
              <span className="text-2xl font-bold text-[var(--txt)] tabular-nums leading-none">{insight.recommendedKw} kW</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mt-2">System Size</span>
            </div>
          )}
          {afterITC != null && (
            <div className="flex flex-col items-center justify-center px-4 py-5 bg-[var(--surface)] border-l border-[var(--border)]">
              <span className="text-2xl font-bold text-[var(--txt)] tabular-nums leading-none">${afterITC.toLocaleString()}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mt-2">After ITC</span>
            </div>
          )}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3">
        {/* Loading skeleton */}
        {loading && (
          <>
            <div className="shrink-0 grid grid-cols-2 gap-px border-b border-[var(--border)] mb-3">
              {[1,2].map(i => (
                <div key={i} className="flex flex-col items-center px-4 py-5 gap-2">
                  <div className="h-6 w-16 rounded bg-[var(--inp-bg)] animate-pulse" />
                  <div className="h-3 w-12 rounded bg-[var(--inp-bg)] animate-pulse" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden mx-4 mb-3">
              <div className="px-4 py-3"><div className="h-4 w-28 rounded bg-[var(--inp-bg)] animate-pulse" /></div>
              {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
            </div>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden mx-4">
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

        {/* Accordions */}
        {insight && !loading && (
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
              {insight.yearlyEnergyKwh != null && (
                <KpiRow label="Annual output (est.)" value={`${(insight.yearlyEnergyKwh / 1000).toFixed(1)} MWh/yr`} />
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
        )}
      </div>

      {/* Footer */}
      {(insight || error) && !loading && (
        <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)] space-y-2">
          <Link
            href="/free-quote"
            className="flex items-center justify-center w-full rounded-xl bg-[#1a1a1a] dark:bg-white py-3 text-sm font-semibold text-white dark:text-[#1a1a1a] hover:opacity-80 transition-opacity text-center"
          >
            Get a Free Quote
          </Link>
          <p className="text-center text-[10px] text-[var(--muted2)]">
            Data from Google Project Sunroof · AI-powered by SolarGPT
          </p>
        </div>
      )}
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
  const [layers, setLayers] = useState<LayersData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); setError('No location provided'); return }
    // Fetch building insights + data layers in parallel
    Promise.all([
      fetch(`/api/solar?lat=${lat}&lng=${lng}`).then(r => r.json()),
      fetch(`/api/solar-layers?lat=${lat}&lng=${lng}`).then(r => r.json()).catch(e => { console.warn('[solar-layers] fetch error', e); return null }),
    ]).then(([solarData, layersData]) => {
      if (solarData.error) setError(solarData.error)
      else setInsight(solarData as SolarInsight)
      console.log('[solar-layers] keys:', layersData?._keys, '| annualFlux:', !!layersData?.annualFluxUrl, '| monthly:', !!layersData?.monthlyFluxUrl, '| quality:', layersData?.imageryQuality, '| boundingBox:', !!layersData?.boundingBox, '| bbox:', layersData?.boundingBox)
      if (layersData && !layersData.error) setLayers(layersData as LayersData)
      else console.warn('[solar-layers] error:', layersData?.error)
    }).catch(() => setError('Could not fetch solar data'))
      .finally(() => setLoading(false))
  }, [lat, lng])

  const panelRoot = mounted ? document.getElementById('chat-panel-root') : null
  const mapCenter = lat && lng ? { lat, lng } : { lat: 39.5, lng: -98.35 }

  return (
    <>
      {/* Map fills the main content area — the panel is portaled outside */}
      <div className="flex flex-1 overflow-hidden relative">
        {lat && lng ? (
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
              {(layers?.annualFluxUrl || layers?.monthlyFluxUrl) && layers.boundingBox && (
                <SolarFluxOverlay
                  annualFluxUrl={layers.annualFluxUrl ?? layers.monthlyFluxUrl!}
                  boundingBox={layers.boundingBox}
                />
              )}
            </Map>
          </APIProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--inp-bg)]">
            <Sun className="h-16 w-16 text-solar/20" />
          </div>
        )}
        {/* Address overlay on map */}
        {lat && lng && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none px-5 py-5">
            <p className="text-white font-bold text-lg leading-tight drop-shadow">{address}</p>
            <p className="text-white/70 text-sm mt-0.5">Solar Potential Report</p>
          </div>
        )}
      </div>

      {/* Side panel portaled into #chat-panel-root — sits outside the main card */}
      {panelRoot && createPortal(
        <SolarSidePanel address={address} insight={insight} loading={loading} error={error} />,
        panelRoot
      )}
    </>
  )
}
