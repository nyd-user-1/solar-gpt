import { NextRequest } from 'next/server'

// Proxy the Solar API GeoTIFF to avoid CORS — browser can't fetch solar.googleapis.com directly
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url || !url.startsWith('https://solar.googleapis.com/')) {
    return new Response('Invalid URL', { status: 400 })
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const fetchUrl = url.includes('key=') ? url : `${url}&key=${key}`

  try {
    const res = await fetch(fetchUrl, { next: { revalidate: 3600 } })
    if (!res.ok) return new Response('Upstream error', { status: res.status })

    const buf = await res.arrayBuffer()
    return new Response(buf, {
      headers: {
        'Content-Type': 'image/tiff',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response('Fetch failed', { status: 500 })
  }
}
