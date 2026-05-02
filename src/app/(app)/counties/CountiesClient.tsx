'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, List, LayoutGrid, Plus, Check } from 'lucide-react'
import { cn, fmtUsd, fmtGea, stateAbbr } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { CountyKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'

type SortCol = SortableKey | 'region'

const GRADES = ['A+', 'A', 'B', 'C', 'D']

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

export default function CountiesClient({ counties }: { counties: CountyKpi[] }) {
  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('region')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.counties') as 'list' | 'cards') ?? 'list'
  })

  const filtered = useMemo(() => {
    const seen = new Set<number>()
    const unique = counties.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
    const q = query.toLowerCase()
    let list = query
      ? unique.filter(c => c.region_name.toLowerCase().includes(q) || c.state_name.toLowerCase().includes(q) || c.region_name.toLowerCase().replace(' county', '').includes(q))
          .sort((a, b) => { const an = a.region_name.toLowerCase().replace(' county', ''), bn = b.region_name.toLowerCase().replace(' county', ''); const aE = an === q, bE = bn === q, aS = an.startsWith(q), bS = bn.startsWith(q); if (aE !== bE) return aE ? -1 : 1; if (aS !== bS) return aS ? -1 : 1; return an.localeCompare(bn) })
      : [...unique]
    if (grades.length > 0) list = list.filter(c => grades.includes(c.sunlight_grade))
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.region_name; bv = b.region_name }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [counties, query, grades, sortCol, sortDir])

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
        <div className="flex items-center gap-1">
          <button onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.counties', 'list') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.counties', 'cards') }} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <GradeFilterMenu selected={grades} onChange={setGrades} />
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length.toLocaleString()} results</span>
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
              href={`/counties/${nameToSlug(county.state_name)}/${nameToSlug(county.region_name)}`}
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
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Potential/yr</p>
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

            render: (row) => {
              const c = row as unknown as CountyKpi
              return <span>{stateAbbr(c.state_name)}</span>
            },
          }]}
          getRowHref={(row) => {
            const c = row as unknown as CountyKpi
            return `/counties/${nameToSlug(c.state_name)}/${nameToSlug(c.region_name)}`
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
