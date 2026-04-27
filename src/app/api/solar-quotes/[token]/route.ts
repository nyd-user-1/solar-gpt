import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  try {
    const rows = await sql`
      SELECT
        q.token,
        q.system_kw, q.gross_cost, q.itc_amount, q.net_cost,
        q.monthly_savings, q.payback_years, q.savings_20yr,
        q.sunshine_hours, q.roof_area_sqft, q.max_panels,
        q.panel_capacity_watts, q.imagery_quality,
        q.created_at,
        l.address, l.lat, l.lng,
        l.first_name, l.last_name, l.email,
        l.homeownership, l.monthly_bill, l.roof_age,
        l.roof_shade, l.roof_direction, l.goal, l.timeline, l.credit_score
      FROM solar_quotes q
      JOIN solar_leads l ON l.id = q.lead_id
      WHERE q.token = ${token}
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('solar-quotes GET:', err)
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 })
  }
}
