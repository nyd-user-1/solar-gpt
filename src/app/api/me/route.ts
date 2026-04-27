import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { sql } from '@/lib/db'

const ADMIN_EMAIL = 'brendan@nysgpt.com'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ user: null })

  // Try to get richer profile from solargpt.users if it exists
  let name = session.user.name ?? null
  let createdAt: string | null = null

  try {
    const rows = await sql`
      SELECT name, created_at FROM solargpt.users WHERE email = ${session.user.email} LIMIT 1
    `
    if (rows.length) {
      name = (rows[0].name as string | null) || name
      createdAt = rows[0].created_at as string
    }
  } catch { /* table may not exist yet */ }

  return NextResponse.json({
    user: {
      name: name || session.user.email.split('@')[0],
      email: session.user.email,
      image: session.user.image ?? null,
      isAdmin: session.user.email === ADMIN_EMAIL,
      createdAt,
    },
  })
}
