import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { sql } from '@/lib/db'

const ADMIN_EMAIL = 'brendan@nysgpt.com'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
}

export async function GET() {
  try {
    await ensureTable()
    const rows = await sql`SELECT key, value FROM app_settings`
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key as string] = row.value as string
    return NextResponse.json(settings)
  } catch (err) {
    console.error('admin/settings GET:', err)
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  await ensureTable()

  for (const [key, value] of Object.entries(body)) {
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${value as string}, now())
      ON CONFLICT (key) DO UPDATE SET value = ${value as string}, updated_at = now()
    `
  }

  return NextResponse.json({ ok: true })
}
