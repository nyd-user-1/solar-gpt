'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CountyMapEntry, GeaKpi, CambiumCountyMapEntry } from '@/lib/queries'
import { fmtUsd, fmtUsdFull, fmtNum } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import { GEA_COLORS, getGeaColor } from '@/lib/gea-colors'
import { GEADrawer } from '@/components/GEADrawer'

const COUNTIES_URL = 'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'
const STATES_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }, { visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

type ChipData = { name: string; value: number; buildings: number; color?: string }

function GEAStateChoroplethLayer({
  counties, geaKpisMap, onHoverChange, stateGeaMap,
}: {
  counties: CountyMapEntry[]
  geaKpisMap: Record<string, GeaKpi>
  onHoverChange: (d: ChipData | null) => void
  stateGeaMap?: Record<string, string>
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    let stateDominantGea: Record<string, string>
    if (stateGeaMap && Object.keys(stateGeaMap).length > 0) {
      stateDominantGea = stateGeaMap
    } else {
      const stateGeaCount: Record<string, Record<string, number>> = {}
      for (const c of counties) {
        if (!c.cambium_gea || !c.state_name) continue
        if (!stateGeaCount[c.state_name]) stateGeaCount[c.state_name] = {}
        stateGeaCount[c.state_name][c.cambium_gea] = (stateGeaCount[c.state_name][c.cambium_gea] ?? 0) + 1
      }
      stateDominantGea = {}
      for (const [state, geaCounts] of Object.entries(stateGeaCount)) {
        stateDominantGea[state] = Object.entries(geaCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      }
    }

    fetch(STATES_URL)
      .then(r => r.json())
      .then((geojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        map.data.addGeoJson(geojson)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const name = feature.getProperty('name') as string
          const gea = stateDominantGea[name]
          const color = gea ? (GEA_COLORS[gea] ?? '#e5e7eb') : '#e5e7eb'
          return {
            fillColor: color, fillOpacity: gea ? 0.72 : 0.15,
            strokeColor: '#ffffff', strokeWeight: 1, strokeOpacity: 0.8,
          }
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#1f2937', fillOpacity: 0.92 })
          const name = e.feature.getProperty('name') as string
          const gea = stateDominantGea[name]
          const kpi = gea ? geaKpisMap[gea] : null
          onHoverChange(kpi ? { name: gea.replace(/_/g, ' '), value: kpi.untapped_annual_value_usd, buildings: kpi.count_qualified } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const name = e.feature.getProperty('name') as string
          const gea = stateDominantGea[name]
          if (gea) router.push(`/gea-regions/${geaToSlug(gea)}`)
        })
      })
  }, [map, counties, geaKpisMap, onHoverChange, router])

  return null
}

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
            strokeColor: '#374151',
            strokeWeight: 0.4,
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

// Full-coverage Cambium county layer — separate load + style effects so hoveredGea can re-style
function GEACambiumCountyLayer({
  cambiumCounties, geaKpisMap, onHoverChange, hoveredGea,
}: {
  cambiumCounties: CambiumCountyMapEntry[]
  geaKpisMap: Record<string, GeaKpi>
  onHoverChange: (d: ChipData | null) => void
  hoveredGea: string | null
}) {
  const map = useMap()
  const router = useRouter()
  const loadedRef = useRef(false)
  const fipsToGeaRef = useRef<Record<string, string>>({})
  const [dataLoaded, setDataLoaded] = useState(false)
  const onHoverRef = useRef(onHoverChange)
  onHoverRef.current = onHoverChange
  const geaKpisMapRef = useRef(geaKpisMap)
  geaKpisMapRef.current = geaKpisMap

  // Load GeoJSON and wire listeners once
  useEffect(() => {
    if (!map || loadedRef.current) return
    loadedRef.current = true

    const fipsToGea: Record<string, string> = {}
    for (const c of cambiumCounties) fipsToGea[c.fips] = c.cambium_gea
    fipsToGeaRef.current = fipsToGea

    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        map.data.addGeoJson(geojson)
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 1.8, strokeColor: '#111827', fillOpacity: 0.92 })
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGeaRef.current[fips]
          const kpi = gea ? geaKpisMapRef.current[gea] : null
          onHoverRef.current(kpi ? { name: gea.replace(/_/g, ' '), value: kpi.untapped_annual_value_usd, buildings: kpi.count_qualified, color: GEA_COLORS[gea] } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverRef.current(null)
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGeaRef.current[fips]
          if (gea) router.push(`/gea-regions/${geaToSlug(gea)}`)
        })
        setDataLoaded(true)
      })
  }, [map, cambiumCounties, router])

  // Re-style whenever hoveredGea changes (or data first loads)
  useEffect(() => {
    if (!map || !dataLoaded) return
    const fipsToGea = fipsToGeaRef.current
    map.data.setStyle((feature: google.maps.Data.Feature) => {
      const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
      const gea = fipsToGea[fips]
      const color = gea ? (GEA_COLORS[gea] ?? '#e5e7eb') : '#e5e7eb'
      const dimmed = hoveredGea !== null && gea !== hoveredGea
      return {
        fillColor: color,
        fillOpacity: gea ? (dimmed ? 0.12 : 0.72) : 0.08,
        strokeColor: '#374151',
        strokeWeight: dimmed ? 0.15 : 0.4,
        strokeOpacity: dimmed ? 0.2 : 0.55,
        clickable: true,
      }
    })
  }, [map, dataLoaded, hoveredGea])

  return null
}

export default function GEAChoropleth({
  counties = [],
  cambiumCounties,
  geaKpis,
  mode = 'county',
  stateGeaMap,
  className = 'w-full h-[480px] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
}: {
  counties?: CountyMapEntry[]
  cambiumCounties?: CambiumCountyMapEntry[]
  geaKpis: GeaKpi[]
  mode?: 'county' | 'state' | 'cambium'
  stateGeaMap?: Record<string, string>
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hoveredInfo, setHoveredInfo] = useState<ChipData | null>(null)
  const [legendHoveredGea, setLegendHoveredGea] = useState<string | null>(null)
  const [selectedGea, setSelectedGea] = useState<string | null>(null)

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

  const legendChip = legendHoveredGea && geaKpisMap[legendHoveredGea]
    ? {
        name: legendHoveredGea.replace(/_/g, ' '),
        value: geaKpisMap[legendHoveredGea].untapped_annual_value_usd,
        buildings: geaKpisMap[legendHoveredGea].count_qualified,
        color: getGeaColor(legendHoveredGea),
      }
    : null

  const chip = legendChip ?? hoveredInfo ?? usDefault
  const chipColor = chip.color ?? '#f59e0b'

  return (
    <>
      <GEADrawer gea={selectedGea} onClose={() => setSelectedGea(null)} />
      <div className={`relative ${className}`}>
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
            {mode === 'cambium' && cambiumCounties
              ? <GEACambiumCountyLayer cambiumCounties={cambiumCounties} geaKpisMap={geaKpisMap} onHoverChange={setHoveredInfo} hoveredGea={legendHoveredGea} />
              : mode === 'state'
              ? <GEAStateChoroplethLayer counties={counties} geaKpisMap={geaKpisMap} onHoverChange={setHoveredInfo} stateGeaMap={stateGeaMap} />
              : <GEAChoroplethLayer counties={counties} geaKpisMap={geaKpisMap} onHoverChange={setHoveredInfo} />
            }
          </Map>
        </APIProvider>

        {/* Legend + info chip — stacked top-left panel */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-auto">
          {/* Legend */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 pt-2 pb-2 shadow-sm min-w-[290px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#999] mb-2">Grid Regions</p>
            <div className="grid grid-cols-2 gap-x-4">
              {Object.entries(GEA_COLORS).map(([gea, color]) => (
                <div
                  key={gea}
                  className={`flex items-center gap-1.5 py-[3px] px-1 rounded-md cursor-pointer transition-colors select-none ${
                    legendHoveredGea === gea ? 'bg-black/8' : 'hover:bg-black/5'
                  }`}
                  onMouseEnter={() => setLegendHoveredGea(gea)}
                  onMouseLeave={() => setLegendHoveredGea(null)}
                  onClick={() => setSelectedGea(gea)}
                >
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/15" style={{ background: color }} />
                  <span className={`text-[10px] whitespace-nowrap transition-colors ${legendHoveredGea === gea ? 'text-[#111] font-semibold' : 'text-[#444]'}`}>
                    {gea.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info chip — full width of legend */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md pointer-events-none">
            <p className="text-[12px] font-bold text-[#1a1a1a] leading-tight">{chip.name}</p>
            <p className="text-[26px] font-bold tabular-nums leading-none mt-1" style={{ color: chipColor }}>{fmtUsdFull(chip.value)}</p>
            <p className="text-[10px] text-[#999] mt-0.5 leading-none">potential/yr</p>
            <p className="text-[11px] text-[#666] mt-2">{fmtNum(chip.buildings)} qualified buildings</p>
          </div>
        </div>
      </div>
    </>
  )
}
