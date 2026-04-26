import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { sql } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await sql`DELETE FROM solargpt.chats WHERE id = ${id} AND user_id = ${session.user.id}`
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { title, archived } = await req.json()

  const rows = await sql`
    UPDATE solargpt.chats
    SET
      title    = COALESCE(${title ?? null}, title),
      archived = COALESCE(${archived ?? null}, archived),
      updated_at = now()
    WHERE id = ${id} AND user_id = ${session.user.id}
    RETURNING id, title, archived, updated_at
  `
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}
