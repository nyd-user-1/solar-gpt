'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { ZipMapEntry } from '@/lib/queries'
import { fmtNum } from '@/lib/utils'

function zipGeoJsonUrl(stateAbbr: string, stateName: string): string {
  const nameSlug = stateName.toLowerCase().replace(/ /g, '_')
  return `https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/${stateAbbr}_${nameSlug}_zip_codes_geo.min.json`
}

function zipColor(v: number): string {
  if (v >= 100_000_000) return '#92400e'
  if (v >= 50_000_000)  return '#b45309'
  if (v >= 20_000_000)  return '#d97706'
  if (v >= 10_000_000)  return '#f59e0b'
  if (v >= 1_000_000)   return '#fbbf24'
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
  { color: '#92400e', label: '$100M+' },
  { color: '#b45309', label: '$50M – $100M' },
  { color: '#d97706', label: '$20M – $50M' },
  { color: '#f59e0b', label: '$10M – $20M' },
  { color: '#fbbf24', label: '$1M – $10M' },
  { color: '#fef3c7', label: '< $1M' },
]

type Bounds = { north: number; south: number; east: number; west: number }
type ChipData = { title: string; subtitle?: string | null; buildings: number }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 32)
  }, [map, bounds])
  return null
}

function ZipChoroplethLayer({
  zips, stateAbbr, stateName, onHoverChange, onLoaded,
}: {
  zips: ZipMapEntry[]
  stateAbbr: string
  stateName: string
  onHoverChange: (data: ChipData | null) => void
  onLoaded: () => void
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const zipLookup: Record<string, ZipMapEntry> = {}
    for (const z of zips) zipLookup[z.zip_code] = z
    const zipSet = new Set(Object.keys(zipLookup))

    fetch(zipGeoJsonUrl(stateAbbr, stateName))
      .then(r => r.json())
      .then((zipGeojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        const filteredZips = {
          type: 'FeatureCollection',
          features: zipGeojson.features.filter(f => {
            const zip = f.properties.ZCTA5CE10 ?? f.properties.GEOID10
            return zipSet.has(zip)
          }),
        }
        map.data.addGeoJson(filteredZips)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const zip = (feature.getProperty('ZCTA5CE10') ?? feature.getProperty('GEOID10')) as string
          const z = zipLookup[zip]
          return {
            fillColor: z ? zipColor(z.untapped_annual_value_usd) : '#e5e7eb',
            fillOpacity: z ? 0.75 : 0.2,
            strokeColor: '#ffffff', strokeWeight: 0.8, strokeOpacity: 0.9,
          }
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const zip = (e.feature.getProperty('ZCTA5CE10') ?? e.feature.getProperty('GEOID10')) as string
          if (zip) router.push(`/zips/${zip}`)
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const zip = (e.feature.getProperty('ZCTA5CE10') ?? e.feature.getProperty('GEOID10')) as string
          const z = zipLookup[zip]
          map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: '#f59e0b', fillOpacity: 0.95 })
          onHoverChange(z ? { title: z.zip_code, subtitle: z.region_name ?? null, buildings: z.count_qualified } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        onLoaded()
      })
  }, [map, zips, stateAbbr, stateName, onHoverChange, onLoaded, router])

  return null
}

export default function CountyZipMap({
  zips, countyFips: _countyFips, stateAbbr, stateName, countyName, bounds,
  className = 'h-64 sm:h-96 w-full',
}: {
  zips: ZipMapEntry[]
  countyFips: string
  stateAbbr: string
  stateName: string
  countyName: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }

  const countyTotal = useMemo(() => zips.reduce((s, z) => s + z.count_qualified, 0), [zips])
  const defaultChip = useMemo<ChipData>(() => ({ title: countyName, buildings: countyTotal }), [countyName, countyTotal])
  const [hoveredChip, setHoveredChip] = useState<ChipData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const chip = hoveredChip ?? defaultChip
  const handleLoaded = useCallback(() => setLoaded(true), [])

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={9}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <ZipChoroplethLayer
            zips={zips}
            stateAbbr={stateAbbr}
            stateName={stateName}
            onHoverChange={setHoveredChip}
            onLoaded={handleLoaded}
          />
        </Map>
      </APIProvider>

      {/* Skeleton overlay — fades out once GeoJSON loaded */}
      <div className={`absolute inset-0 z-10 rounded-2xl bg-[var(--border)] animate-shimmer pointer-events-none transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`} />

      {/* Info chip — above skeleton */}
      <div className="absolute bottom-8 left-3 z-20 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md pointer-events-none">
        <p className="text-sm font-bold text-[#1a1a1a]">{chip.title}</p>
        {chip.subtitle && <p className="text-xs font-medium text-[#555]">{chip.subtitle}</p>}
        <p className="text-[10px] text-[#666]">{fmtNum(chip.buildings)} qualified buildings</p>
      </div>

      {/* Legend — above skeleton */}
      <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
            <span className="text-[10px] text-[#333]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
