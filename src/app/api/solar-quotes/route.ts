import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const BILL_MAP: Record<string, number> = {
  '$300+': 320, '$200-$300': 250, '$100-$200': 150, 'Under $100': 75,
}

function calcEstimate(insight: Record<string, number | null> | null, monthlyBill: string) {
  const kw = (insight?.recommendedKw as number) ?? 8.0
  const gross = Math.round((kw * 3100) / 100) * 100
  const itc = Math.round(gross * 0.30)
  const net = gross - itc
  const billAmt = BILL_MAP[monthlyBill] ?? 150
  const monthlySavings = Math.round(billAmt * 0.87)
  const payback = (insight?.paybackYears as number) ?? Math.round((net / (monthlySavings * 12)) * 10) / 10
  const savings20yr = (insight?.savings20yr as number) ?? monthlySavings * 12 * 20
  return { kw, gross, itc, net, monthlySavings, payback, savings20yr }
}

export async function POST(req: NextRequest) {
  try {
    const { formData, solarInsight } = await req.json()

    // Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS solar_leads (
        id         SERIAL PRIMARY KEY,
        address    TEXT,
        place_id   TEXT,
        lat        NUMERIC,
        lng        NUMERIC,
        homeownership  TEXT,
        monthly_bill   TEXT,
        roof_age       TEXT,
        roof_shade     TEXT,
        roof_direction TEXT,
        goal           TEXT,
        timeline       TEXT,
        credit_score   TEXT,
        first_name TEXT,
        last_name  TEXT,
        email      TEXT,
        phone      TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS solar_quotes (
        id         SERIAL PRIMARY KEY,
        token      UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
        lead_id    INTEGER REFERENCES solar_leads(id) ON DELETE SET NULL,
        system_kw          NUMERIC,
        gross_cost         INTEGER,
        itc_amount         INTEGER,
        net_cost           INTEGER,
        monthly_savings    INTEGER,
        payback_years      NUMERIC,
        savings_20yr       INTEGER,
        sunshine_hours     NUMERIC,
        roof_area_sqft     INTEGER,
        max_panels         INTEGER,
        panel_capacity_watts INTEGER,
        imagery_quality    TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Insert lead
    const [lead] = await sql`
      INSERT INTO solar_leads
        (address, place_id, lat, lng,
         homeownership, monthly_bill, roof_age, roof_shade, roof_direction,
         goal, timeline, credit_score,
         first_name, last_name, email, phone)
      VALUES
        (${formData.address}, ${formData.placeId ?? null},
         ${formData.lat ?? null}, ${formData.lng ?? null},
         ${formData.homeownership}, ${formData.monthlyBill},
         ${formData.roofAge}, ${formData.roofShade}, ${formData.roofDirection ?? null},
         ${formData.goal}, ${formData.timeline}, ${formData.creditScore},
         ${formData.firstName}, ${formData.lastName}, ${formData.email}, ${formData.phone})
      RETURNING id
    `

    const est = calcEstimate(solarInsight, formData.monthlyBill)

    // Insert quote
    const [quote] = await sql`
      INSERT INTO solar_quotes
        (lead_id, system_kw, gross_cost, itc_amount, net_cost,
         monthly_savings, payback_years, savings_20yr,
         sunshine_hours, roof_area_sqft, max_panels,
         panel_capacity_watts, imagery_quality)
      VALUES
        (${lead.id}, ${est.kw}, ${est.gross}, ${est.itc}, ${est.net},
         ${est.monthlySavings}, ${est.payback}, ${est.savings20yr},
         ${solarInsight?.maxSunshineHoursPerYear ?? null},
         ${solarInsight?.maxAreaSqFt ?? null},
         ${solarInsight?.maxPanelsCount ?? null},
         ${solarInsight?.panelCapacityWatts ?? null},
         ${solarInsight?.imageryQuality ?? null})
      RETURNING token
    `

    return NextResponse.json({ token: quote.token })
  } catch (err) {
    console.error('solar-quotes POST:', err)
    return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 })
  }
}
