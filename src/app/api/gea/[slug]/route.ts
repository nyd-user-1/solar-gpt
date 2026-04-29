import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { GEA_COLORS } from '@/lib/gea-colors'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Resolve GEA name from code — no DB lookup needed
  const gea = Object.keys(GEA_COLORS).find(k => k.toLowerCase().replace(/_/g, '-') === slug)
  if (!gea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [kpiRows, topCountiesRows] = await Promise.all([
    sql`SELECT * FROM solargpt.v_gea_kpis WHERE cambium_gea = ${gea} LIMIT 1`,
    sql`
      SELECT region_name, state_name, untapped_annual_value_usd, count_qualified
      FROM solargpt.v_county_kpis
      WHERE cambium_gea = ${gea}
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 10
    `,
  ])

  return NextResponse.json({
    kpi: kpiRows[0] ?? null,
    topCounties: topCountiesRows,
  })
}
