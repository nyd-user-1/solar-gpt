'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Building2, List, LayoutGrid } from 'lucide-react'
import { cn, fmtUsd, fmtNum, stateAbbr } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { CityKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region'

const PAGE_SIZE = 500

export default function CitiesClient({ cities }: { cities: CityKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('region')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.cities') as 'list' | 'cards') ?? 'list'
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Full filtered+sorted array (all matching rows, not sliced)
  const filtered = useMemo(() => {
    const seen = new Set<number>()
    const unique = cities.filter(c => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })

    // When searching: relevance order, skip column sort
    if (query) {
      const q = query.toLowerCase()
      return unique
        .filter(c =>
          c.region_name.toLowerCase().includes(q) ||
          c.state_name.toLowerCase().includes(q)
        )
        .sort((a, b) => {
          const an = a.region_name.toLowerCase()
          const bn = b.region_name.toLowerCase()
          const aExact = an === q, bExact = bn === q
          const aStarts = an.startsWith(q), bStarts = bn.startsWith(q)
          if (aExact !== bExact) return aExact ? -1 : 1
          if (aStarts !== bStarts) return aStarts ? -1 : 1
          return an.localeCompare(bn)
        })
    }

    // No query: apply column sort
    const list = [...unique]
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

  // Reset visible window whenever the filtered set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filtered])

  // IntersectionObserver: load next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= filtered.length) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount(v => Math.min(v + PAGE_SIZE, filtered.length))
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, filtered.length])

  const visibleRows = filtered.slice(0, visibleCount)

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">

      {/* Search + toolbar — always visible */}
      <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
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
            <span className="text-xs text-[var(--muted)]">
              {visibleCount < filtered.length
                ? `${visibleCount.toLocaleString()} of ${filtered.length.toLocaleString()}`
                : `${filtered.length.toLocaleString()} results`}
            </span>
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">

        {viewMode === 'cards' && (
          <div className="px-6 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRows.map(city => (
              <Link
                key={city.id}
                href={`/cities/${nameToSlug(city.state_name)}/${nameToSlug(city.region_name)}`}
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
                    <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Potential/yr</p>
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
            rows={visibleRows as SolarRow[]}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={toggleSort}
            regionLabel="City"
            hideCols={['percent_covered', 'kw_total']}
            extraCols={[{
              key: 'state',
              header: 'State',
              mobile: true,
              render: (row) => {
                const c = row as unknown as CityKpi
                return <span>{stateAbbr(c.state_name)}</span>
              },
            }]}
            getRowHref={(row) => {
              const c = row as unknown as CityKpi
              return `/cities/${nameToSlug(c.state_name)}/${nameToSlug(c.region_name)}`
            }}
            renderRegion={(row) => {
              const c = row as unknown as CityKpi
              return (
                <span className="truncate block group-hover/row:text-solar transition-colors">{c.region_name}</span>
              )
            }}
          />
        )}

        {/* Sentinel — triggers next page load */}
        {visibleCount < filtered.length && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            <span className="text-xs text-[var(--muted)]">Loading more…</span>
          </div>
        )}
        {/* Bottom padding when fully loaded */}
        {visibleCount >= filtered.length && <div className="h-8" />}

      </div>
    </div>
  )
}
