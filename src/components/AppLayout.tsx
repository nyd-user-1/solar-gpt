'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, ChevronLeft, ChevronRight, ArrowRightFromLine, ArrowLeftToLine } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { DASHBOARD_CONFIGS } from '@/lib/dashboard-config'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashHeader, setDashHeader] = useState<{ formatted: string; color: string } | null>(null)

  useEffect(() => {
    const handle = (e: Event) => setDashHeader((e as CustomEvent).detail)
    window.addEventListener('solargpt:dashboard-header', handle)
    return () => window.removeEventListener('solargpt:dashboard-header', handle)
  }, [])

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
  const isDashboardDetail = pathname.startsWith('/dashboard/')
  const isDashboardList = pathname === '/dashboard'
  const isAnyDashboard = isDashboardDetail || isDashboardList

  const PAGE_TITLES: Record<string, string> = {
    '/states': 'States',
    '/counties': 'Counties',
    '/cities': 'Cities & Towns',
    '/gea-regions': 'Regions',
    '/zips': 'ZIP Codes',
    '/leads': 'Leads',
    '/explore': 'Explore',
    '/explore-2': 'Explore (Regions)',
    '/dashboard': 'Dashboards',
    '/glossary': 'Glossary',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/admin': 'Admin',
    '/free-quote': 'Free Quote',
  }

  // Cyclic nav order — /dashboard excluded so it gets its own cycle
  const NAV_CYCLE = ['/explore', '/explore-2', '/gea-regions', '/states', '/counties', '/cities', '/zips', '/leads']
  const navIdx = NAV_CYCLE.indexOf(pathname)
  const prevNav = navIdx >= 0 ? NAV_CYCLE[(navIdx - 1 + NAV_CYCLE.length) % NAV_CYCLE.length] : null
  const nextNav = navIdx >= 0 ? NAV_CYCLE[(navIdx + 1) % NAV_CYCLE.length] : null

  // Dashboard cycle — all dashboard pages use this
  const n = DASHBOARD_CONFIGS.length
  const currentSlug = isDashboardDetail ? pathname.split('/')[2] : null
  const currentIdx = currentSlug ? DASHBOARD_CONFIGS.findIndex(c => c.slug === currentSlug) : -1
  const currentDashboardTitle = currentIdx >= 0 ? DASHBOARD_CONFIGS[currentIdx].title : null

  // Dashboard list page loops to last/first dashboard; detail page uses prev/next in list
  const prevDashboard = isDashboardList
    ? DASHBOARD_CONFIGS[n - 1]
    : currentIdx >= 0 ? DASHBOARD_CONFIGS[(currentIdx - 1 + n) % n] : null
  const nextDashboard = isDashboardList
    ? DASHBOARD_CONFIGS[0]
    : currentIdx >= 0 ? DASHBOARD_CONFIGS[(currentIdx + 1) % n] : null

  const pageTitle = isDashboardDetail
    ? currentDashboardTitle
    : (PAGE_TITLES[pathname] ?? null)

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

          {/* Nav chevrons — only for non-dashboard pages */}
          {navIdx >= 0 && !isAnyDashboard && (
            <div className="flex items-center gap-2 ml-auto mr-1.5">
              <button onClick={() => prevNav && router.push(prevNav)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => nextNav && router.push(nextNav)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dashboard list page — its own chevrons (loop through dashboards) */}
          {isDashboardList && (
            <div className="flex items-center gap-2 ml-auto mr-1.5">
              <button onClick={() => prevDashboard && router.push(`/dashboard/${prevDashboard.slug}`)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => nextDashboard && router.push(`/dashboard/${nextDashboard.slug}`)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dashboard detail — show the big number top-right (chevrons are inline in the component) */}
          {isDashboardDetail && dashHeader && (
            <div className="ml-auto mr-2 tabular-nums font-bold text-2xl" style={{ color: dashHeader.color }}>
              {dashHeader.formatted}
            </div>
          )}

          {/* Auth buttons on root only */}
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
