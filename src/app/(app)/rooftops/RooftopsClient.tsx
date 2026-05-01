'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid, ArrowDownUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { nameToSlug } from '@/lib/queries'
import {
  SEGMENT_COLORS, SEGMENT_LABELS, SEGMENT_SHORT, pct,
  type RooftopRow, type RooftopSegments,
} from '@/lib/rooftops'
import { cn, fmtNum } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Scope = 'states' | 'counties'
type View = 'list' | 'cards'
type SegKey = 'residential' | 'lightCommercial' | 'industrial'
type SortKey = 'total' | 'residential' | 'lightCommercial' | 'industrial' | 'pctRes' | 'pctLC' | 'pctInd'

// Map a sort key to the segment it isolates (or null for the default mix view)
function focusedSegment(key: SortKey): SegKey | null {
  switch (key) {
    case 'residential':
    case 'pctRes':
      return 'residential'
    case 'lightCommercial':
    case 'pctLC':
      return 'lightCommercial'
    case 'industrial':
    case 'pctInd':
      return 'industrial'
    default:
      return null
  }
}

function focusValue(row: RooftopRow, seg: SegKey, asPct: boolean): number {
  if (asPct) return pct(row[seg], row.total)
  return row[seg]
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'total', label: 'Total Qualified' },
  { key: 'residential', label: 'Residential count' },
  { key: 'lightCommercial', label: 'Light Commercial count' },
  { key: 'industrial', label: 'Industrial count' },
  { key: 'pctRes', label: 'Residential %' },
  { key: 'pctLC', label: 'Light Commercial %' },
  { key: 'pctInd', label: 'Industrial %' },
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
    case 'pctRes': return pct(row.residential, row.total)
    case 'pctLC': return pct(row.lightCommercial, row.total)
    case 'pctInd': return pct(row.industrial, row.total)
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

// Single-segment, right-anchored bar used when sorting by a specific segment.
// Width is normalized to `max` across the visible rows so the #1 row fills
// the bar and lower-ranked rows scale down. Growth direction: right → left.
function FocusBar({
  value, max, segment, height = 12, showLabel = true, isPct = false,
}: {
  value: number
  max: number
  segment: SegKey
  height?: number
  showLabel?: boolean
  isPct?: boolean
}) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  const widthPct = ratio * 100
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[var(--inp-bg)] flex justify-end"
      style={{ height }}
    >
      <div
        className="h-full flex items-center justify-end pr-2 text-white transition-[width] duration-300 ease-out"
        style={{ width: `${widthPct}%`, background: SEGMENT_COLORS[segment] }}
        title={`${SEGMENT_LABELS[segment]}: ${isPct ? value.toFixed(1) + '%' : fmtCompact(value)}`}
      >
        {showLabel && widthPct >= 25 && (
          <span className="text-[10px] font-semibold tabular-nums leading-none truncate">
            {isPct ? `${value.toFixed(1)}%` : fmtCompact(value)}
          </span>
        )}
      </div>
    </div>
  )
}

// Picks the right bar based on whether we're focusing on a single segment.
function RowBar({
  row, height, focus, max, isPct, minLabelPct = 15,
}: {
  row: RooftopRow
  height: number
  focus: SegKey | null
  max: number
  isPct: boolean
  minLabelPct?: number
}) {
  if (focus) {
    return (
      <FocusBar
        value={focusValue(row, focus, isPct)}
        max={max}
        segment={focus}
        height={height}
        isPct={isPct}
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

// ── Sticky scope/search/view row ─────────────────────────────────────────────

function StickyControls({
  scope, onScopeChange, query, onQueryChange, view, onViewChange,
}: {
  scope: Scope
  onScopeChange: (s: Scope) => void
  query: string
  onQueryChange: (q: string) => void
  view: View
  onViewChange: (v: View) => void
}) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 py-2.5 space-y-2">
      {/* Scope toggle — full width, two equal halves */}
      <div className="grid grid-cols-2 rounded-full bg-[var(--inp-bg)] p-1">
        {(['states', 'counties'] as Scope[]).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onScopeChange(s)}
            className={cn(
              'h-11 rounded-full text-sm font-semibold capitalize transition-colors',
              scope === s
                ? 'bg-[var(--surface)] text-[var(--txt)] shadow-sm'
                : 'text-[var(--muted)]',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search + view toggles */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-3 h-11">
          <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder={`Search ${scope}…`}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            className="w-full bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--inp-bg)] p-1 h-11">
          <button
            type="button"
            onClick={() => onViewChange('list')}
            aria-label="List view"
            className={cn(
              'h-9 w-9 grid place-items-center rounded-full transition-colors',
              view === 'list' ? 'bg-[var(--surface)] text-[var(--txt)] shadow-sm' : 'text-[var(--muted)]',
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('cards')}
            aria-label="Card view"
            className={cn(
              'h-9 w-9 grid place-items-center rounded-full transition-colors',
              view === 'cards' ? 'bg-[var(--surface)] text-[var(--txt)] shadow-sm' : 'text-[var(--muted)]',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sort dropdown ────────────────────────────────────────────────────────────

function SortControl({
  sortKey, sortDir, onSortKey, onToggleDir,
}: {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSortKey: (k: SortKey) => void
  onToggleDir: () => void
}) {
  return (
    <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Sort</label>
      <div className="flex-1">
        <Select value={sortKey} onValueChange={v => onSortKey(v as SortKey)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={onToggleDir}
        aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
        className="h-11 w-11 grid place-items-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
      >
        <ArrowDownUp className={cn('h-4 w-4 transition-transform', sortDir === 'asc' && 'rotate-180')} />
      </button>
    </div>
  )
}

// ── List + Card rows ─────────────────────────────────────────────────────────

function listHrefFor(scope: Scope, row: RooftopRow): string {
  if (scope === 'states') return `/states/${nameToSlug(row.state_name)}`
  return `/counties/${nameToSlug(row.state_name)}/${nameToSlug(row.region_name)}`
}

function ListRow({
  row, scope, focus, max, isPct,
}: {
  row: RooftopRow
  scope: Scope
  focus: SegKey | null
  max: number
  isPct: boolean
}) {
  // When a single segment is focused, show the focused number on the right
  // instead of the row's total — keeps the bar and the headline metric aligned.
  const headline = focus
    ? (isPct
      ? `${pct(row[focus], row.total).toFixed(1)}%`
      : fmtCompact(row[focus]))
    : fmtCompact(row.total)
  return (
    <Link
      href={listHrefFor(scope, row)}
      className="block px-4 sm:px-6 py-3 border-b border-[var(--border)] active:bg-[var(--inp-bg)] hover:bg-[var(--inp-bg)] transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--txt)] truncate">
          {row.region_name}
          {scope === 'counties' && (
            <span className="ml-1 font-normal text-[var(--muted)]">· {row.state_name}</span>
          )}
        </p>
        <p
          className="text-sm font-bold tabular-nums shrink-0"
          style={{ color: focus ? SEGMENT_COLORS[focus] : undefined }}
        >
          {headline}
        </p>
      </div>
      <div className="mt-2">
        <RowBar row={row} height={12} focus={focus} max={max} isPct={isPct} minLabelPct={15} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums">
        {(['residential', 'lightCommercial', 'industrial'] as SegKey[]).map(k => (
          <span
            key={k}
            className={cn(
              'inline-flex items-center gap-1 transition-opacity',
              focus && focus !== k && 'opacity-40',
            )}
          >
            <span className="h-2 w-2 rounded-sm" style={{ background: SEGMENT_COLORS[k] }} />
            <span className="font-semibold text-[var(--txt)]">{fmtCompact(row[k])}</span>
            <span className="text-[var(--muted)]">{SEGMENT_SHORT[k]}</span>
          </span>
        ))}
      </div>
    </Link>
  )
}

function CardRow({
  row, scope, focus, max, isPct,
}: {
  row: RooftopRow
  scope: Scope
  focus: SegKey | null
  max: number
  isPct: boolean
}) {
  const headline = focus
    ? (isPct
      ? `${pct(row[focus], row.total).toFixed(1)}%`
      : fmtCompact(row[focus]))
    : fmtCompact(row.total)
  const headlineCaption = focus
    ? `${SEGMENT_LABELS[focus]}${isPct ? ' share' : ''}`
    : 'qualified'
  return (
    <Link
      href={listHrefFor(scope, row)}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 active:bg-[var(--inp-bg)] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-[var(--txt)] truncate">{row.region_name}</p>
          {scope === 'counties' && (
            <p className="text-[11px] text-[var(--muted)] truncate">{row.state_name}</p>
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
        <RowBar row={row} height={24} focus={focus} max={max} isPct={isPct} minLabelPct={12} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] tabular-nums">
        {(['residential', 'lightCommercial', 'industrial'] as SegKey[]).map(k => (
          <div
            key={k}
            className={cn(
              'flex items-center gap-1 transition-opacity',
              focus && focus !== k && 'opacity-40',
            )}
          >
            <span className="h-2 w-2 rounded-sm" style={{ background: SEGMENT_COLORS[k] }} />
            <span className="text-[var(--muted)]">{SEGMENT_SHORT[k]}</span>
            <span className="font-semibold text-[var(--txt)]">{pct(row[k], row.total).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </Link>
  )
}

// ── Top-10 by segment ────────────────────────────────────────────────────────

function Top10BySegment({ rows, scope }: { rows: RooftopRow[]; scope: Scope }) {
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

function MixComposition({ rows, scope }: { rows: RooftopRow[]; scope: Scope }) {
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
  initialStates, initialCounties, national,
}: {
  initialStates: RooftopRow[]
  initialCounties: RooftopRow[]
  national: RooftopSegments
}) {
  const [scope, setScope] = useState<Scope>('states')
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const rows = scope === 'states' ? initialStates : initialCounties

  const filtered = useMemo(() => {
    let list = rows
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.region_name.toLowerCase().includes(q) ||
        r.state_name.toLowerCase().includes(q),
      )
    }
    const sorted = [...list].sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return sorted
  }, [rows, query, sortKey, sortDir])

  // Reset visible count when filters/scope change
  const totalCount = filtered.length
  const visibleRows = filtered.slice(0, visibleCount)

  // When sorting by a single segment, the row bars switch to a single-color,
  // right-anchored bar normalized to the max value across the FILTERED list
  // (not just the visible page) so the rankings cascade consistently as the
  // user scrolls / loads more.
  const focus = focusedSegment(sortKey)
  const isPct = sortKey === 'pctRes' || sortKey === 'pctLC' || sortKey === 'pctInd'
  const focusMax = useMemo(() => {
    if (!focus) return 0
    let m = 0
    for (const r of filtered) {
      const v = focusValue(r, focus, isPct)
      if (v > m) m = v
    }
    return m
  }, [filtered, focus, isPct])

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">
      <div className="flex-1 overflow-y-auto">
        {/* Header + preamble */}
        <header className="px-4 sm:px-6 pt-4 pb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--txt)]">Rooftop Opportunity Explorer</h1>
          <p className="mt-1 text-[12px] sm:text-sm text-[var(--muted)]">
            Every region&rsquo;s rooftops break down into three buyer types. This page shows which
            regions are dominated by homes, small businesses, or warehouse-scale opportunities.
          </p>
        </header>

        {/* National summary */}
        <NationalSummary national={national} />

        {/* Sticky controls */}
        <StickyControls
          scope={scope}
          onScopeChange={s => { setScope(s); setVisibleCount(PAGE_SIZE) }}
          query={query}
          onQueryChange={q => { setQuery(q); setVisibleCount(PAGE_SIZE) }}
          view={view}
          onViewChange={setView}
        />

        {/* Sort */}
        <SortControl
          sortKey={sortKey}
          sortDir={sortDir}
          onSortKey={k => { setSortKey(k); setVisibleCount(PAGE_SIZE) }}
          onToggleDir={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        />

        {/* Result count */}
        <div className="px-4 sm:px-6 pb-2 text-[11px] text-[var(--muted)] tabular-nums">
          {fmtNum(totalCount)} {scope === 'states' ? 'states' : 'counties'}
          {totalCount > visibleCount && ` · showing ${fmtNum(visibleCount)}`}
        </div>

        {/* List or Card view */}
        {view === 'list' ? (
          <div className="border-t border-[var(--border)]">
            {visibleRows.map(row => (
              <ListRow key={row.id} row={row} scope={scope} focus={focus} max={focusMax} isPct={isPct} />
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleRows.map(row => (
              <CardRow key={row.id} row={row} scope={scope} focus={focus} max={focusMax} isPct={isPct} />
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
        <Top10BySegment rows={rows} scope={scope} />

        {/* Mix composition across regions */}
        <MixComposition rows={rows} scope={scope} />

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
