import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=50&requiredQuality=LOW&view=FULL_LAYERS&key=${key}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err?.error?.message ?? 'Data layers unavailable' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({
    annualFluxUrl: data.annualFluxUrl ?? null,
    boundingBox: data.boundingBox ?? null,
    imageryQuality: data.imageryQuality ?? null,
  })
}
