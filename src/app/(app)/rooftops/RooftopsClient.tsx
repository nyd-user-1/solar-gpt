'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid, ArrowDownUp, Plus, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { nameToSlug } from '@/lib/queries'
import {
  SEGMENT_COLORS, SEGMENT_LABELS, SEGMENT_SHORT, pct,
  type RooftopRow, type RooftopSegments,
} from '@/lib/rooftops'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { STATE_ABBRS } from '@/lib/us-states'

type View = 'list' | 'cards'
type SegKey = 'residential' | 'lightCommercial' | 'industrial'
type SortKey = 'total' | 'residential' | 'lightCommercial' | 'industrial'

function abbr(name: string): string {
  return STATE_ABBRS[name] ?? name
}

// Map a sort key to the segment it isolates (or null for the default mix view)
function focusedSegment(key: SortKey): SegKey | null {
  switch (key) {
    case 'residential': return 'residential'
    case 'lightCommercial': return 'lightCommercial'
    case 'industrial': return 'industrial'
    default: return null
  }
}

function focusValue(row: RooftopRow, seg: SegKey): number {
  return row[seg]
}

const SORT_OPTIONS: { key: SortKey; label: string; dot?: string }[] = [
  { key: 'total', label: 'Total Qualified' },
  { key: 'residential', label: 'Residential', dot: SEGMENT_COLORS.residential },
  { key: 'lightCommercial', label: 'Light Commercial', dot: SEGMENT_COLORS.lightCommercial },
  { key: 'industrial', label: 'Industrial', dot: SEGMENT_COLORS.industrial },
]

const PAGE_SIZE = 50

// ── Number / share helpers ───────────────────────────────────────────────────

function fmtCompact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

function getSortValue(row: RooftopRow, key: SortKey): number {
  switch (key) {
    case 'total': return row.total
    case 'residential': return row.residential
    case 'lightCommercial': return row.lightCommercial
    case 'industrial': return row.industrial
  }
}

// ── Stacked bar primitive ────────────────────────────────────────────────────

function MixBar({
  seg, height = 12, showLabels = true, minLabelPct = 15,
}: {
  seg: RooftopSegments
  height?: number
  showLabels?: boolean
  minLabelPct?: number
}) {
  if (!seg.total) {
    return <div className="w-full rounded-full bg-[var(--inp-bg)]" style={{ height }} />
  }
  const segs: { key: SegKey; value: number }[] = [
    { key: 'residential', value: seg.residential },
    { key: 'lightCommercial', value: seg.lightCommercial },
    { key: 'industrial', value: seg.industrial },
  ]
  return (
    <div
      className="w-full overflow-hidden rounded-full flex bg-[var(--inp-bg)]"
      style={{ height }}
    >
      {segs.map(({ key, value }) => {
        const p = pct(value, seg.total)
        if (p <= 0) return null
        return (
          <div
            key={key}
            className="h-full flex items-center justify-center text-white"
            style={{ width: `${p}%`, background: SEGMENT_COLORS[key] }}
            title={`${SEGMENT_LABELS[key]}: ${fmtCompact(value)} (${p.toFixed(1)}%)`}
          >
            {showLabels && p >= minLabelPct && (
              <span className="text-[10px] font-semibold tabular-nums leading-none px-1 truncate">
                {Math.round(p)}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Single-segment, left-anchored bar used when sorting by a specific segment.
// Width is normalized to `max` across the visible rows so the #1 row fills
// the bar and lower-ranked rows scale down. The fill animates from 0 →
// target width left-to-right whenever the focused segment changes (Recharts-
// style growth), and smoothly transitions otherwise.
function FocusBar({
  value, max, segment, height = 12,
}: {
  value: number
  max: number
  segment: SegKey
  height?: number
}) {
  const targetPct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const [w, setW] = useState(0)
  const prevSegRef = useRef<SegKey | null>(null)

  useEffect(() => {
    const segChanged = prevSegRef.current !== segment
    prevSegRef.current = segment
    if (segChanged) {
      // Reset to 0 then animate to target so the bar visibly grows on each
      // sort-segment change (and on initial mount).
      setW(0)
      const id = requestAnimationFrame(() => setW(targetPct))
      return () => cancelAnimationFrame(id)
    }
    setW(targetPct)
  }, [targetPct, segment])

  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[var(--inp-bg)]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${w}%`,
          background: SEGMENT_COLORS[segment],
          transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}

// Picks the right bar based on whether we're focusing on a single segment.
function RowBar({
  row, height, focus, max, minLabelPct = 15,
}: {
  row: RooftopRow
  height: number
  focus: SegKey | null
  max: number
  minLabelPct?: number
}) {
  if (focus) {
    return (
      <FocusBar
        value={focusValue(row, focus)}
        max={max}
        segment={focus}
        height={height}
      />
    )
  }
  return <MixBar seg={row} height={height} minLabelPct={minLabelPct} />
}

// ── National summary bar ─────────────────────────────────────────────────────

function NationalSummary({ national }: { national: RooftopSegments }) {
  return (
    <div className="px-4 sm:px-6 pt-3 pb-2">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <MixBar seg={national} height={28} minLabelPct={10} />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          {(['residential', 'lightCommercial', 'industrial'] as SegKey[]).map(k => (
            <span key={k} className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SEGMENT_COLORS[k] }} />
              <span className="font-semibold text-[var(--txt)]">{fmtCompact(national[k])}</span>
              <span className="text-[var(--muted)]">{SEGMENT_SHORT[k]}</span>
              <span className="text-[var(--muted)]">·</span>
              <span className="text-[var(--muted)]">{pct(national[k], national.total).toFixed(1)}%</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          {fmtCompact(national.total)} total qualified rooftops nationwide
        </p>
      </div>
    </div>
  )
}

// ── State filter menu ────────────────────────────────────────────────────────

function StateFilterMenu({ selected, onChange, options }: { selected: string[]; onChange: (v: string[]) => void; options: string[] }) {
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
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">State</span>
            {selected.length > 0 && <button onClick={() => onChange([])} className="text-[10px] text-solar hover:underline">Clear</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {options.map((s, i) => (
              <button key={s} onClick={() => onChange(selected.includes(s) ? selected.filter(v => v !== s) : [...selected, s])} className={cn('flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)]', i > 0 && 'border-t border-[var(--border)]')}>
                <span className="text-[var(--txt)]">{s}</span>
                {selected.includes(s) && <Check className="h-4 w-4 text-solar" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Controls (search + view toggle + state filter + segment selector) ────────

const SEGMENT_TOOLTIPS: Record<SortKey, string> = {
  total: 'Total Qualified',
  residential: 'Residential',
  lightCommercial: 'Light Commercial',
  industrial: 'Industrial',
}

function Controls({
  selectedStates, onStateChange, stateOptions,
  query, onQueryChange,
  view, onViewChange,
  sortKey, onSortKey,
  sortDir, onSortDir,
  resultCount,
  showViewToggle,
}: {
  selectedStates: string[]; onStateChange: (v: string[]) => void; stateOptions: string[]
  query: string; onQueryChange: (q: string) => void
  view: View; onViewChange: (v: View) => void
  sortKey: SortKey; onSortKey: (k: SortKey) => void
  sortDir: 'asc' | 'desc'; onSortDir: (d: 'asc' | 'desc') => void
  resultCount: number; showViewToggle: boolean
}) {
  return (
    <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
        <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
        <input
          type="text"
          placeholder="Search counties…"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
        />
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-2">
        {/* List / grid */}
        {showViewToggle && <>
          <button onClick={() => onViewChange('list')} className={cn('rounded-lg p-1.5 transition-colors', view === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => onViewChange('cards')} className={cn('rounded-lg p-1.5 transition-colors', view === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
        </>}

        {/* State filter */}
        <StateFilterMenu selected={selectedStates} onChange={onStateChange} options={stateOptions} />

        {/* Segment radio group — styled like Archive | Report pill */}
        <div className="inline-flex items-center divide-x divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden text-sm font-medium">
          {SORT_OPTIONS.map(opt => (
            <div key={opt.key} className="relative group">
              <button
                type="button"
                onClick={() => onSortKey(opt.key)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  sortKey === opt.key ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)]',
                )}
              >
                {opt.key === 'total' ? 'All' : (
                  <span className="block h-3 w-3 rounded-full" style={{ background: opt.dot }} />
                )}
              </button>
              {/* Black tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-black text-white text-xs rounded-lg px-2.5 py-1 whitespace-nowrap">
                  {SEGMENT_TOOLTIPS[opt.key]}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
              </div>
            </div>
          ))}
        </div>

        {/* Sort direction */}
        <button
          type="button"
          onClick={() => onSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
        >
          <ArrowDownUp className={cn('h-4 w-4 transition-transform', sortDir === 'asc' && 'rotate-180')} />
        </button>

        <div className="ml-auto">
          <span className="text-xs text-[var(--muted)]">{resultCount} results</span>
        </div>
      </div>
    </div>
  )
}

// ── List + Card rows ─────────────────────────────────────────────────────────

function listHrefFor(scope: 'states' | 'counties', row: RooftopRow): string {
  if (scope === 'states') return `/states/${nameToSlug(row.state_name)}`
  return `/counties/${nameToSlug(row.state_name)}/${nameToSlug(row.region_name)}`
}

function ListView({ rows, scope, focus, max }: { rows: RooftopRow[]; scope: 'states' | 'counties'; focus: SegKey | null; max: number }) {
  return (
    <div className="mx-3 sm:mx-6 mb-8 rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="w-[220px] px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap">
              {scope === 'states' ? 'State' : 'County'}
            </th>
            <th className="w-[56px] px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">ST</th>
            <th className="px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)] w-full">Share</th>
            <th className="w-[72px] px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)] text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map(row => {
            const value = focus ? fmtCompact(row[focus]) : fmtCompact(row.total)
            const name = scope === 'states' ? row.state_name : row.region_name
            return (
              <tr
                key={row.id}
                onClick={() => { if (typeof window !== 'undefined') window.location.href = listHrefFor(scope, row) }}
                className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors group/row"
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)] group-hover/row:text-solar transition-colors whitespace-nowrap">{name}</td>
                <td className="px-3 py-3 text-xs tabular-nums text-[var(--muted)]">{abbr(row.state_name)}</td>
                <td className="px-3 py-3"><RowBar row={row} height={12} focus={focus} max={max} minLabelPct={20} /></td>
                <td className="px-3 py-3 tabular-nums font-bold text-right" style={{ color: focus ? SEGMENT_COLORS[focus] : undefined }}>{value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CardRow({
  row, scope, focus, max,
}: {
  row: RooftopRow
  scope: 'states' | 'counties'
  focus: SegKey | null
  max: number
}) {
  const headline = focus ? fmtCompact(row[focus]) : fmtCompact(row.total)
  const headlineCaption = focus ? SEGMENT_LABELS[focus] : 'qualified'
  const title = scope === 'states' ? abbr(row.state_name) : row.region_name
  return (
    <Link
      href={listHrefFor(scope, row)}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 active:bg-[var(--inp-bg)] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-[var(--txt)] truncate">{title}</p>
          {scope === 'counties' && (
            <p className="text-[11px] text-[var(--muted)] truncate">{abbr(row.state_name)}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color: focus ? SEGMENT_COLORS[focus] : undefined }}
          >
            {headline}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{headlineCaption}</p>
        </div>
      </div>
      <div className="mt-3">
        <RowBar row={row} height={28} focus={focus} max={max} minLabelPct={12} />
      </div>
    </Link>
  )
}

// ── Top-10 by segment ────────────────────────────────────────────────────────

function Top10BySegment({ rows, scope }: { rows: RooftopRow[]; scope: 'states' | 'counties' }) {
  const [tab, setTab] = useState<SegKey>('residential')

  const top10 = useMemo(() => {
    return [...rows]
      .sort((a, b) => b[tab] - a[tab])
      .slice(0, 10)
      .map(r => ({
        name: r.region_name,
        state: r.state_name,
        value: r[tab],
        slug: listHrefFor(scope, r),
      }))
  }, [rows, tab, scope])

  return (
    <section className="px-4 sm:px-6 pt-6 pb-4">
      <h2 className="text-base font-bold text-[var(--txt)] mb-1">Where each buyer type lives</h2>
      <p className="text-[12px] text-[var(--muted)] mb-3">
        Top 10 {scope === 'states' ? 'states' : 'counties'} by segment count.
      </p>
      <div className="grid grid-cols-3 rounded-full bg-[var(--inp-bg)] p-1 mb-3">
        {(['residential', 'lightCommercial', 'industrial'] as SegKey[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'h-11 rounded-full text-xs font-semibold transition-colors',
              tab === k
                ? 'bg-[var(--surface)] text-[var(--txt)] shadow-sm'
                : 'text-[var(--muted)]',
            )}
          >
            {SEGMENT_LABELS[k]}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
        <div className="aspect-[4/5] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                formatter={(v) => [fmtCompact(Number(v)), SEGMENT_LABELS[tab]] as [string, string]}
                labelFormatter={(label, payload) => {
                  const p = payload?.[0]?.payload as { name: string; state: string } | undefined
                  return p ? (scope === 'counties' ? `${p.name} · ${p.state}` : p.name) : String(label)
                }}
              />
              <Bar
                dataKey="value"
                fill={SEGMENT_COLORS[tab]}
                radius={[0, 4, 4, 0]}
                onClick={(d: unknown) => {
                  const slug = (d as { payload?: { slug?: string } })?.payload?.slug
                  if (slug && typeof window !== 'undefined') window.location.href = slug
                }}
                label={{
                  position: 'right',
                  fill: 'var(--txt)',
                  fontSize: 11,
                  formatter: (v: unknown) => fmtCompact(Number(v)),
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

// ── Mix composition across regions ──────────────────────────────────────────

function MixComposition({ rows, scope }: { rows: RooftopRow[]; scope: 'states' | 'counties' }) {
  const top = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map((r, i) => ({
        rank: i + 1,
        name: r.region_name,
        state: r.state_name,
        Residential: r.residential,
        'Light Commercial': r.lightCommercial,
        Industrial: r.industrial,
      }))
  }, [rows])

  return (
    <section className="px-4 sm:px-6 pt-2 pb-4">
      <h2 className="text-base font-bold text-[var(--txt)] mb-1">How the mix shifts across regions</h2>
      <p className="text-[12px] text-[var(--muted)] mb-3">
        Top 15 {scope === 'states' ? 'states' : 'counties'} by total qualified rooftops.
      </p>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
        <div className="aspect-[16/10] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top} margin={{ top: 4, right: 4, bottom: 8, left: 0 }}>
              <XAxis dataKey="rank" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                formatter={(v) => fmtCompact(Number(v))}
                labelFormatter={(_label, payload) => {
                  const p = payload?.[0]?.payload as { name: string; state: string } | undefined
                  return p ? (scope === 'counties' ? `${p.name} · ${p.state}` : p.name) : ''
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
              <Bar dataKey="Residential" stackId="a" fill={SEGMENT_COLORS.residential} />
              <Bar dataKey="Light Commercial" stackId="a" fill={SEGMENT_COLORS.lightCommercial} />
              <Bar dataKey="Industrial" stackId="a" fill={SEGMENT_COLORS.industrial} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

// ── Main client ──────────────────────────────────────────────────────────────

export default function RooftopsClient({
  initialStates: _initialStates, initialCounties, national,
}: {
  initialStates: RooftopRow[]
  initialCounties: RooftopRow[]
  national: RooftopSegments
}) {
  const isMobile = useIsMobile()
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const effectiveView: View = isMobile ? 'cards' : view

  const stateOptions = useMemo(() => [...new Set(initialCounties.map(r => r.state_name))].sort(), [initialCounties])

  const filtered = useMemo(() => {
    let list = initialCounties
    if (selectedStates.length > 0) list = list.filter(r => selectedStates.includes(r.state_name))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => r.region_name.toLowerCase().includes(q) || r.state_name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [initialCounties, selectedStates, query, sortKey, sortDir])

  // Reset visible count when filters/scope change
  const totalCount = filtered.length
  const visibleRows = filtered.slice(0, visibleCount)

  // When sorting by a single segment, the row bars switch to a single-color,
  // left-anchored bar normalized to the max value across the FILTERED list
  // (not just the visible page) so the rankings cascade consistently as the
  // user scrolls / loads more.
  const focus = focusedSegment(sortKey)
  const focusMax = useMemo(() => {
    if (!focus) return 0
    let m = 0
    for (const r of filtered) {
      const v = focusValue(r, focus)
      if (v > m) m = v
    }
    return m
  }, [filtered, focus])

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">
      <div className="flex-1 overflow-y-auto">
        {/* Controls — search + toolbar */}
        <Controls
          selectedStates={selectedStates} onStateChange={v => { setSelectedStates(v); setVisibleCount(PAGE_SIZE) }} stateOptions={stateOptions}
          query={query} onQueryChange={q => { setQuery(q); setVisibleCount(PAGE_SIZE) }}
          view={view} onViewChange={setView}
          sortKey={sortKey} onSortKey={k => { setSortKey(k); setVisibleCount(PAGE_SIZE) }}
          sortDir={sortDir} onSortDir={setSortDir}
          resultCount={totalCount}
          showViewToggle={!isMobile}
        />

        {/* List or Card view */}
        {effectiveView === 'list' ? (
          <ListView rows={visibleRows} scope="counties" focus={focus} max={focusMax} />
        ) : (
          <div className="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleRows.map(row => (
              <CardRow key={row.id} row={row} scope="counties" focus={focus} max={focusMax} />
            ))}
          </div>
        )}

        {/* Load more */}
        {totalCount > visibleCount && (
          <div className="px-4 sm:px-6 py-4">
            <button
              type="button"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="w-full h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--txt)] hover:bg-[var(--inp-bg)] active:bg-[var(--inp-bg)] transition-colors"
            >
              Load {Math.min(PAGE_SIZE, totalCount - visibleCount)} more
            </button>
          </div>
        )}

        {/* Top 10 by segment */}
        <Top10BySegment rows={filtered} scope="counties" />

        {/* Mix composition across regions */}
        <MixComposition rows={filtered} scope="counties" />

        {/* Evaluation footer */}
        <footer className="px-4 sm:px-6 pb-10 pt-2">
          <p className="text-[11px] italic text-[var(--muted)] leading-relaxed">
            This view is in evaluation. The same buyer-segment data will eventually be
            filterable across <code className="font-mono not-italic">/states</code>,{' '}
            <code className="font-mono not-italic">/counties</code>, and detail pages — once we
            confirm the 15 kW and 100 kW cutoffs serve our audience.
          </p>
        </footer>
      </div>
    </div>
  )
}
