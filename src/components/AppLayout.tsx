'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, ChevronLeft, ChevronRight, ArrowRightFromLine, ArrowLeftToLine } from 'lucide-react'
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

  const PAGE_TITLES: Record<string, string> = {
    '/states': 'States',
    '/counties': 'Counties',
    '/cities': 'Cities & Towns',
    '/gea-regions': 'Regions',
    '/leads': 'Leads',
    '/explore': 'Explore',
    '/dashboard': 'Dashboards',
    '/glossary': 'Glossary',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/admin': 'Admin',
    '/free-quote': 'Free Quote',
  }
  const pageTitle = PAGE_TITLES[pathname] ?? null

  // Cyclic nav order for the chevron buttons (excludes utility/auth pages)
  const NAV_CYCLE = ['/dashboard', '/explore', '/states', '/counties', '/cities', '/leads', '/gea-regions']
  const navIdx = NAV_CYCLE.indexOf(pathname)
  const prevNav = navIdx >= 0 ? NAV_CYCLE[(navIdx - 1 + NAV_CYCLE.length) % NAV_CYCLE.length] : null
  const nextNav = navIdx >= 0 ? NAV_CYCLE[(navIdx + 1) % NAV_CYCLE.length] : null
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
      <div className="flex flex-1 flex-col min-w-0 rounded-none sm:rounded-2xl bg-[var(--surface)] overflow-hidden outline-none">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {/* Sun icon — only visible when sidebar is closed; opens sidebar */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--inp-bg)]"
          >
            {sidebarOpen
              ? <ArrowLeftToLine className="h-5 w-5 text-[var(--txt)]" />
              : <ArrowRightFromLine className="h-5 w-5 text-[var(--txt)]" />
            }
          </button>

          {/* Page title — list pages only */}
          {pageTitle && (
            <span className="ml-3 flex-1 text-xl font-bold text-[var(--txt)]">{pageTitle}</span>
          )}

          {/* Page-cycle chevrons — shown on all nav pages */}
          {navIdx >= 0 && prevNav && nextNav && (
            <div className="flex items-center gap-2 ml-auto mr-1.5">
              <button
                onClick={() => router.push(prevNav)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push(nextNav)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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

        <main className="flex flex-1 flex-col overflow-hidden outline-none" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Portal mount point for ChatDrawer and other right-side panels */}
      <div id="chat-panel-root" className="flex shrink-0" />
    </div>
  )
}
