'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin, List, LayoutGrid } from 'lucide-react'
import { cn, fmtUsd, fmtGea, stateAbbr } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { CountyKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region'

export default function CountiesClient({ counties }: { counties: CountyKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('region')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.counties') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    // Deduplicate by id in case the view returns multiple rows per county
    const seen = new Set<number>()
    const unique = counties.filter(c => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    const q = query.toLowerCase()
    let list = query
      ? unique
          .filter(c =>
            c.region_name.toLowerCase().includes(q) ||
            c.state_name.toLowerCase().includes(q) ||
            c.region_name.toLowerCase().replace(' county', '').includes(q)
          )
          .sort((a, b) => {
            const an = a.region_name.toLowerCase().replace(' county', '')
            const bn = b.region_name.toLowerCase().replace(' county', '')
            const aExact = an === q, bExact = bn === q
            const aStarts = an.startsWith(q), bStarts = bn.startsWith(q)
            if (aExact !== bExact) return aExact ? -1 : 1
            if (aStarts !== bStarts) return aStarts ? -1 : 1
            return an.localeCompare(bn)
          })
      : [...unique]
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.region_name; bv = b.region_name }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [counties, query, sortCol, sortDir])

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
            placeholder="Search counties…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.counties', 'list') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.counties', 'cards') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">

      {viewMode === 'cards' && (
        <div className="px-6 pb-8 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(county => (
            <Link
              key={county.id}
              href={`/counties/${nameToSlug(county.region_name)}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  {county.seal_url
                    ? <img src={county.seal_url} alt="" className="h-7 w-7 object-contain" />
                    : <MapPin className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-bold text-[var(--txt)]">{county.region_name}</p>
                  <p className="text-xs text-[var(--muted)]">{county.state_name} · {county.cambium_gea ? fmtGea(county.cambium_gea) : ''}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Untapped/yr</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{fmtUsd(county.untapped_annual_value_usd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Grade</p>
                  <p className="text-lg font-bold text-solar">{county.sunlight_grade}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <SolarDataTable
          rows={filtered as SolarRow[]}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={toggleSort}
          regionLabel="County"
          hideCols={['percent_covered', 'kw_total']}
          extraCols={[{
            key: 'state',
            header: 'State',
            mobile: true,
            render: (row) => {
              const c = row as unknown as CountyKpi
              return <span>{stateAbbr(c.state_name)}</span>
            },
          }]}
          getRowHref={(row) => {
            const c = row as unknown as CountyKpi
            return `/counties/${nameToSlug(c.region_name)}`
          }}
          renderRegion={(row) => {
            const c = row as unknown as CountyKpi
            return (
              <span className="truncate block group-hover/row:text-solar transition-colors">{c.region_name}</span>
            )
          }}
        />
      )}

      </div>{/* end scroll area */}
    </div>
  )
}
