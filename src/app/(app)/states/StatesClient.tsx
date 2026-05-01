'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, List, LayoutGrid, Plus, Check, Sun, Map } from 'lucide-react'
import { cn, fmtUsd, fmtNum } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { StateKpi } from '@/lib/queries'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'
import { US_STATES } from '@/lib/us-states'

type SortCol = SortableKey | 'region'

const GRADES = ['A+', 'A', 'B', 'C', 'D']

function GradeFilterMenu({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative rounded-lg p-1.5 transition-colors',
          open || selected.length > 0
            ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
            : 'text-[var(--muted)] hover:text-[var(--txt)]'
        )}
      >
        <Plus className="h-5 w-5" />
        {selected.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-solar text-[8px] font-bold text-white leading-none">
            {selected.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Sunlight Grade</span>
            {selected.length > 0 && (
              <button onClick={() => onChange([])} className="text-[10px] text-solar hover:underline">Clear</button>
            )}
          </div>
          {GRADES.map((g, i) => (
            <button
              key={g}
              onClick={() => {
                const next = selected.includes(g) ? selected.filter(v => v !== g) : [...selected, g]
                onChange(next)
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)]',
                i > 0 && 'border-t border-[var(--border)]'
              )}
            >
              <span className="font-semibold text-[var(--txt)]">{g}</span>
              {selected.includes(g) && <Check className="h-4 w-4 text-solar" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SolarStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Sun
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < count ? 'fill-solar text-solar' : 'text-[var(--border)]'
          )}
        />
      ))}
    </div>
  )
}

function StateCardGrid({ states }: { states: StateKpi[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {states.map(state => (
        <Link
          key={state.id}
          href={`/states/${nameToSlug(state.state_name)}`}
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:shadow-lg active:bg-[var(--inp-bg)] transition-all"
        >
          <div className="relative h-28 sm:h-40 overflow-hidden bg-[var(--inp-bg)]">
            {state.flag_url ? (
              <img src={`${state.flag_url}?width=600`} alt={`${state.state_name} flag`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[var(--inp-bg)] border border-[var(--border)]">
                  <Map className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--muted)]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-4">
            <p className="font-bold text-[var(--txt)] text-sm sm:text-lg truncate mb-1.5 sm:mb-2">{state.state_name}</p>
            <div className="flex items-center gap-1 sm:gap-1.5 mb-3 sm:mb-5">
              <span className="rounded-full border border-[var(--border)] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] text-[var(--muted)]">{state.sunlight_grade}</span>
              <span className="rounded-full border border-solar/40 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] text-solar">★ {state.sunlight_stars}</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-[var(--txt)] truncate">{fmtUsd(state.untapped_annual_value_usd)}</p>
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">Potential/yr</p>
              </div>
              <span className="hidden sm:inline-flex rounded-xl bg-[var(--txt)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shrink-0">Explore →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function StatesClient({ states }: { states: StateKpi[] }) {
  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('region')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.states') as 'cards' | 'list') ?? 'list'
  })

  const filtered = useMemo(() => {
    let list = [...states]
    if (query) list = list.filter(s => s.state_name.toLowerCase().includes(query.toLowerCase()))
    if (grades.length > 0) list = list.filter(s => grades.includes(s.sunlight_grade))
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.state_name; bv = b.state_name }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [states, query, grades, sortCol, sortDir])

  const filteredStates = useMemo(() => filtered.filter(s => US_STATES.has(s.state_name)), [filtered])
  const filteredTerritories = useMemo(() => {
    const t = filtered.filter(s => !US_STATES.has(s.state_name))
    return [...t].sort((a, b) => a.state_name.localeCompare(b.state_name))
  }, [filtered])

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">

      {/* Search + toolbar — always visible above scroll area */}
      <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search states…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.states', 'list') }}
            className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.states', 'cards') }}
            className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <GradeFilterMenu selected={grades} onChange={setGrades} />
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length.toLocaleString()} results</span>
          </div>
        </div>
      </div>

      {/* Scroll area — handles both axes so sticky thead works */}
      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">

      {/* Card view */}
      {viewMode === 'cards' && (
        <div className="px-6 pb-8 pt-3">
          <StateCardGrid states={filteredStates} />
          {filteredTerritories.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Territories</span>
                <div className="flex-1 border-t border-[var(--border)]" />
              </div>
              <StateCardGrid states={filteredTerritories} />
            </>
          )}
        </div>
      )}

      {/* List / table view — 11-column SolarDataTable */}
      {viewMode === 'list' && (
        <SolarDataTable
          rows={filteredStates as SolarRow[]}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={toggleSort}
          regionLabel="State"
          getRowHref={(row) => {
            const s = row as unknown as StateKpi
            return `/states/${nameToSlug(s.state_name)}`
          }}
          renderRegion={(row) => {
            const s = row as unknown as StateKpi
            return (
              <span className="inline-flex items-center gap-2 group-hover/row:text-solar transition-colors">
                {s.flag_url ? (
                  <img
                    src={`${s.flag_url}?width=48`}
                    alt=""
                    className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]"
                    loading="lazy"
                  />
                ) : (
                  <Map className="h-5 w-5 text-solar shrink-0" />
                )}
                {s.state_name}
              </span>
            )
          }}
        />
      )}
      {viewMode === 'list' && filteredTerritories.length > 0 && (
        <>
          <div className="mx-6 mt-2 mb-3 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Territories</span>
            <div className="flex-1 border-t border-[var(--border)]" />
          </div>
          <SolarDataTable
            rows={filteredTerritories as SolarRow[]}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={toggleSort}
            regionLabel="State"
            getRowHref={(row) => {
              const s = row as unknown as StateKpi
              return `/states/${nameToSlug(s.state_name)}`
            }}
            renderRegion={(row) => {
              const s = row as unknown as StateKpi
              return (
                <span className="inline-flex items-center gap-2 group-hover/row:text-solar transition-colors">
                  {s.flag_url ? (
                    <img src={`${s.flag_url}?width=48`} alt="" className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]" loading="lazy" />
                  ) : (
                    <Map className="h-5 w-5 text-solar shrink-0" />
                  )}
                  {s.state_name}
                </span>
              )
            }}
          />
        </>
      )}

      </div>{/* end scroll area */}
    </div>
  )
}
