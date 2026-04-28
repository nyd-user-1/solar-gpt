'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { ZipMapEntry } from '@/lib/queries'

const COUNTIES_URL = 'https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/counties.geojson'

function zipGeoJsonUrl(stateAbbr: string, stateName: string): string {
  const nameSlug = stateName.toLowerCase().replace(/ /g, '_')
  return `https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/${stateAbbr}_${nameSlug}_zip_codes_geo.min.json`
}

function zipColor(v: number): string {
  if (v >= 100_000_000) return '#92400e'
  if (v >= 50_000_000)  return '#b45309'
  if (v >= 20_000_000)  return '#d97706'
  if (v >= 10_000_000)  return '#f59e0b'
  if (v >= 1_000_000)   return '#fbbf24'
  return '#fef3c7'
}

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'road.local', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

const LEGEND = [
  { color: '#92400e', label: '$100M+' },
  { color: '#b45309', label: '$50M – $100M' },
  { color: '#d97706', label: '$20M – $50M' },
  { color: '#f59e0b', label: '$10M – $20M' },
  { color: '#fbbf24', label: '$1M – $10M' },
  { color: '#fef3c7', label: '< $1M' },
]

type Bounds = { north: number; south: number; east: number; west: number }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 32)
  }, [map, bounds])
  return null
}

function ZipChoroplethLayer({
  zips, countyFips, stateAbbr, stateName,
}: {
  zips: ZipMapEntry[]
  countyFips: string
  stateAbbr: string
  stateName: string
}) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const zipLookup: Record<string, ZipMapEntry> = {}
    for (const z of zips) zipLookup[z.zip_code] = z
    const zipSet = new Set(Object.keys(zipLookup))

    const stateFips2 = countyFips.slice(0, 2)
    const countyFips3 = countyFips.slice(2, 5)

    Promise.all([
      fetch(zipGeoJsonUrl(stateAbbr, stateName)).then(r => r.json()),
      fetch(COUNTIES_URL).then(r => r.json()),
    ]).then(([zipGeojson, countyGeojson]: [
      { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] },
      { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }
    ]) => {
      // ── ZIP choropleth (filtered to our data set) ──
      const filteredZips = {
        type: 'FeatureCollection',
        features: zipGeojson.features.filter(f => {
          const zip = f.properties.ZCTA5CE10 ?? f.properties.GEOID10
          return zipSet.has(zip)
        }),
      }
      map.data.addGeoJson(filteredZips)
      map.data.setStyle((feature: google.maps.Data.Feature) => {
        const zip = (feature.getProperty('ZCTA5CE10') ?? feature.getProperty('GEOID10')) as string
        const z = zipLookup[zip]
        return {
          fillColor: z ? zipColor(z.untapped_annual_value_usd) : '#e5e7eb',
          fillOpacity: z ? 0.75 : 0.2,
          strokeColor: '#ffffff', strokeWeight: 0.8, strokeOpacity: 0.9,
        }
      })
      map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
        map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: '#f59e0b', fillOpacity: 0.95 })
      })
      map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
        map.data.revertStyle(e.feature)
      })

      // ── County border overlay (orange) ──
      const countyFeature = countyGeojson.features.find(
        f => f.properties.STATEFP === stateFips2 && f.properties.COUNTYFP === countyFips3
      )
      if (countyFeature) {
        const borderLayer = new google.maps.Data()
        borderLayer.addGeoJson({ type: 'FeatureCollection', features: [countyFeature] })
        borderLayer.setStyle({
          fillOpacity: 0,
          strokeColor: '#f59e0b',
          strokeWeight: 2.5,
          strokeOpacity: 1,
          clickable: false,
        } as google.maps.Data.StyleOptions)
        borderLayer.setMap(map)
      }
    })
  }, [map, zips, countyFips, stateAbbr, stateName])

  return null
}

export default function CountyZipMap({
  zips,
  countyFips,
  stateAbbr,
  stateName,
  bounds,
  className = 'h-64 sm:h-96 w-full',
}: {
  zips: ZipMapEntry[]
  countyFips: string
  stateAbbr: string
  stateName: string
  bounds: Bounds
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={9}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={bounds} />
          <ZipChoroplethLayer
            zips={zips}
            countyFips={countyFips}
            stateAbbr={stateAbbr}
            stateName={stateName}
          />
        </Map>
      </APIProvider>

      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Untapped / yr</p>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
            <span className="text-[10px] text-[var(--txt)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
