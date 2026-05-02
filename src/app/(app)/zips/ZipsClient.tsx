'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'
import type { ZipKpi } from '@/lib/queries'
import { stateAbbr } from '@/lib/utils'

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

export default function ZipsClient({ zips }: { zips: ZipKpi[] }) {
  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortableKey | 'region' | 'state_name'>('count_qualified')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let list = [...zips]
    if (query) list = list.filter(z =>
      z.zip_code.includes(query) || z.state_name.toLowerCase().includes(query.toLowerCase())
    )
    if (grades.length > 0) list = list.filter(z => grades.includes(z.sunlight_grade))
    list.sort((a, b) => {
      if (sortCol === 'region') return sortDir === 'asc' ? a.zip_code.localeCompare(b.zip_code) : b.zip_code.localeCompare(a.zip_code)
      if (sortCol === 'state_name') return sortDir === 'asc' ? a.state_name.localeCompare(b.state_name) : b.state_name.localeCompare(a.state_name)
      let av: number, bv: number
      if (sortCol === 'sunlight_grade') { av = GRADE_ORDER[a.sunlight_grade ?? ''] ?? 0; bv = GRADE_ORDER[b.sunlight_grade ?? ''] ?? 0 }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [zips, query, grades, sortCol, sortDir])

  const handleSort = (key: SortableKey | 'region') => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('desc') }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">
      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search ZIP or state…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <GradeFilterMenu selected={grades} onChange={setGrades} />
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length.toLocaleString()} results</span>
          </div>
        </div>
      </div>

      <SolarDataTable
        rows={filtered as SolarRow[]}
        sortCol={sortCol === 'region' ? 'count_qualified' : sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        regionLabel="ZIP"
        extraCols={[{
          key: 'state',
          header: 'State',
          sortKey: 'state_name',
          tooltip: 'The US state this ZIP code belongs to.',
          anchor: 'state',
          render: (row) => {
            const z = row as unknown as ZipKpi
            return <span>{stateAbbr(z.state_name)}</span>
          },
        }]}
        getRowHref={(row) => {
          const z = row as unknown as ZipKpi
          return `/zips/${z.zip_code}`
        }}
        renderRegion={(row) => {
          const z = row as unknown as ZipKpi
          return (
            <span className="group-hover/row:text-solar transition-colors">
              {z.zip_code}
            </span>
          )
        }}
      />
    </div>
  )
}
