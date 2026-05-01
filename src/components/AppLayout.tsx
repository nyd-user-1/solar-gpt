'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sun, ChevronLeft, ChevronRight, PanelLeftOpen, PanelLeftClose, Plus } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { DASHBOARD_CONFIGS } from '@/lib/dashboard-config'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashHeader, setDashHeader] = useState<{
    formatted: string; color: string; context: string;
    prevSlug: string; nextSlug: string;
  } | null>(null)

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
    '/rooftops': 'Rooftops',
    '/leads': 'Leads',
    '/explore': 'Explore',
    '/grid': 'Grid',
    '/dashboard': 'Dashboards',
    '/glossary': 'Glossary',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/admin': 'Admin',
    '/report': 'Report',
  }

  // Cyclic nav order — /dashboard excluded so it gets its own cycle
  const NAV_CYCLE = ['/explore', '/grid', '/gea-regions', '/states', '/counties', '/cities', '/zips', '/rooftops', '/leads']
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
          {/* Sidebar toggle — leftmost on desktop, rightmost on mobile */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
            className="order-last sm:order-first flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--inp-bg)]"
          >
            {sidebarOpen
              ? <PanelLeftClose className="h-5 w-5 text-[var(--txt)]" />
              : <PanelLeftOpen className="h-5 w-5 text-[var(--txt)]" />
            }
          </button>

          {/* Page title — leftmost on mobile, after sidebar on desktop */}
          {pageTitle && (
            <span className="order-first sm:order-none ml-0 sm:ml-3 flex items-center gap-2 text-xl text-[var(--txt)]">
              <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--inp-bg)] transition-colors">
                <Sun className="h-5 w-5 text-solar fill-solar/20 shrink-0" />
                <span className="font-bold">SolarGPT</span>
              </Link>
              <span className="hidden sm:inline font-normal text-[var(--muted)]">|</span>
              <span className="hidden sm:inline font-medium">{pageTitle}</span>
            </span>
          )}

          {/* Spacer — pushes all right-side elements to the far right */}
          <div className="hidden sm:block flex-1" />

          {/* Nav chevrons — only for non-dashboard pages (hidden on mobile) */}
          {navIdx >= 0 && !isAnyDashboard && (
            <div className="hidden sm:flex items-center gap-2 ml-auto mr-1.5">
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

          {/* Dashboard list page — its own chevrons (loop through dashboards, hidden on mobile) */}
          {isDashboardList && (
            <div className="hidden sm:flex items-center gap-2 ml-auto mr-1.5">
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

          {/* Dashboard detail — chevrons above, big number below (chevrons hidden on mobile) */}
          {isDashboardDetail && dashHeader && (
            <div className="ml-auto flex flex-col items-end gap-0.5 mr-1.5">
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => router.push(`/dashboard/${dashHeader.prevSlug}`)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/${dashHeader.nextSlug}`)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <div className="tabular-nums font-bold text-4xl leading-tight" style={{ color: dashHeader.color }}>
                  {dashHeader.formatted}
                </div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{dashHeader.context}</div>
              </div>
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
