// Ingest NYISO interconnection-queue rows into Neon via HTTP serverless driver.
// Usage: DATABASE_URL='postgres://...' node ingest.mjs
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = neon(process.env.DATABASE_URL)

const files = fs
  .readdirSync(__dirname)
  .filter(f => /^b\d+\.sql$/.test(f))
  .sort()

console.log(`Executing ${files.length} batches via HTTP...`)
const t0 = Date.now()
for (const f of files) {
  const stmt = fs.readFileSync(path.join(__dirname, f), 'utf8')
  const t1 = Date.now()
  await sql.unsafe(stmt)
  console.log(`  ${f}: ${(Date.now() - t1)}ms (${stmt.length} bytes)`)
}
console.log(`Total: ${(Date.now() - t0)}ms`)

const counts = await sql`SELECT count(*) AS n FROM solargpt.raw_nyiso_queue`
console.log('Total rows:', counts[0].n)
const byStatus = await sql`SELECT status, count(*) AS n FROM solargpt.raw_nyiso_queue GROUP BY status ORDER BY status`
console.log('By status:', byStatus)
const bySnap = await sql`SELECT snapshot_date, count(*) AS n FROM solargpt.raw_nyiso_queue GROUP BY snapshot_date ORDER BY snapshot_date`
console.log('By snapshot:', bySnap)
