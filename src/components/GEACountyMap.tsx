'use client'

import { useEffect, useRef, useState } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { CambiumCountyMapEntry, CambiumCountyNameEntry } from '@/lib/queries'
import { GEA_COLORS } from '@/lib/gea-colors'
import { fmtUsd } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

type SunroofCounty = { fips?: string; untapped_annual_value_usd: number }

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

type Bounds = { north: number; south: number; east: number; west: number }
type HoverInfo = { name: string; state: string; value: number | null }

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function countyPageUrl(countyName: string, stateName: string): string {
  // county_name from raw_cambium_county_mapping is bare (e.g. "Suffolk")
  // county pages use the full name slug (e.g. "suffolk-county")
  return `/counties/${nameToSlug(stateName)}/${nameToSlug(countyName + ' County')}`
}

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 40)
  }, [map, bounds])
  return null
}

function CountyLayer({
  cambiumCounties, geaCounties, sunroofCounties, focusGea, onHoverChange,
}: {
  cambiumCounties: CambiumCountyMapEntry[]
  geaCounties: CambiumCountyNameEntry[]      // all counties in this GEA with names
  sunroofCounties: SunroofCounty[]            // counties with Sunroof value data
  focusGea: string
  onHoverChange: (d: HoverInfo | null) => void
}) {
  const map = useMap()
  const router = useRouter()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!map || loadedRef.current) return
    loadedRef.current = true

    // FIPS → GEA color
    const fipsToGea: Record<string, string> = {}
    for (const c of cambiumCounties) fipsToGea[c.fips] = c.cambium_gea

    // FIPS → county name info (for routing)
    const fipsToName: Record<string, { county_name: string; state_name: string }> = {}
    for (const c of geaCounties) fipsToName[c.fips] = { county_name: c.county_name, state_name: c.state_name }

    // FIPS → Sunroof value (for hover chip)
    const fipsToValue: Record<string, number> = {}
    for (const c of sunroofCounties) {
      if (c.fips) fipsToValue[c.fips] = c.untapped_annual_value_usd
    }

    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        map.data.addGeoJson(geojson)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGea[fips]
          const color = gea ? (GEA_COLORS[gea] ?? '#e5e7eb') : '#e5e7eb'
          const isFocus = gea === focusGea
          return {
            fillColor: color,
            fillOpacity: isFocus ? 0.78 : (gea ? 0.12 : 0.04),
            strokeColor: '#374151',
            strokeWeight: isFocus ? 0.5 : 0.15,
            strokeOpacity: isFocus ? 0.6 : 0.2,
            clickable: isFocus,
            cursor: isFocus ? 'pointer' : 'default',
          }
        })

        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const gea = fipsToGea[fips]
          if (gea !== focusGea) return
          map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: '#111827', fillOpacity: 0.95 })
          const info = fipsToName[fips]
          if (info) onHoverChange({ name: info.county_name + ' County', state: info.state_name, value: fipsToValue[fips] ?? null })
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const info = fipsToName[fips]
          if (info) router.push(countyPageUrl(info.county_name, info.state_name))
        })
      })
  }, [map, cambiumCounties, geaCounties, sunroofCounties, focusGea, onHoverChange, router])

  return null
}

export default function GEACountyMap({
  cambiumCounties,
  geaCounties,
  sunroofCounties,
  focusGea,
  bounds,
  className = 'h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-sm',
}: {
  cambiumCounties: CambiumCountyMapEntry[]
  geaCounties: CambiumCountyNameEntry[]
  sunroofCounties: SunroofCounty[]
  focusGea: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
  const [hovered, setHovered] = useState<HoverInfo | null>(null)
  const isMobile = useIsMobile()

  return (
    <div className={`relative ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={isMobile ? 3 : 4}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <CountyLayer
            cambiumCounties={cambiumCounties}
            geaCounties={geaCounties}
            sunroofCounties={sunroofCounties}
            focusGea={focusGea}
            onHoverChange={setHovered}
          />
        </Map>
      </APIProvider>

      {/* Hover chip */}
      <div className={`absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md pointer-events-none transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        {hovered && (
          <>
            <p className="text-sm font-bold text-[#1a1a1a]">{hovered.name}</p>
            <p className="text-[10px] text-[#666]">{hovered.state}</p>
            {hovered.value != null && (
              <p className="text-xs font-semibold text-solar mt-0.5">{fmtUsd(hovered.value)} potential/yr</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
