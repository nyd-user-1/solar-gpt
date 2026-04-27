'use client'

import { useEffect, useState } from 'react'
import { Sun, Mail, Calendar, Zap } from 'lucide-react'

interface Me {
  name?: string; email?: string; image?: string; isAdmin?: boolean; createdAt?: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then((d: { user: Me }) => setMe(d.user)).catch(() => {})
  }, [])

  const user = me
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--txt)] mb-8">Profile</h1>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-solar text-white text-3xl font-bold">
            {initials}
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-[var(--txt)]">{user?.name ?? '—'}</p>
            <p className="text-sm text-[var(--muted)]">{user?.email ?? '—'}</p>
          </div>
          <span className="rounded-full bg-[var(--inp-bg)] px-4 py-1 text-xs font-medium text-[var(--muted)]">
            Consumer
          </span>
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Account</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)]">Email</p>
                  <p className="text-sm font-medium text-[var(--txt)]">{user?.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-solar shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)]">Plan</p>
                  <p className="text-sm font-medium text-[var(--txt)]">Free</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)]">Member since</p>
                  <p className="text-sm font-medium text-[var(--txt)]">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : '2026'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-[var(--muted)] shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)]">Role</p>
                  <p className="text-sm font-medium text-[var(--txt)]">{user?.isAdmin ? 'Admin' : 'Consumer'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
