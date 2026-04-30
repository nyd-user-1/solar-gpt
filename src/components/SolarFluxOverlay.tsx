'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

export type BoundingBox = {
  sw: { latitude: number; longitude: number }
  ne: { latitude: number; longitude: number }
}

// Color ramp: blue → purple → red → orange → yellow-white
// Matches the Google Solar API demo aesthetic
function fluxColor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.00, [10,  10,  200]],
    [0.20, [120, 0,   220]],
    [0.45, [230, 20,  80]],
    [0.70, [255, 130, 0]],
    [0.85, [255, 210, 30]],
    [1.00, [255, 255, 180]],
  ]
  const clamped = Math.max(0, Math.min(1, t))
  for (let i = 1; i < stops.length; i++) {
    if (clamped <= stops[i][0]) {
      const lo = stops[i - 1]
      const hi = stops[i]
      const f = (clamped - lo[0]) / (hi[0] - lo[0])
      return [
        Math.round(lo[1][0] + f * (hi[1][0] - lo[1][0])),
        Math.round(lo[1][1] + f * (hi[1][1] - lo[1][1])),
        Math.round(lo[1][2] + f * (hi[1][2] - lo[1][2])),
      ]
    }
  }
  return [255, 255, 180]
}

interface Props {
  annualFluxUrl: string
  boundingBox: BoundingBox
  opacity?: number
}

export function SolarFluxOverlay({ annualFluxUrl, boundingBox, opacity = 0.85 }: Props) {
  const map = useMap()
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  useEffect(() => {
    console.log('[SolarFlux] effect fired', { hasMap: !!map, hasUrl: !!annualFluxUrl, hasBbox: !!boundingBox })
    if (!map || !annualFluxUrl || !boundingBox) return

    // Proxy through our own API to avoid CORS on solar.googleapis.com GeoTIFF requests
    const fetchUrl = `/api/solar-geotiff?url=${encodeURIComponent(annualFluxUrl)}`

    let cancelled = false

    async function load() {
      try {
        console.log('[SolarFlux] load() started, fetching:', fetchUrl.slice(0, 80))
        const { fromArrayBuffer } = await import('geotiff')
        console.log('[SolarFlux] geotiff imported, fromArrayBuffer type:', typeof fromArrayBuffer)

        const res = await fetch(fetchUrl)
        console.log('[SolarFlux] fetch response:', res.status, res.headers.get('content-type'))
        if (!res.ok || cancelled) {
          console.warn('[SolarFlux] proxy fetch failed:', res.status)
          return
        }
        const buf = await res.arrayBuffer()
        console.log('[SolarFlux] buffer bytes:', buf.byteLength)
        if (cancelled) return

        const tiff = await fromArrayBuffer(buf)
        const image = await tiff.getImage()
        console.log('[SolarFlux] tiff size:', image.getWidth(), 'x', image.getHeight())
        const rasters = await image.readRasters()
        if (cancelled) return

        const raster = rasters[0] as Float32Array
        const w = image.getWidth()
        const h = image.getHeight()

        // Compute valid data range (nodata = -9999)
        let min = Infinity
        let max = -Infinity
        for (let i = 0; i < raster.length; i++) {
          const v = raster[i]
          if (v > -9000 && isFinite(v)) {
            if (v < min) min = v
            if (v > max) max = v
          }
        }
        if (!isFinite(min)) return // no valid pixels

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(w, h)

        const range = max - min || 1
        for (let i = 0; i < raster.length; i++) {
          const v = raster[i]
          const base = i * 4
          if (v <= -9000 || !isFinite(v)) {
            imgData.data[base + 3] = 0 // transparent nodata
          } else {
            const [r, g, b] = fluxColor((v - min) / range)
            imgData.data[base]     = r
            imgData.data[base + 1] = g
            imgData.data[base + 2] = b
            imgData.data[base + 3] = 210
          }
        }
        ctx.putImageData(imgData, 0, 0)

        if (cancelled) return

        const bounds = {
          north: boundingBox.ne.latitude,
          south: boundingBox.sw.latitude,
          east: boundingBox.ne.longitude,
          west: boundingBox.sw.longitude,
        }

        overlayRef.current?.setMap(null)
        overlayRef.current = new google.maps.GroundOverlay(
          canvas.toDataURL('image/png'),
          bounds,
          { opacity }
        )
        overlayRef.current.setMap(map)
        console.log('[SolarFlux] overlay rendered', w, 'x', h, 'pixels, range:', min.toFixed(0), '-', max.toFixed(0), 'kWh/kW/yr')
      } catch (err) {
        console.warn('[SolarFlux] overlay error:', err)
      }
    }

    load()
    return () => {
      cancelled = true
      overlayRef.current?.setMap(null)
      overlayRef.current = null
    }
  }, [map, annualFluxUrl, boundingBox, opacity])

  return null
}
