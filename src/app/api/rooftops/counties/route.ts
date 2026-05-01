import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { parseInstallBuckets, aggregateNational, type RooftopRow } from '@/lib/rooftops'

export const dynamic = 'force-dynamic'

type Row = {
  id: number
  region_name: string
  state_name: string
  install_size_kw_buckets_json: unknown
}

export async function GET() {
  const rows = (await sql`
    SELECT id, region_name, state_name, install_size_kw_buckets_json
    FROM solargpt.raw_sunroof_county
    ORDER BY state_name, region_name
  `) as Row[]

  const derived: RooftopRow[] = rows.map(r => {
    const seg = parseInstallBuckets(r.install_size_kw_buckets_json)
    return {
      id: r.id,
      region_name: r.region_name,
      state_name: r.state_name,
      ...seg,
    }
  })

  return NextResponse.json({
    rows: derived,
    national: aggregateNational(derived),
  })
}
