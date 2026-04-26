import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  // Empty query: return top states for the initial sidebar search view
  if (!q || q.length < 2) {
    const topStates = await sql`
      SELECT state_name AS name,
        REGEXP_REPLACE(lower(state_name), '[^a-z0-9]+', '-', 'g') AS slug,
        sunlight_grade AS grade
      FROM solargpt.v_state_kpis
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 8
    `
    return NextResponse.json({ states: topStates, counties: [], geas: [] })
  }

  const pattern = `%${q}%`

  const [stateRows, countyRows, geaRows] = await Promise.all([
    sql`
      SELECT state_name AS name,
        REGEXP_REPLACE(lower(state_name), '[^a-z0-9]+', '-', 'g') AS slug,
        sunlight_grade AS grade
      FROM solargpt.v_state_kpis
      WHERE lower(state_name) LIKE lower(${pattern})
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 5
    `,
    sql`
      SELECT region_name AS name, state_name AS state,
        REGEXP_REPLACE(lower(region_name), '[^a-z0-9]+', '-', 'g') AS slug,
        sunlight_grade AS grade
      FROM solargpt.v_county_kpis
      WHERE lower(region_name) LIKE lower(${pattern})
      ORDER BY untapped_annual_value_usd DESC
      LIMIT 6
    `,
    sql`
      SELECT DISTINCT cambium_gea AS name,
        lower(replace(cambium_gea, '_', '-')) AS slug
      FROM solargpt.raw_cambium_county_mapping
      WHERE lower(cambium_gea) LIKE lower(${pattern})
      ORDER BY cambium_gea
      LIMIT 5
    `,
  ])

  return NextResponse.json({
    states: stateRows,
    counties: countyRows,
    geas: geaRows,
  })
}
