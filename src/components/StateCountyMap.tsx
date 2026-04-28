'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CountyMapEntry } from '@/lib/queries'

const COUNTIES_URL = 'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function countyColor(v: number): string {
  if (v >= 1_000_000_000) return '#92400e'
  if (v >= 500_000_000)   return '#b45309'
  if (v >= 200_000_000)   return '#d97706'
  if (v >= 50_000_000)    return '#f59e0b'
  if (v >= 10_000_000)    return '#fbbf24'
  return '#fef3c7'
}

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'road.local', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

const LEGEND = [
  { color: '#92400e', label: '$1B+' },
  { color: '#b45309', label: '$500M – $1B' },
  { color: '#d97706', label: '$200M – $500M' },
  { color: '#f59e0b', label: '$50M – $200M' },
  { color: '#fbbf24', label: '$10M – $50M' },
  { color: '#fef3c7', label: '< $10M' },
]

type Bounds = { north: number; south: number; east: number; west: number }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 32)
  }, [map, bounds])
  return null
}

function CountyChoroplethLayer({ counties, stateFips, bounds }: { counties: CountyMapEntry[]; stateFips: string; bounds: Bounds }) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const lookup: Record<string, CountyMapEntry> = {}
    for (const c of counties) { if (c.fips) lookup[c.fips] = c }

    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        // Filter to this state only
        const filtered = {
          type: 'FeatureCollection',
          features: geojson.features.filter(f => f.properties.STATEFP === stateFips),
        }
        map.data.addGeoJson(filtered)

        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
          const c = lookup[fips]
          return {
            fillColor: c ? countyColor(c.untapped_annual_value_usd) : '#e5e7eb',
            fillOpacity: c ? 0.75 : 0.2,
            strokeColor: '#ffffff', strokeWeight: 0.8, strokeOpacity: 0.9,
          }
        })

        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const c = lookup[fips]
          if (c) router.push(`/counties/${nameToSlug(c.region_name)}`)
        })

        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#f59e0b', fillOpacity: 0.95 })
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
        })
      })
  }, [map, counties, stateFips, bounds, router])

  return null
}

export default function StateCountyMap({
  counties,
  stateFips,
  bounds,
  className = 'h-64 sm:h-96 w-full',
}: {
  counties: CountyMapEntry[]
  stateFips: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={7}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <CountyChoroplethLayer counties={counties} stateFips={stateFips} bounds={bounds} />
        </Map>
      </APIProvider>

      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Untapped / yr</p>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
            <span className="text-[10px] text-[var(--txt)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
