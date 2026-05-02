'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid, Plus, Check, BarChart2 } from 'lucide-react'
import { SolarTopChart } from '@/components/SolarTopChart'
import { cn, fmtUsd, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import type { GeaKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region' | 'county_count'

const GRADES = ['A+', 'A', 'B', 'C', 'D']
const GRADE_ORDER: Record<string, number> = { 'A+': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 }

function GradeFilterMenu({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className={cn('relative rounded-lg p-1.5 transition-colors', open || selected.length > 0 ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
        <Plus className="h-5 w-5" />
        {selected.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-solar text-[8px] font-bold text-white leading-none">{selected.length}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Sunlight Grade</span>
            {selected.length > 0 && <button onClick={() => onChange([])} className="text-[10px] text-solar hover:underline">Clear</button>}
          </div>
          {GRADES.map((g, i) => (
            <button key={g} onClick={() => onChange(selected.includes(g) ? selected.filter(v => v !== g) : [...selected, g])} className={cn('flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)]', i > 0 && 'border-t border-[var(--border)]')}>
              <span className="font-semibold text-[var(--txt)]">{g}</span>
              {selected.includes(g) && <Check className="h-4 w-4 text-solar" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GeaClient({ geas }: { geas: GeaKpi[] }) {
  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [showChart, setShowChart] = useState(false)
  const [sortCol, setSortCol] = useState<SortCol>('untapped_annual_value_usd')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.geas') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...geas]
    if (query) list = list.filter(g => fmtGea(g.cambium_gea).toLowerCase().includes(query.toLowerCase()))
    if (grades.length > 0) list = list.filter(g => grades.includes(g.sunlight_grade))
    list.sort((a, b) => {
      if (sortCol === 'region') return sortDir === 'asc' ? a.cambium_gea.localeCompare(b.cambium_gea) : b.cambium_gea.localeCompare(a.cambium_gea)
      let av: number, bv: number
      if (sortCol === 'sunlight_grade') { av = GRADE_ORDER[a.sunlight_grade ?? ''] ?? 0; bv = GRADE_ORDER[b.sunlight_grade ?? ''] ?? 0 }
      else if (sortCol === 'county_count') { av = a.county_count; bv = b.county_count }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [geas, query, grades, sortCol, sortDir])

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
        <div className="flex items-center gap-1">
          <button onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.geas', 'list') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.geas', 'cards') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <GradeFilterMenu selected={grades} onChange={setGrades} />
          <button onClick={() => setShowChart(o => !o)} className={cn('rounded-lg p-1.5 transition-colors', showChart ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')} title="Top 15 chart">
            <BarChart2 className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      {showChart && (
        <SolarTopChart
          rows={filtered.map(g => ({ ...g, id: g.cambium_gea })) as unknown as import('@/components/SolarDataTable').SolarRow[]}
          getLabel={r => fmtGea((r as unknown as GeaKpi).cambium_gea)}
          getHref={r => `/gea-regions/${geaToSlug((r as unknown as GeaKpi).cambium_gea)}`}
          yAxisWidth={100}
        />
      )}

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
                sortKey: 'county_count',
                tooltip: 'Number of counties that fall within this grid evaluation area.',
                anchor: 'gea-county-count',
                render: (row) => {
                  const g = row as unknown as GeaKpi
                  return <span className="tabular-nums">{g.county_count.toLocaleString()}</span>
                },
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
