'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Bell, Shield, LogOut } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { signOut } from 'next-auth/react'

interface Me { name?: string; email?: string }

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [me, setMe] = useState<Me | null>(null)
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then((d: { user: Me }) => setMe(d.user)).catch(() => {})
  }, [])

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--txt)] mb-8">Settings</h1>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-5 pt-4 pb-2">Appearance</p>
            <button
              onClick={toggle}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--inp-bg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark'
                  ? <Sun className="h-5 w-5 text-[var(--txt)]" />
                  : <Moon className="h-5 w-5 text-[var(--txt)]" />}
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--txt)]">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Currently {theme === 'dark' ? 'dark' : 'light'}
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-solar' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${theme === 'dark' ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-5 pt-4 pb-2">Notifications</p>
            <button
              onClick={() => setNotifications(n => !n)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--inp-bg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[var(--txt)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--txt)]">Email notifications</p>
                  <p className="text-xs text-[var(--muted)]">Quote updates and solar tips</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-solar' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${notifications ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Account */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-5 pt-4 pb-2">Account</p>
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">Signed in as</p>
              <p className="text-sm font-medium text-[var(--txt)]">{me?.email ?? '—'}</p>
            </div>
            <button
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[var(--inp-bg)] transition-colors"
            >
              <Shield className="h-5 w-5 text-[var(--txt)]" />
              <p className="text-sm font-medium text-[var(--txt)]">Privacy &amp; Security</p>
            </button>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-500"
            >
              <LogOut className="h-5 w-5" />
              <p className="text-sm font-medium">Sign out</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
