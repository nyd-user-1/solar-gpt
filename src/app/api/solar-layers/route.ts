import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  // Use IMAGERY_AND_ANNUAL_FLUX_LAYERS — only request what we need (annual flux + imagery)
  // pixelSizeMeters=0.5 gives the highest resolution available
  const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=100&pixelSizeMeters=0.5&view=IMAGERY_AND_ANNUAL_FLUX_LAYERS&key=${key}`

  const res = await fetch(url)
  const raw = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('[solar-layers] API error:', res.status, raw?.error?.message)
    return NextResponse.json({
      error: raw?.error?.message ?? `Solar API ${res.status}`,
      status: res.status,
    }, { status: res.status })
  }

  console.log('[solar-layers] quality:', raw.imageryQuality, 'annualFlux?', !!raw.annualFluxUrl, 'bbox?', !!raw.boundingBox)

  return NextResponse.json({
    annualFluxUrl: raw.annualFluxUrl ?? null,
    boundingBox: raw.boundingBox ?? null,
    imageryQuality: raw.imageryQuality ?? null,
    // Pass through for debugging
    debug: { hasDsm: !!raw.dsmUrl, hasRgb: !!raw.rgbUrl, hasMask: !!raw.maskUrl },
  })
}
