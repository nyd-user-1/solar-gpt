// Buyer-segment cutoffs for the install_size_kw_buckets_json column.
// Bucket entries are [lower_bound_kw, building_count].
//   Residential       : 0  – <15 kW  (single-family homes)
//   Light Commercial  : 15 – <100 kW (small biz, multifamily, schools)
//   Industrial        : 100+ kW      (warehouses, big-box, utility scale)
export const SEGMENT_BREAKS = { lightCommercial: 15, industrial: 100 } as const

export const SEGMENT_COLORS = {
  residential: '#3b82f6',     // blue-500
  lightCommercial: '#f59e0b', // solar / orange
  industrial: '#dc2626',      // red-600
} as const

export const SEGMENT_LABELS = {
  residential: 'Residential',
  lightCommercial: 'Light Commercial',
  industrial: 'Industrial',
} as const

export const SEGMENT_SHORT = {
  residential: 'Res',
  lightCommercial: 'LC',
  industrial: 'Ind',
} as const

export type RooftopSegments = {
  residential: number
  lightCommercial: number
  industrial: number
  total: number
}

export type RooftopRow = RooftopSegments & {
  id: string | number
  region_name: string
  state_name: string
}

export type RooftopsResponse = {
  rows: RooftopRow[]
  national: RooftopSegments
}

// Parse the install_size_kw_buckets_json column into buyer-segment totals.
// Accepts either a JSON string or an already-parsed array (Neon returns JSONB
// as JS arrays/objects). Returns zeros for null/invalid input rather than
// throwing — bad rows shouldn't take down the whole API call.
export function parseInstallBuckets(input: unknown): RooftopSegments {
  let buckets: [number, number][] | null = null

  if (input == null) {
    // fall through
  } else if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) buckets = parsed as [number, number][]
    } catch {
      buckets = null
    }
  } else if (Array.isArray(input)) {
    buckets = input as [number, number][]
  }

  let residential = 0
  let lightCommercial = 0
  let industrial = 0

  if (buckets) {
    for (const entry of buckets) {
      if (!Array.isArray(entry) || entry.length < 2) continue
      const lowerKw = Number(entry[0])
      const count = Number(entry[1])
      if (!Number.isFinite(lowerKw) || !Number.isFinite(count)) continue
      if (lowerKw < SEGMENT_BREAKS.lightCommercial) residential += count
      else if (lowerKw < SEGMENT_BREAKS.industrial) lightCommercial += count
      else industrial += count
    }
  }

  return {
    residential,
    lightCommercial,
    industrial,
    total: residential + lightCommercial + industrial,
  }
}

export function aggregateNational(rows: RooftopSegments[]): RooftopSegments {
  let residential = 0, lightCommercial = 0, industrial = 0
  for (const r of rows) {
    residential += r.residential
    lightCommercial += r.lightCommercial
    industrial += r.industrial
  }
  return { residential, lightCommercial, industrial, total: residential + lightCommercial + industrial }
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0
  return (part / whole) * 100
}
