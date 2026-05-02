'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid } from 'lucide-react'
import { cn, fmtUsd, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import type { GeaKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region'

export default function GeaClient({ geas }: { geas: GeaKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('untapped_annual_value_usd')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.geas') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...geas]
    if (query) list = list.filter(g => fmtGea(g.cambium_gea).toLowerCase().includes(query.toLowerCase()))
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.cambium_gea; bv = b.cambium_gea }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [geas, query, sortCol, sortDir])

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">
      <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search regions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.geas', 'list') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.geas', 'cards') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
        {viewMode === 'cards' && (
          <div className="px-6 pb-8 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(gea => (
              <Link key={gea.cambium_gea} href={`/gea-regions/${geaToSlug(gea.cambium_gea)}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:shadow-lg transition-all">
                <div className="h-2 bg-solar/20" />
                <div className="p-4">
                  <p className="font-bold text-[var(--txt)] text-sm truncate mb-2">{fmtGea(gea.cambium_gea)}</p>
                  <div className="flex items-center gap-1.5 mb-6">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">{gea.sunlight_grade}</span>
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">{gea.county_count} counties</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Potential/yr</p>
                    <span className="rounded-lg bg-[var(--txt)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bg)]">Explore →</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--txt)]">{fmtUsd(gea.untapped_annual_value_usd)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <SolarDataTable
            rows={filtered.map(g => ({ ...g, id: g.cambium_gea })) as unknown as SolarRow[]}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={toggleSort}
            regionLabel="Region"
            getRowHref={(row) => {
              const g = row as unknown as GeaKpi
              return `/gea-regions/${geaToSlug(g.cambium_gea)}`
            }}
            renderRegion={(row) => {
              const g = row as unknown as GeaKpi
              return <span className="group-hover/row:text-solar transition-colors">{fmtGea(g.cambium_gea)}</span>
            }}
            extraCols={[
              {
                key: 'counties',
                header: 'Counties',
                render: (row) => {
                  const g = row as unknown as GeaKpi
                  return <span className="tabular-nums">{g.county_count.toLocaleString()}</span>
                },
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (row) => {
                  const g = row as unknown as GeaKpi
                  return <span className="font-bold text-solar">{g.sunlight_grade}</span>
                },
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
