'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, ChevronLeft, ChevronRight } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { DASHBOARD_CONFIGS } from '@/lib/dashboard-config'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Apply admin-configurable bg color
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then((s: Record<string, string>) => {
        if (s.bg_color) {
          document.documentElement.style.setProperty('--bg', s.bg_color)
        }
      })
      .catch(() => {})
  }, [])
  const router = useRouter()
  const pathname = usePathname()

  const isRoot = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard/')
  const currentSlug = isDashboard ? pathname.split('/')[2] : null
  const currentIdx = currentSlug ? DASHBOARD_CONFIGS.findIndex(c => c.slug === currentSlug) : -1
  const n = DASHBOARD_CONFIGS.length

  const prevDashboard = currentIdx >= 0 ? DASHBOARD_CONFIGS[(currentIdx - 1 + n) % n] : null
  const nextDashboard = currentIdx >= 0 ? DASHBOARD_CONFIGS[(currentIdx + 1) % n] : null

  return (
    <div className="flex h-full overflow-hidden p-0 sm:p-[18px]">
      {/* Sidebar — hidden until opened on all screen sizes */}
      <div
        className={`fixed inset-y-0 left-0 z-50 sm:static sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? 'w-full sm:w-[260px] sm:mr-[18px]' : 'w-0'
        }`}
      >
        <div className="w-full sm:w-[260px] h-full rounded-none sm:rounded-2xl overflow-hidden">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 rounded-none sm:rounded-2xl bg-[var(--surface)] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {/* Sun icon — only visible when sidebar is closed; opens sidebar */}
          {!sidebarOpen ? (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--inp-bg)]"
            >
              <Sun className="h-5 w-5 text-solar fill-solar/20" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          {/* Right side: auth on root, chevrons on dashboard, nothing elsewhere */}
          {isRoot && (
            <div className="flex items-center gap-2 mr-1.5">
              <button
                onClick={() => router.push('/login?mode=login')}
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/login?mode=register')}
                className="rounded-full bg-[#111118] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
              >
                Sign up
              </button>
            </div>
          )}

          {isDashboard && prevDashboard && nextDashboard && (
            <div className="flex items-center gap-1 mr-1.5">
              <button
                onClick={() => router.push(`/dashboard/${prevDashboard.slug}`)}
                aria-label={`Previous: ${prevDashboard.title}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-l-full text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push(`/dashboard/${nextDashboard.slug}`)}
                aria-label={`Next: ${nextDashboard.title}`}
                className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-r-full text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* Portal mount point for ChatDrawer and other right-side panels */}
      <div id="chat-panel-root" className="flex shrink-0" />
    </div>
  )
}
