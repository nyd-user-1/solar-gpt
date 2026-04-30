import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  // Request all flux layers; no pixelSize restriction, no quality restriction
  const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=100&view=FULL_LAYERS&key=${key}`

  const res = await fetch(url)
  const raw = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('[solar-layers] API error:', res.status, raw?.error?.message)
    return NextResponse.json({ error: raw?.error?.message ?? `Solar API ${res.status}` }, { status: res.status })
  }

  // Log everything server-side so Vercel logs show the full picture
  console.log('[solar-layers]', {
    quality: raw.imageryQuality,
    keys: Object.keys(raw),
    hasAnnualFlux: !!raw.annualFluxUrl,
    hasBbox: !!raw.boundingBox,
    hasDsm: !!raw.dsmUrl,
    hasRgb: !!raw.rgbUrl,
    hasMonthly: !!raw.monthlyFluxUrl,
  })

  // Return everything useful — client picks what to render
  return NextResponse.json({
    annualFluxUrl: raw.annualFluxUrl ?? null,
    monthlyFluxUrl: raw.monthlyFluxUrl ?? null,
    dsmUrl: raw.dsmUrl ?? null,
    imageryQuality: raw.imageryQuality ?? null,
    _keys: Object.keys(raw),
  })
}
