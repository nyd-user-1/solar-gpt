'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CountyMapEntry, GeaKpi } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'

// Matches roughly the Cambium GEA color scheme
const GEA_COLORS: Record<string, string> = {
  'CAISO':              '#ef4444',
  'ERCOT':              '#84cc16',
  'FRCC':               '#06b6d4',
  'ISONE':              '#60a5fa',
  'MISO_Central':       '#10b981',
  'MISO_North':         '#9ca3af',
  'MISO_South':         '#c084fc',
  'NYISO':              '#3b82f6',
  'NorthernGrid_East':  '#f97316',
  'NorthernGrid_West':  '#78716c',
  'PJM_East':           '#facc15',
  'PJM_West':           '#fb923c',
  'SERTP':              '#f87171',
  'SPP_N':              '#0891b2',
  'SPP_S':              '#22d3ee',
  'WestConnect_N':      '#a855f7',
  'WestConnect_S':      '#7c3aed',
}

const COUNTIES_URL = 'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }, { visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

type ChipData = { name: string; value: number; buildings: number }


function GEAChoroplethLayer({
  counties, geaKpisMap, onHoverChange,
}: {
  counties: CountyMapEntry[]
  geaKpisMap: Record<string, GeaKpi>
  onHoverChange: (d: ChipData | null) => void
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const fipsToGea: Record<string, string> = {}
    for (const c of counties) {
      if (c.fips && c.cambium_gea) fipsToGea[c.fips] = c.cambium_gea
    }

    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        map.data.addGeoJson(geojson)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGea[fips]
          const color = gea ? (GEA_COLORS[gea] ?? '#e5e7eb') : '#e5e7eb'
          return {
            fillColor: color,
            fillOpacity: gea ? 0.7 : 0.1,
            strokeColor: '#ffffff',
            strokeWeight: 0.3,
            strokeOpacity: 0.6,
          }
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 1.5, strokeColor: '#1f2937', fillOpacity: 0.9 })
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGea[fips]
          const kpi = gea ? geaKpisMap[gea] : null
          onHoverChange(kpi ? { name: gea.replace(/_/g, ' '), value: kpi.untapped_annual_value_usd, buildings: kpi.count_qualified } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGea[fips]
          if (gea) router.push(`/gea-regions/${geaToSlug(gea)}`)
        })
      })
  }, [map, counties, geaKpisMap, onHoverChange, router])

  return null
}

export default function GEAChoropleth({
  counties,
  geaKpis,
}: {
  counties: CountyMapEntry[]
  geaKpis: GeaKpi[]
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hoveredInfo, setHoveredInfo] = useState<ChipData | null>(null)

  const geaKpisMap = useMemo(() => {
    const m: Record<string, GeaKpi> = {}
    for (const g of geaKpis) m[g.cambium_gea] = g
    return m
  }, [geaKpis])

  const usDefault = useMemo<ChipData>(() => ({
    name: 'US Grid Regions',
    value: geaKpis.reduce((s, g) => s + g.untapped_annual_value_usd, 0),
    buildings: geaKpis.reduce((s, g) => s + g.count_qualified, 0),
  }), [geaKpis])

  const chip = hoveredInfo ?? usDefault

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
          <GEAChoroplethLayer counties={counties} geaKpisMap={geaKpisMap} onHoverChange={setHoveredInfo} />
        </Map>
      </APIProvider>

      {/* Info chip */}
      <div className="absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md pointer-events-none">
        <p className="text-sm font-bold text-[#1a1a1a]">{chip.name}</p>
        <p className="text-xs font-semibold text-[#f59e0b]">{fmtUsd(chip.value)} potential/yr</p>
        <p className="text-[10px] text-[#666]">{fmtNum(chip.buildings)} qualified buildings</p>
      </div>

      {/* GEA color legend */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none max-h-[60%] overflow-hidden">
        {Object.entries(GEA_COLORS).map(([gea, color]) => (
          <div key={gea} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
            <span className="text-[10px] text-[#333]">{gea.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
