import { NextResponse } from 'next/server'
import { getGeaKpi } from '@/lib/queries'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Resolve GEA name from slug using Cambium table (covers all 18 GEAs, not just Sunroof ones)
  const geaRows = await sql`
    SELECT cambium_gea FROM solargpt.raw_cambium_gea_metrics
    WHERE LOWER(REPLACE(cambium_gea, '_', '-')) = ${slug}
    LIMIT 1
  `
  const gea = (geaRows[0] as { cambium_gea: string } | undefined)?.cambium_gea
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

  const cambiumMetrics = (cambiumRows[0] as { cost_per_mwh: number; lrmer_co2_per_mwh: number } | undefined) ?? null

  return NextResponse.json({ kpi, cambiumMetrics, topCounties: topCountiesRows })
}
