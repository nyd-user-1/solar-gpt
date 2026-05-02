// Download NYISO interconnection-queue xlsx files listed in sources.txt.
//
// Usage:
//   node scrape.mjs
//
// Reads sources.txt (one URL per line, blank lines and # comments ignored),
// downloads each .xlsx that isn't already on disk, saves it next to this
// script. Idempotent — only fetches missing files.
//
// To populate sources.txt: open https://www.nyiso.com/interconnections in
// Chrome, View Source (⌘+U), search for ".xlsx", and copy the URLs that
// match "Interconnection-Queue" into sources.txt one per line.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCES_PATH = path.join(__dirname, 'sources.txt')

if (!fs.existsSync(SOURCES_PATH)) {
  console.error(`Missing ${SOURCES_PATH}.`)
  console.error('Create it with one xlsx URL per line. See scrape.mjs header for instructions.')
  process.exit(1)
}

const urls = fs.readFileSync(SOURCES_PATH, 'utf8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'))

console.log(`${urls.length} URL(s) in sources.txt`)

let downloaded = 0
let skipped = 0
let failed = 0

for (const url of urls) {
  // Use the last path segment (URL-decoded) as the local filename.
  let filename
  try {
    filename = decodeURIComponent(new URL(url).pathname.split('/').pop() || '')
  } catch {
    console.error(`  invalid URL: ${url}`)
    failed++
    continue
  }
  if (!filename.toLowerCase().endsWith('.xlsx')) {
    console.error(`  not an xlsx URL, skipping: ${url}`)
    failed++
    continue
  }
  const dest = path.join(__dirname, filename)
  if (fs.existsSync(dest)) {
    skipped++
    continue
  }

  process.stdout.write(`  fetching ${filename}… `)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'solargpt-nyiso-ingest/1.0' },
      redirect: 'follow',
    })
    if (!res.ok) {
      console.error(`HTTP ${res.status}`)
      failed++
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
    console.log(`${(buf.length / 1024).toFixed(0)} KB`)
    downloaded++
  } catch (err) {
    console.error(`error: ${err.message}`)
    failed++
  }
}

console.log(`\n${downloaded} downloaded, ${skipped} already-present, ${failed} failed`)
if (failed) process.exit(1)
