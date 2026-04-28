'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'

const STATES_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
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

function GEAStateLayer({ stateNames, highlightColor = '#f59e0b' }: { stateNames: string[]; highlightColor?: string }) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const nameSet = new Set(stateNames)

    fetch(STATES_URL)
      .then(r => r.json())
      .then((geojson: object) => {
        map.data.addGeoJson(geojson)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const name = feature.getProperty('name') as string
          const inGea = nameSet.has(name)
          return {
            fillColor: inGea ? highlightColor : '#e2e8f0',
            fillOpacity: inGea ? 0.6 : 0.3,
            strokeColor: inGea ? highlightColor : '#cbd5e1',
            strokeWeight: inGea ? 1.2 : 0.5,
            strokeOpacity: 1,
            clickable: false,
          }
        })
      })
  }, [map, stateNames])

  return null
}

export default function GEAMiniMap({
  stateNames,
  bounds,
  highlightColor,
  className = 'absolute inset-0',
}: {
  stateNames: string[]
  bounds: Bounds
  highlightColor?: string
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
          gestureHandling="none"
          disableDefaultUI
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <GEAStateLayer stateNames={stateNames} highlightColor={highlightColor} />
        </Map>
      </APIProvider>
    </div>
  )
}
