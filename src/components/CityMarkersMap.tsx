'use client'

import { useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CityMarker } from '@/lib/queries'

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function markerColor(v: number): string {
  if (v >= 500_000_000) return '#92400e'
  if (v >= 200_000_000) return '#b45309'
  if (v >= 100_000_000) return '#d97706'
  if (v >= 50_000_000)  return '#f59e0b'
  if (v >= 10_000_000)  return '#fbbf24'
  return '#fde68a'
}

function markerSize(v: number): number {
  if (v >= 500_000_000) return 28
  if (v >= 200_000_000) return 22
  if (v >= 100_000_000) return 18
  if (v >= 50_000_000)  return 14
  if (v >= 10_000_000)  return 11
  return 8
}

function fmtVal(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`
  return `$${(v / 1_000).toFixed(0)}K`
}

type Bounds = { north: number; south: number; east: number; west: number }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 40)
  }, [map, bounds])
  return null
}

function MarkerLayer({ cities, bounds }: { cities: CityMarker[]; bounds: Bounds }) {
  const router = useRouter()
  return (
    <>
      <FitBounds bounds={bounds} />
      {cities.map(city => {
        const size = markerSize(city.untapped_annual_value_usd)
        const color = markerColor(city.untapped_annual_value_usd)
        return (
          <AdvancedMarker
            key={city.id}
            position={{ lat: city.lat_avg, lng: city.lng_avg }}
            onClick={() => router.push(`/cities/${nameToSlug(city.region_name)}`)}
            title={`${city.region_name} · ${fmtVal(city.untapped_annual_value_usd)}/yr untapped`}
          >
            <div
              className="rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform duration-150"
              style={{
                width: size,
                height: size,
                background: color,
                boxShadow: `0 0 0 2px white, 0 2px 6px rgba(0,0,0,0.25)`,
              }}
            />
          </AdvancedMarker>
        )
      })}
    </>
  )
}

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'road.local', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

const LEGEND = [
  { color: '#92400e', label: '$500M+' },
  { color: '#d97706', label: '$100M – $500M' },
  { color: '#f59e0b', label: '$50M – $100M' },
  { color: '#fbbf24', label: '$10M – $50M' },
  { color: '#fde68a', label: '< $10M' },
]

export default function CityMarkersMap({
  cities,
  bounds,
  className = 'h-64 sm:h-96 w-full',
}: {
  cities: CityMarker[]
  bounds: { north: number; south: number; east: number; west: number }
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  if (!cities.length) return null

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }}
          defaultZoom={9}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <MarkerLayer cities={cities} bounds={bounds} />
        </Map>
      </APIProvider>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Untapped / yr</p>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="rounded-full border border-white shadow-sm shrink-0" style={{ width: 10, height: 10, background: color }} />
            <span className="text-[10px] text-[var(--txt)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
