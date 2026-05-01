export const dynamic = 'force-dynamic'

import { sql } from '@/lib/db'
import { parseInstallBuckets, aggregateNational, type RooftopRow } from '@/lib/rooftops'
import RooftopsClient from './RooftopsClient'

type Raw = {
  id: number
  region_name: string
  state_name: string
  install_size_kw_buckets_json: unknown
}

async function fetchScope(table: 'raw_sunroof_state' | 'raw_sunroof_county'): Promise<RooftopRow[]> {
  const rows = (table === 'raw_sunroof_state'
    ? await sql`
        SELECT id, region_name, state_name, install_size_kw_buckets_json
        FROM solargpt.raw_sunroof_state
        ORDER BY state_name
      `
    : await sql`
        SELECT id, region_name, state_name, install_size_kw_buckets_json
        FROM solargpt.raw_sunroof_county
        ORDER BY state_name, region_name
      `) as Raw[]

  return rows.map(r => {
    const seg = parseInstallBuckets(r.install_size_kw_buckets_json)
    return {
      id: r.id,
      region_name: r.region_name,
      state_name: r.state_name,
      ...seg,
    }
  })
}

export default async function RooftopsPage() {
  const [states, counties] = await Promise.all([
    fetchScope('raw_sunroof_state'),
    fetchScope('raw_sunroof_county'),
  ])

  // National totals: sum of states (states are non-overlapping; counties roll
  // up to the same number but states is the cleaner source).
  const national = aggregateNational(states)

  return (
    <RooftopsClient
      initialStates={states}
      initialCounties={counties}
      national={national}
    />
  )
}
