'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, List, LayoutGrid, Plus, Check, Sun, Map } from 'lucide-react'
import { cn, fmtUsd, fmtNum } from '@/lib/utils'
import { nameToSlug } from '@/lib/queries'
import type { StateKpi } from '@/lib/queries'

type SortCol = 'STATE' | 'UNTAPPED/YR' | 'LIFETIME' | 'GRADE' | 'ADOPTION'

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

export default function StatesClient({ states }: { states: StateKpi[] }) {
  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('UNTAPPED/YR')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
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
      if (sortCol === 'STATE')      { av = a.state_name; bv = b.state_name }
      if (sortCol === 'UNTAPPED/YR') { av = a.untapped_annual_value_usd; bv = b.untapped_annual_value_usd }
      if (sortCol === 'LIFETIME')   { av = a.untapped_lifetime_value_usd; bv = b.untapped_lifetime_value_usd }
      if (sortCol === 'GRADE')      { av = a.sunlight_grade; bv = b.sunlight_grade }
      if (sortCol === 'ADOPTION')   { av = a.adoption_rate_pct ?? 0; bv = b.adoption_rate_pct ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [states, query, grades, sortCol, sortDir])

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[var(--txt)]">States</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Browse solar opportunity data by state</p>
      </div>

      {/* Sticky search + toolbar */}
      <div className="sticky top-0 z-20 bg-[var(--surface)] px-6 pb-3">
        {/* Search bar */}
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

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <GradeFilterMenu selected={grades} onChange={setGrades} />
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
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length.toLocaleString()} results</span>
          </div>
        </div>
      </div>

      {/* Card view */}
      {viewMode === 'cards' && (
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(state => (
              <Link
                key={state.id}
                href={`/states/${nameToSlug(state.state_name)}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Top — flag, full-bleed */}
                <div className="relative h-40 overflow-hidden bg-[var(--inp-bg)]">
                  {state.flag_url ? (
                    <img
                      src={`${state.flag_url}?width=600`}
                      alt={`${state.state_name} flag`}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--inp-bg)] border border-[var(--border)]">
                        <Map className="h-8 w-8 text-[var(--muted)]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom — details */}
                <div className="p-4">
                  {/* Icon + name row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--inp-bg)]">
                      <Sun className="h-3 w-3 text-[var(--muted)]" />
                    </div>
                    <p className="font-bold text-[var(--txt)] text-sm truncate">{state.state_name}</p>
                  </div>

                  {/* Badge row */}
                  <div className="flex items-center gap-1.5 mb-6">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                      {state.sunlight_grade}
                    </span>
                    <span className="rounded-full border border-solar/40 px-2 py-0.5 text-[11px] text-solar">
                      ★ {state.sunlight_stars}
                    </span>
                  </div>

                  {/* Metric label + CTA */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Untapped/yr</p>
                    <span className="rounded-lg bg-[var(--txt)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bg)]">
                      Explore →
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[var(--txt)]">{fmtUsd(state.untapped_annual_value_usd)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* List / table view — carriers table pattern */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto no-scrollbar mx-6 mb-8 rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr>
                {(['STATE', 'UNTAPPED/YR', 'LIFETIME', 'GRADE', 'ADOPTION'] as SortCol[]).map(h => {
                  const active = sortCol === h
                  const hidden = ['LIFETIME', 'GRADE', 'ADOPTION'].includes(h)
                  return (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]',
                        hidden && 'hidden sm:table-cell'
                      )}
                    >
                      <button
                        onClick={() => toggleSort(h)}
                        className={cn(
                          'group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--txt)]',
                          active ? 'text-[var(--txt)]' : 'text-[var(--muted)]'
                        )}
                      >
                        {h}
                        {active
                          ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          : <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                        }
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] align-middle">
              {filtered.map(state => (
                <tr
                  key={state.id}
                  className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">
                    <Link
                      href={`/states/${nameToSlug(state.state_name)}`}
                      className="inline-flex items-center gap-2 rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-[var(--inp-bg)] transition-colors"
                    >
                      {state.flag_url ? (
                        <img
                          src={`${state.flag_url}?width=48`}
                          alt=""
                          className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]"
                          loading="lazy"
                        />
                      ) : (
                        <Map className="h-5 w-5 text-solar shrink-0" />
                      )}
                      {state.state_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-solar">
                    {fmtUsd(state.untapped_annual_value_usd)}/yr
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 font-medium text-green-600 dark:text-green-400">
                    {fmtUsd(state.untapped_lifetime_value_usd)}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SolarStars count={state.sunlight_stars} />
                      <span className="font-bold text-solar text-xs">{state.sunlight_grade}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)]">
                    {state.adoption_rate_pct?.toFixed(1) ?? '—'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
