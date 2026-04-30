import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input') ?? ''
  if (input.length < 3) return NextResponse.json([])

  // GPS coords from client (precise) or Vercel IP geolocation headers (approximate, no permission needed)
  const lat = req.nextUrl.searchParams.get('lat') ?? req.headers.get('x-vercel-ip-latitude')
  const lng = req.nextUrl.searchParams.get('lng') ?? req.headers.get('x-vercel-ip-longitude')

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${key}`
  if (lat && lng) url += `&location=${lat},${lng}&radius=80000`

  try {
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(
      (data.predictions ?? []).slice(0, 5).map((p: { place_id: string; description: string }) => ({
        place_id: p.place_id,
        description: p.description,
      }))
    )
  } catch {
    return NextResponse.json([])
  }
}
