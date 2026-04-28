'use client'

import { useEffect, useRef, useState } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CountyMapEntry, StateMapEntry } from '@/lib/queries'
import { fmtNum, fmtUsd } from '@/lib/utils'

type ChipData = { name: string; value: number; buildings: number }

const STATES_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
const COUNTIES_URL = 'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'
const ZOOM_THRESHOLD = 6

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

function stateColor(v: number): string {
  if (v >= 15_000_000_000) return '#92400e'
  if (v >= 8_000_000_000)  return '#b45309'
  if (v >= 4_000_000_000)  return '#d97706'
  if (v >= 1_500_000_000)  return '#f59e0b'
  if (v >= 500_000_000)    return '#fbbf24'
  return '#fef3c7'
}

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }, { visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

const COUNTY_LEGEND = [
  { color: '#92400e', label: '$1B+' },
  { color: '#b45309', label: '$500M – $1B' },
  { color: '#d97706', label: '$200M – $500M' },
  { color: '#f59e0b', label: '$50M – $200M' },
  { color: '#fbbf24', label: '$10M – $50M' },
  { color: '#fef3c7', label: '< $10M' },
]

function DualChoroplethLayer({ counties, states, onHoverChange }: { counties: CountyMapEntry[]; states: StateMapEntry[]; onHoverChange: (d: ChipData | null) => void }) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)
  const stateLayerRef = useRef<google.maps.Data | null>(null)
  const countiesReadyRef = useRef(false)
  const lastHoveredNameRef = useRef<string | null>(null)
  const currentHoveredRef = useRef<string | null>(null)
  const refreshStyleRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const countyLookup: Record<string, CountyMapEntry> = {}
    for (const c of counties) { if (c.fips) countyLookup[c.fips] = c }
    const stateLookup: Record<string, StateMapEntry> = {}
    for (const s of states) { stateLookup[s.name] = s }

    const isHigh = () => (map.getZoom() ?? 4) > ZOOM_THRESHOLD

    // Recompute the state layer style in one place
    const refreshStateStyle = () => {
      const high = isHigh()
      stateLayerRef.current?.setStyle((feature: google.maps.Data.Feature) => {
        const name = feature.getProperty('name') as string
        const isLast = name === lastHoveredNameRef.current
        const isCurr = name === currentHoveredRef.current

        if (high) {
          return {
            fillOpacity: 0,
            strokeColor: (isLast || isCurr) ? '#f59e0b' : '#d1d5db',
            strokeWeight: (isLast || isCurr) ? 2.5 : 0.8,
            strokeOpacity: (isLast || isCurr) ? 1 : 0.5,
            clickable: false,
          }
        }
        const s = stateLookup[name]
        return {
          fillColor: s ? stateColor(s.untapped_annual_value_usd) : '#e5e7eb',
          fillOpacity: isCurr ? 0.92 : 0.75,
          strokeColor: isCurr ? '#f59e0b' : '#ffffff',
          strokeWeight: isCurr ? 2.5 : 0.8,
          strokeOpacity: 0.9,
          clickable: true,
        }
      })
    }

    const applyCountyStyle = () => {
      if (!countiesReadyRef.current) return
      const high = isHigh()
      map.data.setStyle((feature: google.maps.Data.Feature) => {
        if (!high) return { visible: false }
        const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
        const c = countyLookup[fips]
        return {
          fillColor: c ? countyColor(c.untapped_annual_value_usd) : '#e5e7eb',
          fillOpacity: c ? 0.75 : 0.15,
          strokeColor: '#ffffff', strokeWeight: 0.4, strokeOpacity: 0.8,
        }
      })
    }

    refreshStyleRef.current = refreshStateStyle

    const applyZoom = () => {
      refreshStateStyle()
      applyCountyStyle()
    }

    // ── State layer ──
    const stateLayer = new google.maps.Data()
    stateLayerRef.current = stateLayer

    fetch(STATES_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        stateLayer.addGeoJson(geojson)
        refreshStateStyle()
        stateLayer.setMap(map)

        stateLayer.addListener('click', (e: google.maps.Data.MouseEvent) => {
          if (isHigh()) return
          const name = e.feature.getProperty('name') as string
          if (name) router.push(`/states/${nameToSlug(name)}`)
        })
        stateLayer.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const name = e.feature.getProperty('name') as string
          lastHoveredNameRef.current = name
          currentHoveredRef.current = name
          refreshStateStyle()
          const s = stateLookup[name]
          onHoverChange(s ? { name, value: s.untapped_annual_value_usd, buildings: s.count_qualified } : null)
        })
        stateLayer.addListener('mouseout', () => {
          currentHoveredRef.current = null
          refreshStateStyle()
          onHoverChange(null)
        })
      })

    // ── County layer ──
    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        map.data.addGeoJson(geojson)
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const c = countyLookup[fips]
          if (c) router.push(`/counties/${nameToSlug(c.state_name)}/${nameToSlug(c.region_name)}`)
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: '#f59e0b', fillOpacity: 0.95 })
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const c = countyLookup[fips]
          onHoverChange(c ? { name: c.region_name, value: c.untapped_annual_value_usd, buildings: c.count_qualified } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        countiesReadyRef.current = true
        applyCountyStyle()
      })

    const zoomListener = map.addListener('zoom_changed', applyZoom)
    return () => {
      zoomListener.remove()
      stateLayerRef.current?.setMap(null)
    }
  }, [map, counties, states, router, onHoverChange])

  // Listen for state highlight/zoom events from external components (e.g. state cards)
  useEffect(() => {
    const handleHighlight = (e: Event) => {
      const name = (e as CustomEvent<{ name: string | null }>).detail.name
      lastHoveredNameRef.current = name
      currentHoveredRef.current = name
      refreshStyleRef.current?.()
    }
    const handleZoom = (e: Event) => {
      const { name, bounds } = (e as CustomEvent<{ name: string; bounds: { north: number; south: number; east: number; west: number } }>).detail
      lastHoveredNameRef.current = name
      currentHoveredRef.current = name
      refreshStyleRef.current?.()
      if (map) map.fitBounds(bounds, 80)
    }
    window.addEventListener('solargpt:state-highlight', handleHighlight)
    window.addEventListener('solargpt:state-zoom', handleZoom)
    return () => {
      window.removeEventListener('solargpt:state-highlight', handleHighlight)
      window.removeEventListener('solargpt:state-zoom', handleZoom)
    }
  }, [map])

  return null
}

export default function CountyChoropleth({ counties, states }: { counties: CountyMapEntry[]; states: StateMapEntry[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hoveredInfo, setHoveredInfo] = useState<ChipData | null>(null)

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
          <DualChoroplethLayer counties={counties} states={states} onHoverChange={setHoveredInfo} />
        </Map>
      </APIProvider>

      {/* Hover chip */}
      <div className={`absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md pointer-events-none transition-opacity duration-150 ${hoveredInfo ? 'opacity-100' : 'opacity-0'}`}>
        {hoveredInfo && (
          <>
            <p className="text-sm font-bold text-[#1a1a1a]">{hoveredInfo.name}</p>
            <p className="text-xs font-semibold text-[#f59e0b]">{fmtUsd(hoveredInfo.value)} potential/yr</p>
            <p className="text-[10px] text-[#666]">{fmtNum(hoveredInfo.buildings)} qualified buildings</p>
          </>
        )}
      </div>

      {/* Legend — top left, no header */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        {COUNTY_LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
            <span className="text-[10px] text-[var(--txt)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
