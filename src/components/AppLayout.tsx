'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Search } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

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
              className="flex h-9 w-9 items-center justify-center rounded-full text-solar hover:bg-[var(--inp-bg)] transition-colors"
            >
              <Sun className="h-5 w-5 fill-solar" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          <div className="flex items-center gap-2 mr-1.5">
            {/* Global search trigger */}
            <button
              onClick={() => window.dispatchEvent(new Event('solargpt:open-search'))}
              className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--inp-bg)] pl-3 pr-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--txt)] hover:border-[var(--border2)] transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search…</span>
              <kbd className="ml-1 text-[10px] font-mono text-[var(--muted2)] bg-[var(--border)] px-1 rounded">⌘K</kbd>
            </button>
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
