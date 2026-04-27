import { NextRequest, NextResponse } from 'next/server'
import { sql, sqlRaw } from '@/lib/db'

const STOP_WORDS = new Set(['county', 'parish', 'borough', 'city', 'town'])

function tokenize(q: string): string[] {
  const tokens = q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2)
  const meaningful = tokens.filter(t => !STOP_WORDS.has(t))
  return meaningful.length > 0 ? meaningful : tokens
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  // Empty / very short query: top states by untapped value, first 20 counties A-Z
  if (!q || q.length < 2) {
    const [topStates, topCounties] = await Promise.all([
      sql`
        SELECT s.state_name AS name,
          REGEXP_REPLACE(lower(s.state_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade,
          s.flag_url
        FROM solargpt.raw_sunroof_state s
        LEFT JOIN solargpt.v_state_kpis v USING (id)
        ORDER BY v.untapped_annual_value_usd DESC NULLS LAST, s.state_name ASC
        LIMIT 8
      `,
      sql`
        SELECT c.region_name AS name, c.state_name AS state,
          REGEXP_REPLACE(lower(c.region_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade,
          c.seal_url
        FROM solargpt.raw_sunroof_county c
        LEFT JOIN solargpt.v_county_kpis v USING (id)
        ORDER BY c.region_name ASC
        LIMIT 20
      `,
    ])
    return NextResponse.json({ states: topStates, counties: topCounties, geas: [] })
  }

  const tokens = tokenize(q)
  if (tokens.length === 0) {
    return NextResponse.json({ states: [], counties: [], cities: [] })
  }

  const params = tokens.map(t => `%${t}%`)
  const stateConds = tokens.map((_, i) => `lower(s.state_name) LIKE $${i + 1}`).join(' AND ')
  const countyConds = tokens
    .map((_, i) => `lower(c.region_name || ' ' || c.state_name) LIKE $${i + 1}`)
    .join(' AND ')
  const cityConds = tokens
    .map((_, i) => `lower(v.region_name || ' ' || v.state_name) LIKE $${i + 1}`)
    .join(' AND ')

  const [stateRows, countyRows, cityRows] = await Promise.all([
    sqlRaw(
      `
        SELECT s.state_name AS name,
          REGEXP_REPLACE(lower(s.state_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade,
          s.flag_url
        FROM solargpt.raw_sunroof_state s
        LEFT JOIN solargpt.v_state_kpis v USING (id)
        WHERE ${stateConds}
        ORDER BY v.untapped_annual_value_usd DESC NULLS LAST, s.state_name ASC
        LIMIT 8
      `,
      params,
    ),
    sqlRaw(
      `
        SELECT c.region_name AS name, c.state_name AS state,
          REGEXP_REPLACE(lower(c.region_name), '[^a-z0-9]+', '-', 'g') AS slug,
          v.sunlight_grade AS grade,
          c.seal_url
        FROM solargpt.raw_sunroof_county c
        LEFT JOIN solargpt.v_county_kpis v USING (id)
        WHERE ${countyConds}
        ORDER BY v.untapped_annual_value_usd DESC NULLS LAST, c.region_name ASC
        LIMIT 50
      `,
      params,
    ),
    sqlRaw(
      `
        SELECT v.region_name AS name, v.state_name AS state,
          v.slug
        FROM solargpt.v_city_kpis v
        WHERE ${cityConds}
        ORDER BY v.untapped_annual_value_usd DESC NULLS LAST, v.region_name ASC
        LIMIT 50
      `,
      params,
    ),
  ])

  return NextResponse.json({
    states: stateRows,
    counties: countyRows,
    cities: cityRows,
  })
}
