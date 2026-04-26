'use client'

import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { useEffect } from 'react'

type Bounds = { north: number; south: number; east: number; west: number }

export type MapMarker = {
  position: { lat: number; lng: number }
  label: string
}

type RegionMapProps = {
  bounds?: Bounds
  center: { lat: number; lng: number }
  markers?: MapMarker[]
  mapTypeId?: 'satellite' | 'hybrid' | 'roadmap' | 'terrain'
  className?: string
}

function FitBounds({ bounds }: { bounds?: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !bounds) return
    map.fitBounds(bounds)
  }, [map, bounds])
  return null
}

export function RegionMap({
  bounds,
  center,
  markers = [],
  mapTypeId = 'hybrid',
  className = '',
}: RegionMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] ${className}`}>
        <p className="text-sm text-[var(--muted)]">Map unavailable — configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={8}
          mapId="solargpt-region"
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          {markers.map((m, i) => (
            <AdvancedMarker key={i} position={m.position} title={m.label} />
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}
