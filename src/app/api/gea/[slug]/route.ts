import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { GEA_COLORS } from '@/lib/gea-colors'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const gea = Object.keys(GEA_COLORS).find(k => k.toLowerCase().replace(/_/g, '-') === slug)
  if (!gea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [kpiRows, topCountiesRows, cambiumRows, annualCostRows, annualLrmerRows] = await Promise.all([
    sql`SELECT * FROM solargpt.v_gea_kpis WHERE cambium_gea = ${gea} LIMIT 1`.catch(() => []),
    sql`
      SELECT region_name, state_name, untapped_annual_value_usd, count_qualified
      FROM solargpt.v_county_kpis
      WHERE cambium_gea = ${gea}
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 10
    `.catch(() => []),
    sql`
      SELECT
        marginal_energy_usd_per_mwh  AS cost_per_mwh,
        lrmer_kg_co2_per_mwh         AS lrmer_co2_per_mwh,
        levelized_energy_usd_per_mwh AS levelized_cost_per_mwh,
        levelized_co2e_kg_per_mwh    AS levelized_co2_per_mwh
      FROM solargpt.raw_cambium_gea_metrics
      WHERE cambium_gea = ${gea}
      LIMIT 1
    `.catch(() => []),
    sql`
      SELECT year, energy_usd_per_mwh, capacity_usd_per_mwh
      FROM solargpt.raw_cambium_annual_costs
      WHERE cambium_gea = ${gea} AND scenario = 'Mid-case'
      ORDER BY year
    `.catch(() => []),
    sql`
      SELECT year, co2_kg_per_mwh
      FROM solargpt.raw_cambium_annual_lrmer
      WHERE cambium_gea = ${gea} AND scenario = 'Mid-case'
      ORDER BY year
    `.catch(() => []),
  ])

  return NextResponse.json({
    kpi: kpiRows[0] ?? null,
    cambiumMetrics: cambiumRows[0] ?? null,
    annualCosts: annualCostRows,
    annualLrmer: annualLrmerRows,
    topCounties: topCountiesRows,
  })
}
