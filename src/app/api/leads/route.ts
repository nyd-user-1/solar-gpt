import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  try {
    const rows = id
      ? await sql`
          SELECT l.id, l.first_name, l.last_name, l.email, l.phone,
                 l.address, l.lat, l.lng,
                 l.homeownership, l.monthly_bill,
                 l.roof_age, l.roof_shade, l.roof_direction,
                 l.goal, l.timeline, l.credit_score, l.created_at,
                 q.token, q.system_kw, q.net_cost, q.monthly_savings,
                 q.payback_years, q.savings_20yr,
                 q.sunshine_hours, q.roof_area_sqft, q.max_panels
          FROM solar_leads l
          LEFT JOIN solar_quotes q ON q.lead_id = l.id
          WHERE l.id = ${Number(id)}
          LIMIT 1
        `
      : await sql`
          SELECT l.id, l.first_name, l.last_name, l.email, l.phone,
                 l.address, l.lat, l.lng,
                 l.homeownership, l.monthly_bill,
                 l.roof_age, l.roof_shade, l.roof_direction,
                 l.goal, l.timeline, l.credit_score, l.created_at,
                 q.token, q.system_kw, q.net_cost, q.monthly_savings,
                 q.payback_years, q.savings_20yr,
                 q.sunshine_hours, q.roof_area_sqft, q.max_panels
          FROM solar_leads l
          LEFT JOIN solar_quotes q ON q.lead_id = l.id
          ORDER BY l.created_at DESC
        `
    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET /api/leads:', err)
    return NextResponse.json([])
  }
}
