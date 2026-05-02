import { NextRequest, NextResponse } from 'next/server'

const EIA_BASE = 'https://api.eia.gov/v2'
const API_KEY = process.env.EIA_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'missing path' }, { status: 400 })

  const params = new URLSearchParams()
  params.set('api_key', API_KEY)
  for (const [k, v] of searchParams.entries()) {
    if (k !== 'path') params.append(k, v)
  }

  const url = `${EIA_BASE}/${path}?${params}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
  })
}
