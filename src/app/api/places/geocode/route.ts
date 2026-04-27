import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const place_id = req.nextUrl.searchParams.get('place_id')
  if (!place_id) return NextResponse.json({ error: 'Missing place_id' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry&key=${key}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const loc = data.result?.geometry?.location
    if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    return NextResponse.json({ lat: loc.lat, lng: loc.lng })
  } catch {
    return NextResponse.json({ error: 'Geocode failed' }, { status: 500 })
  }
}
