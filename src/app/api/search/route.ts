import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  // Empty query: return top states + first 20 counties A-Z
  if (!q || q.length < 2) {
    const [topStates, topCounties] = await Promise.all([
      sql`
        SELECT v.state_name AS name,
          REGEXP_REPLACE(lower(v.state_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade,
          s.flag_url
        FROM solargpt.v_state_kpis v
        LEFT JOIN solargpt.raw_sunroof_state s USING (id)
        ORDER BY v.untapped_annual_value_usd DESC
        LIMIT 8
      `,
      sql`
        SELECT v.region_name AS name, v.state_name AS state,
          REGEXP_REPLACE(lower(v.region_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade, c.seal_url
        FROM solargpt.v_county_kpis v
        LEFT JOIN solargpt.raw_sunroof_county c USING (id)
        ORDER BY v.region_name ASC
        LIMIT 20
      `,
    ])
    return NextResponse.json({ states: topStates, counties: topCounties, geas: [] })
  }

  const pattern = `%${q}%`

  const [stateRows, countyRows, cityRows] = await Promise.all([
    sql`
      SELECT v.state_name AS name,
        REGEXP_REPLACE(lower(v.state_name), '[^a-z0-9]+', '-', 'g') AS slug,
        v.sunlight_grade AS grade,
        s.flag_url
      FROM solargpt.v_state_kpis v
      LEFT JOIN solargpt.raw_sunroof_state s USING (id)
      WHERE lower(v.state_name) LIKE lower(${pattern})
      ORDER BY v.untapped_annual_value_usd DESC
      LIMIT 5
    `,
    sql`
      SELECT v.region_name AS name, v.state_name AS state,
        REGEXP_REPLACE(lower(v.region_name), '[^a-z0-9]+', '-', 'g') AS slug,
        v.sunlight_grade AS grade, c.seal_url
      FROM solargpt.v_county_kpis v
      LEFT JOIN solargpt.raw_sunroof_county c USING (id)
      WHERE lower(v.region_name) LIKE lower(${pattern})
      ORDER BY v.untapped_annual_value_usd DESC
      LIMIT 6
    `,
    sql`
      SELECT v.region_name AS name, v.state_name AS state,
        v.slug
      FROM solargpt.v_city_kpis v
      WHERE lower(v.region_name) LIKE lower(${pattern})
      ORDER BY v.untapped_annual_value_usd DESC
      LIMIT 6
    `,
  ])

  return NextResponse.json({
    states: stateRows,
    counties: countyRows,
    cities: cityRows,
  })
}
