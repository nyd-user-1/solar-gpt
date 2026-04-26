'use client'

import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { SolarHeatmap } from '@/components/SolarHeatmap'
import type { HeatmapPoint } from '@/lib/queries'

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
  heatmapPoints?: HeatmapPoint[]
}

function FitBounds({ bounds }: { bounds?: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !bounds) return
    map.fitBounds(bounds)
  }, [map, bounds])
  return null
}

function HeatmapToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-colors ${
        visible
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span>☀</span>
      {visible ? 'Heatmap On' : 'Heatmap Off'}
    </button>
  )
}

export function RegionMap({
  bounds,
  center,
  markers = [],
  mapTypeId = 'hybrid',
  className = '',
  heatmapPoints,
}: RegionMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [heatmapVisible, setHeatmapVisible] = useState(true)
  const hasHeatmap = heatmapPoints && heatmapPoints.length > 0

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] ${className}`}>
        <p className="text-sm text-[var(--muted)]">Map unavailable — configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <APIProvider apiKey={apiKey} libraries={['visualization']}>
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
          {hasHeatmap && (
            <SolarHeatmap points={heatmapPoints} visible={heatmapVisible} />
          )}
        </Map>
        {hasHeatmap && (
          <HeatmapToggle visible={heatmapVisible} onToggle={() => setHeatmapVisible(v => !v)} />
        )}
      </APIProvider>
    </div>
  )
}
