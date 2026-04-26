import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT id, title, created_at, updated_at, archived
    FROM solargpt.chats
    WHERE user_id = ${session.user.id} AND archived = false
    ORDER BY updated_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = body.title ?? null

  // Upsert user into solargpt.users (in case auth tables and solargpt.users diverge)
  await sql`
    INSERT INTO solargpt.users (id, email, name)
    VALUES (${session.user.id}, ${session.user.email!}, ${session.user.name ?? null})
    ON CONFLICT (email) DO UPDATE SET last_seen_at = now()
  `

  const rows = await sql`
    INSERT INTO solargpt.chats (user_id, title)
    VALUES (${session.user.id}, ${title})
    RETURNING id, title, created_at, updated_at
  `
  return NextResponse.json(rows[0], { status: 201 })
}
