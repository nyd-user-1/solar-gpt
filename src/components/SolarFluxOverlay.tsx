'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

// Color ramp: blue → purple → red → orange → yellow-white
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
  maskUrl?: string
  opacity?: number
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

export function SolarFluxOverlay({ annualFluxUrl, maskUrl, opacity = 0.85 }: Props) {
  const map = useMap()
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  useEffect(() => {
    if (!map || !annualFluxUrl) return

    const directUrl = annualFluxUrl.includes('key=') ? annualFluxUrl : `${annualFluxUrl}&key=${MAPS_KEY}`
    const directMaskUrl = maskUrl
      ? (maskUrl.includes('key=') ? maskUrl : `${maskUrl}&key=${MAPS_KEY}`)
      : null

    let cancelled = false

    async function load() {
      try {
        console.log('[SolarFlux] downloading flux' + (directMaskUrl ? ' + mask' : ''))
        const [{ fromArrayBuffer }, geokeysToProj4Mod, proj4Mod] = await Promise.all([
          import('geotiff'),
          import('geotiff-geokeys-to-proj4'),
          import('proj4'),
        ])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geokeysToProj4 = (geokeysToProj4Mod as any).default ?? geokeysToProj4Mod
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proj4 = (proj4Mod as any).default ?? proj4Mod

        // Fetch flux and mask in parallel
        const [fluxRes, maskRes] = await Promise.all([
          fetch(directUrl),
          directMaskUrl ? fetch(directMaskUrl) : Promise.resolve(null),
        ])
        if (!fluxRes.ok || cancelled) { console.warn('[SolarFlux] flux fetch failed:', fluxRes.status); return }
        const [fluxBuf, maskBuf] = await Promise.all([
          fluxRes.arrayBuffer(),
          maskRes?.ok ? maskRes.arrayBuffer() : Promise.resolve(null),
        ])
        if (cancelled) return

        // Decode flux
        const tiff = await fromArrayBuffer(fluxBuf)
        const image = await tiff.getImage()

        // Reproject bounding box from GeoTIFF's native CRS (may be UTM) to WGS84
        const geoKeys = image.getGeoKeys()
        const projObj = geokeysToProj4.toProj4(geoKeys)
        const projection = proj4(projObj.proj4, 'WGS84')
        const box = image.getBoundingBox()
        const sw = projection.forward({
          x: box[0] * projObj.coordinatesConversionParameters.x,
          y: box[1] * projObj.coordinatesConversionParameters.y,
        })
        const ne = projection.forward({
          x: box[2] * projObj.coordinatesConversionParameters.x,
          y: box[3] * projObj.coordinatesConversionParameters.y,
        })

        const rasters = await image.readRasters()
        const raster = rasters[0] as Float32Array
        const w = image.getWidth()
        const h = image.getHeight()

        // Decode mask (1-bit: 0=not roof, 1=roof)
        let maskRaster: ArrayLike<number> | null = null
        if (maskBuf) {
          const maskTiff = await fromArrayBuffer(maskBuf)
          const maskImage = await maskTiff.getImage()
          const maskRasters = await maskImage.readRasters()
          maskRaster = maskRasters[0] as Uint8Array
        }
        if (cancelled) return

        let min = Infinity, max = -Infinity
        for (let i = 0; i < raster.length; i++) {
          const v = raster[i]
          if (v > -9000 && isFinite(v)) {
            if (v < min) min = v
            if (v > max) max = v
          }
        }
        if (!isFinite(min)) { console.warn('[SolarFlux] no valid pixels'); return }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(w, h)

        const range = max - min || 1
        for (let i = 0; i < raster.length; i++) {
          const v = raster[i]
          const base = i * 4
          // Mask: 1=roof (opaque), 0=not roof (transparent) — matches reference app renderRGB
          const alpha = maskRaster ? maskRaster[i] * 255 : 210
          if (v <= -9000 || !isFinite(v) || alpha === 0) {
            imgData.data[base + 3] = 0
          } else {
            const [r, g, b] = fluxColor((v - min) / range)
            imgData.data[base]     = r
            imgData.data[base + 1] = g
            imgData.data[base + 2] = b
            imgData.data[base + 3] = alpha
          }
        }
        ctx.putImageData(imgData, 0, 0)
        if (cancelled) return

        console.log('[SolarFlux] rendered', w, 'x', h, 'px | mask:', !!maskRaster, '| range:', min.toFixed(0), '-', max.toFixed(0), 'kWh/kW/yr')
        const bounds = { north: ne.y, south: sw.y, east: ne.x, west: sw.x }

        // Use blob URL — faster than toDataURL('image/png') for large canvases
        const blobUrl = await new Promise<string>((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('toBlob failed')), 'image/png')
        })

        if (cancelled) { URL.revokeObjectURL(blobUrl); return }

        overlayRef.current?.setMap(null)
        if (overlayRef.current) {
          // revoke previous blob if any
          const prev = (overlayRef.current as google.maps.GroundOverlay & { _blobUrl?: string })._blobUrl
          if (prev) URL.revokeObjectURL(prev)
        }
        const overlay = new google.maps.GroundOverlay(blobUrl, bounds, { opacity })
        ;(overlay as google.maps.GroundOverlay & { _blobUrl?: string })._blobUrl = blobUrl
        overlayRef.current = overlay
        overlayRef.current.setMap(map)
        console.log('[SolarFlux] overlay rendered', w, 'x', h, 'px, range:', min.toFixed(0), '-', max.toFixed(0), 'kWh/kW/yr')
      } catch (err) {
        console.warn('[SolarFlux] error:', err)
      }
    }

    load()
    return () => {
      cancelled = true
      if (overlayRef.current) {
        overlayRef.current.setMap(null)
        const prev = (overlayRef.current as google.maps.GroundOverlay & { _blobUrl?: string })._blobUrl
        if (prev) URL.revokeObjectURL(prev)
        overlayRef.current = null
      }
    }
  }, [map, annualFluxUrl, maskUrl, opacity])

  return null
}
