import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input') ?? ''
  if (input.length < 3) return NextResponse.json([])

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${key}`

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
