'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, Image as ImageIcon } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isExplore = pathname === '/explore'

  const goToExplore = () => {
    if (!isExplore) router.push('/explore')
  }

  return (
    <div className="flex h-full overflow-hidden p-0 sm:p-[18px]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 sm:static sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden sm:w-[260px] sm:mr-[18px] ${
          sidebarOpen ? 'w-full' : 'w-0'
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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Open sidebar"
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full text-solar hover:bg-[var(--inp-bg)] transition-colors"
          >
            <Sun className="h-5 w-5 fill-solar" />
          </button>
          <div className="hidden sm:block" />

          <div className="flex items-center gap-2 mr-1.5">
            <button
              type="button"
              onClick={goToExplore}
              aria-label="Explore"
              title="Explore"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
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
    </div>
  )
}
