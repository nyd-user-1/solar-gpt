import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region')
  const state = searchParams.get('state')

  if (!region || !state) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const [countyRows, zipRows] = await Promise.all([
    sql`
      SELECT
        untapped_annual_value_usd, untapped_lifetime_value_usd,
        count_qualified, existing_installs_count, adoption_rate_pct,
        sunlight_grade, carbon_offset_metric_tons,
        median_annual_savings_usd, homes_powered_equivalent,
        cars_off_road_equivalent, median_payback_years,
        lat_min, lat_max, lng_min, lng_max
      FROM solargpt.v_county_kpis
      WHERE region_name = ${region} AND state_name = ${state}
      LIMIT 1
    `.catch(() => []),
    sql`
      SELECT zip_code, untapped_annual_value_usd, count_qualified
      FROM solargpt.v_zip_kpis
      WHERE state_name = ${state}
        AND lat_avg BETWEEN (
          SELECT lat_min FROM solargpt.v_county_kpis WHERE region_name = ${region} AND state_name = ${state} LIMIT 1
        ) AND (
          SELECT lat_max FROM solargpt.v_county_kpis WHERE region_name = ${region} AND state_name = ${state} LIMIT 1
        )
        AND lng_avg BETWEEN (
          SELECT lng_min FROM solargpt.v_county_kpis WHERE region_name = ${region} AND state_name = ${state} LIMIT 1
        ) AND (
          SELECT lng_max FROM solargpt.v_county_kpis WHERE region_name = ${region} AND state_name = ${state} LIMIT 1
        )
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 8
    `.catch(() => []),
  ])

  return NextResponse.json({
    kpi: countyRows[0] ?? null,
    topZips: zipRows,
  })
}
