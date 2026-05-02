// Ingest rows.json into solargpt.raw_nyiso_queue via Neon's HTTP serverless driver.
//
// Usage:
//   export DATABASE_URL='postgresql://…@…neon.tech/neondb?sslmode=require'
//   node ingest.mjs
//
// Reads rows.json (produced by parse.py) and UPSERTs in batches of 200 rows
// using ON CONFLICT (queue_pos, snapshot_date) DO UPDATE — re-running is
// idempotent. Each batch is one round-trip; expect ~30 batches/sec.
//
// IMPORTANT: this script must run from a host that can reach Neon's HTTPS
// endpoint. Anthropic's cloud sandbox is blocked ("Host not in allowlist");
// laptops, Vercel, GitHub Actions, etc. are fine. Quick check before
// running this script for the first time:
//   node -e "import('@neondatabase/serverless').then(({neon}) => \
//     neon(process.env.DATABASE_URL)\`SELECT 1\`).then(r => console.log('OK', r))"

import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it before running.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

const ROWS_PATH = path.join(__dirname, 'rows.json')
if (!fs.existsSync(ROWS_PATH)) {
  console.error(`Missing ${ROWS_PATH}. Run parse.py first.`)
  process.exit(1)
}

const rows = JSON.parse(fs.readFileSync(ROWS_PATH, 'utf8'))
console.log(`Loaded ${rows.length} rows from ${ROWS_PATH}`)

const FIELDS = [
  'queue_pos', 'snapshot_date', 'developer', 'project_name', 'date_of_ir',
  'sp_mw', 'wp_mw', 'type_fuel', 'energy_storage_capability',
  'minimum_duration_full_discharge', 'county', 'state', 'zone',
  'points_of_interconnection', 'utility', 'affected_transmission_owner',
  's', 'last_updated_date', 'availability_of_studies', 'ia_tender_date',
  'cy_fs_complete_date', 'proposed_in_service_date', 'proposed_sync_date',
  'proposed_cod', 'source_file', 'source_sheet', 'status',
]
const DATE_FIELDS = new Set([
  'snapshot_date', 'date_of_ir', 'last_updated_date', 'ia_tender_date', 'cy_fs_complete_date',
])
const NUM_FIELDS = new Set(['sp_mw', 'wp_mw'])

function lit(field, v) {
  if (v === null || v === undefined || v === '') return 'NULL'
  if (NUM_FIELDS.has(field)) return String(Number(v))
  if (DATE_FIELDS.has(field)) return `'${String(v).replace(/'/g, "''")}'::date`
  return `'${String(v).replace(/'/g, "''")}'`
}

function buildBatchSql(chunk) {
  const values = chunk.map(r =>
    '(' + FIELDS.map(f => lit(f, r[f])).join(',') + ')'
  ).join(',')
  const updateSet = FIELDS
    .filter(f => f !== 'queue_pos' && f !== 'snapshot_date')
    .map(f => `${f}=EXCLUDED.${f}`)
    .join(',')
  return (
    `INSERT INTO solargpt.raw_nyiso_queue (${FIELDS.join(',')}) VALUES ${values} ` +
    `ON CONFLICT (queue_pos, snapshot_date) DO UPDATE SET ${updateSet}`
  )
}

const BATCH_SIZE = 200
const t0 = Date.now()
let inserted = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const chunk = rows.slice(i, i + BATCH_SIZE)
  const stmt = buildBatchSql(chunk)
  try {
    await sql.query(stmt)
    inserted += chunk.length
    process.stdout.write(`  batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} rows (${inserted}/${rows.length})\r`)
  } catch (err) {
    console.error(`\nBatch ${i}-${i + chunk.length} failed: ${err.message}`)
    process.exit(1)
  }
}
console.log(`\nDone in ${Date.now() - t0}ms`)

// Verification queries
const total = await sql`SELECT count(*)::int AS n FROM solargpt.raw_nyiso_queue`
console.log(`Table total: ${total[0].n}`)
const bySnap = await sql`SELECT snapshot_date::text, count(*)::int AS n FROM solargpt.raw_nyiso_queue GROUP BY snapshot_date ORDER BY snapshot_date`
console.log('By snapshot:')
for (const row of bySnap) console.log(`  ${row.snapshot_date}: ${row.n}`)
