'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Building2, List, LayoutGrid } from 'lucide-react'
import { cn, fmtUsd, fmtNum } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { CityKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region'

export default function CitiesClient({ cities }: { cities: CityKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('count_qualified')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.cities') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...cities]
    if (query) list = list.filter(c =>
      c.region_name.toLowerCase().includes(query.toLowerCase()) ||
      c.state_name.toLowerCase().includes(query.toLowerCase())
    )
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.region_name; bv = b.region_name }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [cities, query, sortCol, sortDir])

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Cities & Towns</h1>
        <p className="hidden sm:block text-sm text-[var(--muted)] mt-1">
          {cities.length.toLocaleString()} cities with solar data
        </p>
      </div>

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search cities…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.cities', 'list') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.cities', 'cards') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      {viewMode === 'cards' && (
        <div className="px-6 pb-8 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(city => (
            <Link
              key={city.id}
              href={`/cities/${nameToSlug(city.region_name)}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--txt)]">{city.region_name}</p>
                  <p className="text-xs text-[var(--muted)]">{city.state_name} · Grade {city.sunlight_grade}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Untapped/yr</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{fmtUsd(city.untapped_annual_value_usd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Buildings</p>
                  <p className="text-lg font-bold text-solar">{fmtNum(city.count_qualified)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <SolarDataTable
          rows={filtered as SolarRow[]}
          sortCol={sortCol === 'region' ? 'count_qualified' : sortCol}
          sortDir={sortDir}
          onSort={toggleSort}
          getRowHref={(row) => {
            const c = row as unknown as CityKpi
            return `/cities/${nameToSlug(c.region_name)}`
          }}
          renderRegion={(row) => {
            const c = row as unknown as CityKpi
            return (
              <span className="flex items-center gap-2 min-w-0 hover:text-solar transition-colors">
                <span className="truncate">{c.region_name}</span>
                <span className="text-xs text-[var(--muted)] shrink-0">{c.state_name}</span>
              </span>
            )
          }}
        />
      )}
    </div>
  )
}
