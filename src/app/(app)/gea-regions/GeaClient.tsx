'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Zap, List, LayoutGrid, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn, fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import type { GeaKpi } from '@/lib/queries'

type SortCol = 'name' | 'value' | 'counties' | 'adoption'

export default function GeaClient({ geas }: { geas: GeaKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.geas') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...geas]
    if (query) list = list.filter(g => g.cambium_gea.toLowerCase().includes(query.toLowerCase()))
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'name')     { av = a.cambium_gea; bv = b.cambium_gea }
      if (sortCol === 'value')    { av = a.untapped_annual_value_usd; bv = b.untapped_annual_value_usd }
      if (sortCol === 'counties') { av = a.county_count; bv = b.county_count }
      if (sortCol === 'adoption') { av = a.adoption_rate_pct ?? 0; bv = b.adoption_rate_pct ?? 0 }
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
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
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

      {viewMode === 'cards' && (
        <div className="px-6 pb-8 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(gea => (
            <Link
              key={gea.cambium_gea}
              href={`/gea-regions/${geaToSlug(gea.cambium_gea)}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Top — color band */}
              <div className="h-2 bg-solar/20" />

              {/* Bottom — details */}
              <div className="p-4">
                <p className="font-bold text-[var(--txt)] text-sm truncate mb-2">{fmtGea(gea.cambium_gea)}</p>

                {/* Badge row */}
                <div className="flex items-center gap-1.5 mb-6">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                    {gea.sunlight_grade}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                    {gea.county_count} counties
                  </span>
                </div>

                {/* Metric label + CTA */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Untapped/yr</p>
                  <span className="rounded-lg bg-[var(--txt)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bg)]">
                    Explore →
                  </span>
                </div>
                <p className="text-xl font-bold text-[var(--txt)]">{fmtUsd(gea.untapped_annual_value_usd)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="overflow-x-auto no-scrollbar mx-6 mb-8 rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr>
                {([
                  { key: 'name' as SortCol,     label: 'Region' },
                  { key: 'value' as SortCol,    label: 'Untapped/yr' },
                  { key: 'counties' as SortCol, label: 'Counties' },
                  { key: 'adoption' as SortCol, label: 'Adoption' },
                ]).map(col => {
                  const active = sortCol === col.key
                  return (
                    <th key={col.key} className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSort(col.key)}
                          className={cn('inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
                            active ? 'text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]'
                          )}
                        >
                          {col.label}
                          {active ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                        </button>
                        {col.key === 'name' && (
                          <Link href="/glossary#gea-regions" title="Grid Energy Areas (GEA) — NREL Cambium grid regions" className="text-[var(--muted)] hover:text-solar transition-colors">
                            <Info className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th className="hidden sm:table-cell px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Grade</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(gea => (
                <tr key={gea.cambium_gea} className="hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">
                    <Link href={`/gea-regions/${geaToSlug(gea.cambium_gea)}`} className="hover:text-solar transition-colors">
                      {fmtGea(gea.cambium_gea)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--txt)] font-medium">{fmtUsd(gea.untapped_annual_value_usd)}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{gea.county_count}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{gea.adoption_rate_pct?.toFixed(1) ?? '—'}%</td>
                  <td className="hidden sm:table-cell px-4 py-3 font-bold text-solar">{gea.sunlight_grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
