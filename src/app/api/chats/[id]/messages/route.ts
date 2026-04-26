import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { sql } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // Verify ownership
  const chat = await sql`SELECT id FROM solargpt.chats WHERE id = ${id} AND user_id = ${session.user.id} LIMIT 1`
  if (!chat[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await sql`
    SELECT id, role, content, created_at, metadata
    FROM solargpt.messages
    WHERE chat_id = ${id}
    ORDER BY created_at ASC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { role, content, metadata } = await req.json()

  // Verify ownership
  const chat = await sql`SELECT id, title FROM solargpt.chats WHERE id = ${id} AND user_id = ${session.user.id} LIMIT 1`
  if (!chat[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Set title from first user message
  if (role === 'user' && !chat[0].title) {
    const title = content.trim().slice(0, 50).replace(/\s+\S*$/, '')
    await sql`UPDATE solargpt.chats SET title = ${title}, updated_at = now() WHERE id = ${id}`
  } else {
    await sql`UPDATE solargpt.chats SET updated_at = now() WHERE id = ${id}`
  }

  const rows = await sql`
    INSERT INTO solargpt.messages (chat_id, role, content, metadata)
    VALUES (${id}, ${role}, ${content}, ${metadata ? JSON.stringify(metadata) : null})
    RETURNING id, role, content, created_at
  `
  return NextResponse.json(rows[0], { status: 201 })
}
