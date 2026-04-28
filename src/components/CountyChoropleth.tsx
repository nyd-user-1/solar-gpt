'use client'

import { useEffect, useRef, useState } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CountyMapEntry } from '@/lib/queries'

const GEOJSON_URL =
  'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function valueColor(v: number): string {
  if (v >= 1_000_000_000) return '#92400e'
  if (v >= 500_000_000)   return '#b45309'
  if (v >= 200_000_000)   return '#d97706'
  if (v >= 50_000_000)    return '#f59e0b'
  if (v >= 10_000_000)    return '#fbbf24'
  return '#fef3c7'
}

const LEGEND = [
  { color: '#92400e', label: '$1B+' },
  { color: '#b45309', label: '$500M – $1B' },
  { color: '#d97706', label: '$200M – $500M' },
  { color: '#f59e0b', label: '$50M – $200M' },
  { color: '#fbbf24', label: '$10M – $50M' },
  { color: '#fef3c7', label: '< $10M' },
]

// Minimal grayscale map style so choropleth colors pop
const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }, { visibility: 'on' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#dddddd' }, { visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

function ChoroplethLayer({ counties }: { counties: CountyMapEntry[] }) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true
    setStatus('loading')

    // Build FIPS → county lookup
    const lookup: Record<string, CountyMapEntry> = {}
    for (const c of counties) {
      if (c.fips) lookup[c.fips] = c
    }

    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        map.data.addGeoJson(geojson)

        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const fips =
            (feature.getProperty('STATEFP') as string) +
            (feature.getProperty('COUNTYFP') as string)
          const county = lookup[fips]
          return {
            fillColor: county ? valueColor(county.untapped_annual_value_usd) : '#e5e7eb',
            fillOpacity: county ? 0.75 : 0.2,
            strokeColor: '#ffffff',
            strokeWeight: 0.4,
            strokeOpacity: 0.8,
            cursor: county ? 'pointer' : 'default',
          }
        })

        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips =
            (e.feature.getProperty('STATEFP') as string) +
            (e.feature.getProperty('COUNTYFP') as string)
          const county = lookup[fips]
          if (county) router.push(`/counties/${nameToSlug(county.region_name)}`)
        })

        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, {
            strokeWeight: 2,
            strokeColor: '#f59e0b',
            fillOpacity: 0.95,
          })
        })

        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
        })

        setStatus('done')
      })
      .catch(() => setStatus('done'))
  }, [map, counties, router])

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-xs text-[var(--muted)] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            Loading county data…
          </span>
        </div>
      )}
    </>
  )
}

export default function CountyChoropleth({ counties }: { counties: CountyMapEntry[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 38, lng: -97 }}
          defaultZoom={4}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <ChoroplethLayer counties={counties} />
        </Map>
      </APIProvider>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
          Untapped / yr
        </p>
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
