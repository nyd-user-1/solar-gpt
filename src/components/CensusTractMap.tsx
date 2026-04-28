'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { TractMapEntry } from '@/lib/queries'
import { fmtNum } from '@/lib/utils'

function tractGeoJsonUrl(stateFips: string): string {
  return `https://raw.githubusercontent.com/mehrotrasan16/us-census-tracts-shapefiles-and-geojson/master/USA-cb_tract_500k-geojson/cb_2018_${stateFips}_tract_500k.json`
}

function tractColor(v: number): string {
  if (v >= 5000) return '#92400e'
  if (v >= 2000) return '#b45309'
  if (v >= 1000) return '#d97706'
  if (v >= 500)  return '#f59e0b'
  if (v >= 100)  return '#fbbf24'
  return '#fef3c7'
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
  { color: '#92400e', label: '5,000+' },
  { color: '#b45309', label: '2,000–5,000' },
  { color: '#d97706', label: '1,000–2,000' },
  { color: '#f59e0b', label: '500–1,000' },
  { color: '#fbbf24', label: '100–500' },
  { color: '#fef3c7', label: '< 100' },
]

type Bounds = { north: number; south: number; east: number; west: number }
type ChipData = { title: string; buildings: number }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 32)
  }, [map, bounds])
  return null
}

function TractChoroplethLayer({
  tracts, stateFips, onHoverChange,
}: {
  tracts: TractMapEntry[]
  stateFips: string
  onHoverChange: (data: ChipData | null) => void
}) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const tractLookup: Record<string, TractMapEntry> = {}
    for (const t of tracts) tractLookup[t.geoid] = t
    const geoidSet = new Set(Object.keys(tractLookup))

    fetch(tractGeoJsonUrl(stateFips))
      .then(r => r.json())
      .then((geojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        const filtered = {
          type: 'FeatureCollection',
          features: geojson.features.filter(f => geoidSet.has(f.properties.GEOID)),
        }
        map.data.addGeoJson(filtered)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const geoid = feature.getProperty('GEOID') as string
          const t = tractLookup[geoid]
          return {
            fillColor: t ? tractColor(t.count_qualified) : '#e5e7eb',
            fillOpacity: t ? 0.75 : 0.2,
            strokeColor: '#ffffff', strokeWeight: 0.5, strokeOpacity: 0.8,
          }
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const geoid = e.feature.getProperty('GEOID') as string
          const name = e.feature.getProperty('NAME') as string
          const t = tractLookup[geoid]
          map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: '#f59e0b', fillOpacity: 0.95 })
          onHoverChange(t ? { title: `Tract ${name}`, buildings: t.count_qualified } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
      })
  }, [map, tracts, stateFips, onHoverChange])

  return null
}

export default function CensusTractMap({
  tracts, stateFips, parentName, bounds,
  className = 'h-64 sm:h-96 w-full',
}: {
  tracts: TractMapEntry[]
  stateFips: string
  parentName: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }

  const totalBuildings = useMemo(() => tracts.reduce((s, t) => s + t.count_qualified, 0), [tracts])
  const defaultChip = useMemo<ChipData>(() => ({ title: parentName, buildings: totalBuildings }), [parentName, totalBuildings])
  const [hoveredChip, setHoveredChip] = useState<ChipData | null>(null)
  const chip = hoveredChip ?? defaultChip

  const handleHover = useCallback((data: ChipData | null) => setHoveredChip(data), [])

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={11}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <TractChoroplethLayer tracts={tracts} stateFips={stateFips} onHoverChange={handleHover} />
        </Map>
      </APIProvider>

      {/* Info chip — always visible, shows parent by default */}
      <div className="absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md pointer-events-none">
        <p className="text-sm font-bold text-[#1a1a1a]">{chip.title}</p>
        <p className="text-[10px] text-[#666]">{fmtNum(chip.buildings)} qualified buildings</p>
      </div>

      {/* Legend — top left, no header */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#999] mb-1.5">Qualified Bldgs.</p>
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
