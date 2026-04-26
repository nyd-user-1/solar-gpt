export const dynamic = 'force-dynamic'

import { sql } from '@/lib/db'
import type { GeaKpi } from '@/lib/queries'
import GeaClient from './GeaClient'

export default async function GeaRegionsPage() {
  const rows = await sql`SELECT * FROM solargpt.v_gea_kpis ORDER BY untapped_annual_value_usd DESC`
  return <GeaClient geas={rows as GeaKpi[]} />
}
