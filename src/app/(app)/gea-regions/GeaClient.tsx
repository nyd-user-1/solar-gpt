'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, List, LayoutGrid, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn, fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import type { GeaKpi } from '@/lib/queries'

type SortCol = 'name' | 'value' | 'counties' | 'bldgs' | 'kwh' | 'kw_total' | 'kw_median' | 'installed' | 'adoption'

const COLS: { key: SortCol; label: string; mobile?: boolean }[] = [
  { key: 'value',     label: 'Potential/yr', mobile: true },
  { key: 'counties',  label: 'Counties',     mobile: false },
  { key: 'bldgs',     label: 'Bldgs.',       mobile: true },
  { key: 'kwh',       label: 'kWh',          mobile: false },
  { key: 'kw_total',  label: 'kW Total',     mobile: false },
  { key: 'kw_median', label: 'kW Median',    mobile: false },
  { key: 'installed', label: 'Installed',    mobile: false },
  { key: 'adoption',  label: 'Adoption',     mobile: false },
]

function getValue(g: GeaKpi, col: SortCol): number {
  if (col === 'value')     return g.untapped_annual_value_usd
  if (col === 'counties')  return g.county_count
  if (col === 'bldgs')     return g.count_qualified
  if (col === 'kwh')       return g.yearly_sunlight_kwh_total
  if (col === 'kw_total')  return g.kw_total
  if (col === 'kw_median') return g.kw_median
  if (col === 'installed') return g.existing_installs_count
  if (col === 'adoption')  return g.adoption_rate_pct ?? 0
  return 0
}

function renderValue(g: GeaKpi, col: SortCol): string {
  if (col === 'value')     return fmtUsd(g.untapped_annual_value_usd)
  if (col === 'counties')  return g.county_count.toString()
  if (col === 'bldgs')     return fmtNum(g.count_qualified)
  if (col === 'kwh')       return fmtNum(g.yearly_sunlight_kwh_total)
  if (col === 'kw_total')  return fmtNum(g.kw_total)
  if (col === 'kw_median') return g.kw_median?.toFixed(2) ?? '—'
  if (col === 'installed') return fmtNum(g.existing_installs_count)
  if (col === 'adoption')  return g.adoption_rate_pct != null ? `${g.adoption_rate_pct.toFixed(1)}%` : '—'
  return '—'
}

export default function GeaClient({ geas }: { geas: GeaKpi[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.geas') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...geas]
    if (query) list = list.filter(g => fmtGea(g.cambium_gea).toLowerCase().includes(query.toLowerCase()))
    list.sort((a, b) => {
      let av = sortCol === 'name' ? a.cambium_gea : getValue(a, sortCol)
      let bv = sortCol === 'name' ? b.cambium_gea : getValue(b, sortCol)
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {/* Region column */}
                <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] sticky left-0 z-20">
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => toggleSort('name')}
                      className={cn('inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
                        sortCol === 'name' ? 'text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
                      Region
                      {sortCol === 'name' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                    </button>
                    <Link href="/glossary#gea-regions" title="Grid Energy Areas" className="text-[var(--muted)] hover:text-solar transition-colors">
                      <Info className="h-3 w-3" />
                    </Link>
                  </div>
                </th>
                {COLS.map(col => (
                  <th key={col.key} className={cn('px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]', !col.mobile && 'hidden md:table-cell')}>
                    <button onClick={() => toggleSort(col.key)}
                      className={cn('inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
                        sortCol === col.key ? 'text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
                      {col.label}
                      {sortCol === col.key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                    </button>
                  </th>
                ))}
                <th className="hidden md:table-cell px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Grade</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(gea => {
                const href = `/gea-regions/${geaToSlug(gea.cambium_gea)}`
                return (
                  <tr key={gea.cambium_gea}
                    onClick={() => router.push(href)}
                    className="group/row cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                    <td className="px-4 py-3 font-medium sticky left-0 bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] transition-colors z-[1]">
                      <span className="group-hover/row:text-solar transition-colors">{fmtGea(gea.cambium_gea)}</span>
                    </td>
                    {COLS.map(col => (
                      <td key={col.key} className={cn('px-3 py-3 tabular-nums text-left text-[var(--muted)] text-xs transition-colors group-hover/row:text-solar', !col.mobile && 'hidden md:table-cell')}>
                        {renderValue(gea, col.key)}
                      </td>
                    ))}
                    <td className="hidden md:table-cell px-3 py-3 font-bold text-solar text-xs group-hover/row:text-solar">
                      {gea.sunlight_grade}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
