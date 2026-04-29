import { NextResponse } from 'next/server'
import { getGeaKpi, getCountiesByGea, geaToSlug, getAllGeas } from '@/lib/queries'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allGeas = await getAllGeas()
  const gea = allGeas.find(g => geaToSlug(g) === slug)
  if (!gea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [kpi, counties, cambiumRows] = await Promise.all([
    getGeaKpi(gea),
    getCountiesByGea(gea),
    sql`
      SELECT cost_per_mwh, lrmer_co2_per_mwh
      FROM solargpt.raw_cambium_gea_metrics
      WHERE cambium_gea = ${gea}
      LIMIT 1
    `,
  ])
  if (!kpi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cambiumMetrics = (cambiumRows[0] as { cost_per_mwh: number; lrmer_co2_per_mwh: number } | undefined) ?? null

  const topCounties = counties
    .slice(0, 15)
    .map(c => ({
      region_name: c.region_name,
      state_name: c.state_name,
      untapped_annual_value_usd: c.untapped_annual_value_usd,
      count_qualified: c.count_qualified,
    }))

  return NextResponse.json({ kpi, cambiumMetrics, topCounties })
}
