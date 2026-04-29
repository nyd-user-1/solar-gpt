import { NextResponse } from 'next/server'
import { getGeaKpi, geaToSlug, getAllGeas } from '@/lib/queries'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allGeas = await getAllGeas()
  const gea = allGeas.find(g => geaToSlug(g) === slug)
  if (!gea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [kpi, topCountiesRows, cambiumRows] = await Promise.all([
    getGeaKpi(gea),
    sql`
      SELECT region_name, state_name, untapped_annual_value_usd, count_qualified
      FROM solargpt.v_county_kpis
      WHERE cambium_gea = ${gea}
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 10
    `,
    sql`
      SELECT cost_per_mwh, lrmer_co2_per_mwh
      FROM solargpt.raw_cambium_gea_metrics
      WHERE cambium_gea = ${gea}
      LIMIT 1
    `,
  ])
  if (!kpi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cambiumMetrics = (cambiumRows[0] as { cost_per_mwh: number; lrmer_co2_per_mwh: number } | undefined) ?? null

  return NextResponse.json({ kpi, cambiumMetrics, topCounties: topCountiesRows })
}
