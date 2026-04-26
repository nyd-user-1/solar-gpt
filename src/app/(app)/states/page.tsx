'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STATES } from '@/data/geo'
import { Search, Sun, Map } from 'lucide-react'

export default function StatesPage() {
  const [query, setQuery] = useState('')

  const filtered = STATES.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">States</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Browse solar adoption by state</p>
      </div>

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search states..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(state => (
            <Link
              key={state.slug}
              href={`/states/${state.slug}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--txt)]">{state.name}</p>
                  <p className="text-xs text-[var(--muted)]">{state.counties.length} counties</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Installs/yr</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{state.avgInstalls.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Solar Score</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Sun className="h-4 w-4 text-solar" />
                    <span className="text-lg font-bold text-solar">{state.solarScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
