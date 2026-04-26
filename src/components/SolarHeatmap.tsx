'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import type { HeatmapPoint } from '@/lib/queries'

// Project Sunroof color ramp: transparent → pale yellow → orange → deep red
const HEATMAP_GRADIENT = [
  'rgba(0, 0, 0, 0)',
  'rgba(255, 237, 160, 0.6)',
  'rgba(254, 217, 118, 0.7)',
  'rgba(254, 178, 76, 0.8)',
  'rgba(253, 141, 60, 0.85)',
  'rgba(252, 78, 42, 0.9)',
  'rgba(227, 26, 28, 0.95)',
  'rgba(189, 0, 38, 1)',
]

interface SolarHeatmapProps {
  points: HeatmapPoint[]
  visible?: boolean
}

export function SolarHeatmap({ points, visible = true }: SolarHeatmapProps) {
  const map = useMap()
  const layerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  useEffect(() => {
    if (!map) return
    if (!window.google?.maps?.visualization?.HeatmapLayer) return

    const data = points.map(p => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.weight,
    }))

    if (!layerRef.current) {
      layerRef.current = new google.maps.visualization.HeatmapLayer({
        data,
        map: visible ? map : null,
        gradient: HEATMAP_GRADIENT,
        radius: 30, // TODO: tune after visual review — state-level needs larger radius than ZIP-level
        dissipating: true,
        opacity: 0.7,
      })
    } else {
      layerRef.current.setData(data)
      layerRef.current.setMap(visible ? map : null)
    }

    return () => {
      layerRef.current?.setMap(null)
    }
  }, [map, points, visible])

  return null
}
