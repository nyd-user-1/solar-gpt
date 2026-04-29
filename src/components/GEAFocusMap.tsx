'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { CambiumCountyMapEntry } from '@/lib/queries'
import { GEA_COLORS } from '@/lib/gea-colors'

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

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 40)
  }, [map, bounds])
  return null
}

function CountyLayer({ cambiumCounties, focusGea }: { cambiumCounties: CambiumCountyMapEntry[]; focusGea: string }) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const fipsToGea: Record<string, string> = {}
    for (const c of cambiumCounties) fipsToGea[c.fips] = c.cambium_gea

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
            strokeWeight: isFocus ? 0.45 : 0.15,
            strokeOpacity: isFocus ? 0.55 : 0.2,
            clickable: false,
          }
        })
      })
  }, [map, cambiumCounties, focusGea])

  return null
}

export default function GEAFocusMap({
  cambiumCounties,
  focusGea,
  bounds,
  className = 'h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-sm',
}: {
  cambiumCounties: CambiumCountyMapEntry[]
  focusGea: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }

  return (
    <div className={className}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={4}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <CountyLayer cambiumCounties={cambiumCounties} focusGea={focusGea} />
        </Map>
      </APIProvider>
    </div>
  )
}
