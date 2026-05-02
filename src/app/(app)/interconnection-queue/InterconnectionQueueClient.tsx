'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, Plus, Check, BarChart2 } from 'lucide-react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { cn, formatNumber } from '@/lib/utils'
import type { NyisoQueueRow, QueueGrowthRow } from '@/lib/queries'

type SortCol =
  | 'queue_pos'
  | 'developer'
  | 'project_name'
  | 'date_of_ir'
  | 'sp_mw'
  | 'wp_mw'
  | 'type_fuel'
  | 'energy_storage_capability'
  | 'minimum_duration_full_discharge'
  | 'county'
  | 'state'
  | 'zone'
  | 'points_of_interconnection'
  | 'utility'
  | 'affected_transmission_owner'
  | 's'
  | 'last_updated_date'
  | 'availability_of_studies'
  | 'ia_tender_date'
  | 'cy_fs_complete_date'
  | 'proposed_in_service_date'
  | 'proposed_sync_date'
  | 'proposed_cod'

type Align = 'left' | 'right'

interface ColDef {
  key: SortCol
  header: string
  align?: Align
  width?: string
  numeric?: boolean
  render: (r: NyisoQueueRow) => string
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00Z')
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const COLS: ColDef[] = [
  { key: 'developer',                       header: 'Developer',                width: 'min-w-[220px]', render: r => r.developer ?? '—' },
  { key: 'project_name',                    header: 'Project Name',             width: 'min-w-[220px]', render: r => r.project_name ?? '—' },
  { key: 'date_of_ir',                      header: 'Date of IR',               render: r => fmtDate(r.date_of_ir) },
  { key: 'sp_mw',                           header: 'SP (MW)',                  align: 'right', numeric: true, render: r => r.sp_mw == null ? '—' : formatNumber(r.sp_mw) },
  { key: 'wp_mw',                           header: 'WP (MW)',                  align: 'right', numeric: true, render: r => r.wp_mw == null ? '—' : formatNumber(r.wp_mw) },
  { key: 'type_fuel',                       header: 'Type / Fuel',              render: r => r.type_fuel ?? '—' },
  { key: 'energy_storage_capability',       header: 'Energy Storage Capability', render: r => r.energy_storage_capability ?? '—' },
  { key: 'minimum_duration_full_discharge', header: 'Min Duration Full Discharge', render: r => r.minimum_duration_full_discharge ?? '—' },
  { key: 'county',                          header: 'County',                   render: r => r.county ?? '—' },
  { key: 'state',                           header: 'State',                    render: r => r.state ?? '—' },
  { key: 'zone',                            header: 'Z',                        render: r => r.zone ?? '—' },
  { key: 'points_of_interconnection',       header: 'Points of Interconnection', width: 'min-w-[260px]', render: r => r.points_of_interconnection ?? '—' },
  { key: 'utility',                         header: 'Utility',                  render: r => r.utility ?? '—' },
  { key: 'affected_transmission_owner',     header: 'Affected Transmission Owner (ATO)', width: 'min-w-[200px]', render: r => r.affected_transmission_owner ?? '—' },
  { key: 's',                               header: 'S',                        render: r => r.s ?? '—' },
  { key: 'last_updated_date',               header: 'Last Updated Date',        render: r => fmtDate(r.last_updated_date) },
  { key: 'availability_of_studies',         header: 'Availability of Studies',  render: r => r.availability_of_studies ?? '—' },
  { key: 'ia_tender_date',                  header: 'IA Tender Date',           render: r => fmtDate(r.ia_tender_date) },
  { key: 'cy_fs_complete_date',             header: 'CY/FS Complete Date',      render: r => fmtDate(r.cy_fs_complete_date) },
  { key: 'proposed_in_service_date',        header: 'Proposed In-Service / Initial Backfeed', width: 'min-w-[220px]', render: r => r.proposed_in_service_date ?? '—' },
  { key: 'proposed_sync_date',              header: 'Proposed Sync Date',       render: r => r.proposed_sync_date ?? '—' },
  { key: 'proposed_cod',                    header: 'Proposed COD',             render: r => r.proposed_cod ?? '—' },
]

const FUEL_LABELS: Record<string, string> = {
  S: 'Solar', W: 'Wind', OSW: 'Offshore Wind', ES: 'Battery Storage',
  CR: 'Solar + Storage', CW: 'Wind + Storage', L: 'Load',
  AC: 'Transmission AC', DC: 'Transmission DC', NG: 'Natural Gas',
  H: 'Hydro', FC: 'Fuel Cell', SW: 'Solid Waste',
}

function FuelFilterMenu({ selected, onChange, fuels }: { selected: string[]; onChange: (v: string[]) => void; fuels: string[] }) {
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
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Fuel Type</span>
            {selected.length > 0 && (
              <button onClick={() => onChange([])} className="text-[10px] text-solar hover:underline">Clear</button>
            )}
          </div>
          {fuels.map((f, i) => (
            <button
              key={f}
              onClick={() => {
                const next = selected.includes(f) ? selected.filter(v => v !== f) : [...selected, f]
                onChange(next)
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)]',
                i > 0 && 'border-t border-[var(--border)]'
              )}
            >
              <span className="text-[var(--txt)]">{FUEL_LABELS[f] ?? f}</span>
              {selected.includes(f) && <Check className="h-4 w-4 text-solar" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QueueGrowthChart({ data }: { data: QueueGrowthRow[] }) {
  const fmt = (v: string) => {
    const d = new Date(v + 'T00:00:00Z')
    if (d.getUTCMonth() !== 0) return ''
    return `'${d.getUTCFullYear().toString().slice(2)}`
  }
  return (
    <div className="px-6 pb-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Queue Growth — Active Projects &amp; MW</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="snapshot_date"
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              yAxisId="mw"
              orientation="left"
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={v => {
                const d = new Date(v + 'T00:00:00Z')
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })
              }}
              formatter={(value, name) => {
                const n = Number(value)
                return name === 'total_sp_mw'
                  ? [`${formatNumber(n)} MW`, 'Total SP (MW)']
                  : [n.toLocaleString(), 'Active Projects']
              }}
            />
            <Area
              yAxisId="mw"
              type="monotone"
              dataKey="total_sp_mw"
              fill="#f59e0b22"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="active_count"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-1 px-9">
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
            <span className="inline-block w-3 h-0.5 rounded bg-[#f59e0b]" /> Total SP (MW)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
            <span className="inline-block w-3 h-0.5 rounded bg-[#6366f1]" /> Active Projects
          </span>
        </div>
      </div>
    </div>
  )
}

function HeaderButton({ active, dir, onClick, label }: {
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group/col inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--txt)]',
        active ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
      )}
    >
      {label}
      {active
        ? dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        : <ChevronUp className="h-3 w-3 opacity-0 group-hover/col:opacity-40" />
      }
    </button>
  )
}

export default function InterconnectionQueueClient({ rows, growth }: { rows: NyisoQueueRow[]; growth: QueueGrowthRow[] }) {
  const [query, setQuery] = useState('')
  const [fuels, setFuels] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('date_of_ir')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showChart, setShowChart] = useState(false)

  const fuelOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach(r => { if (r.type_fuel) set.add(r.type_fuel) })
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let list = [...rows]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        (r.project_name?.toLowerCase().includes(q)) ||
        (r.developer?.toLowerCase().includes(q)) ||
        (r.county?.toLowerCase().includes(q)) ||
        (r.queue_pos?.toLowerCase().includes(q))
      )
    }
    if (fuels.length > 0) list = list.filter(r => r.type_fuel && fuels.includes(r.type_fuel))
    list.sort((a, b) => {
      const av = a[sortCol] as string | number | null
      const bv = b[sortCol] as string | number | null
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [rows, query, fuels, sortCol, sortDir])

  const totalMw = useMemo(
    () => filtered.reduce((acc, r) => acc + (r.sp_mw ?? 0), 0),
    [filtered]
  )

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'sp_mw' || col === 'wp_mw' || col === 'date_of_ir' ? 'desc' : 'asc') }
  }

  const snapshotLabel = rows[0]?.snapshot_date
    ? new Date(rows[0].snapshot_date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">

      {/* Search + toolbar */}
      <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search projects, developers, counties…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <FuelFilterMenu selected={fuels} onChange={setFuels} fuels={fuelOptions} />
          <button
            onClick={() => setShowChart(o => !o)}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              showChart
                ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
                : 'text-[var(--muted)] hover:text-[var(--txt)]'
            )}
            title="Queue growth chart"
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>{filtered.length.toLocaleString()} projects</span>
            <span className="text-[var(--border)]">·</span>
            <span>{formatNumber(Math.round(totalMw))} MW total</span>
            {snapshotLabel && (
              <>
                <span className="text-[var(--border)]">·</span>
                <span>NYISO snapshot {snapshotLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Queue growth chart panel */}
      {showChart && <QueueGrowthChart data={growth} />}

      {/* Scroll area — full-bleed horizontal scroll, sticky thead + sticky queue col */}
      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar mx-3 sm:mx-6 mb-8 rounded-lg border border-[var(--border)] scroll-smooth">
        <table className="w-max min-w-full text-left text-sm">
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Sticky Queue column */}
              <th className="w-[88px] px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] sticky left-0 z-30">
                <HeaderButton
                  active={sortCol === 'queue_pos'}
                  dir={sortDir}
                  onClick={() => toggleSort('queue_pos')}
                  label="Queue"
                />
              </th>
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.width
                  )}
                >
                  <HeaderButton
                    active={sortCol === col.key}
                    dir={sortDir}
                    onClick={() => toggleSort(col.key)}
                    label={col.header}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] align-middle">
            {filtered.map(row => (
              <tr
                key={`${row.queue_pos}-${row.snapshot_date}`}
                className="group/row transition-colors hover:bg-[var(--row-hover)]"
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)] tabular-nums whitespace-nowrap sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] transition-colors">
                  {row.queue_pos}
                </td>
                {COLS.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-3 text-[var(--muted)] text-xs whitespace-nowrap transition-colors group-hover/row:text-solar',
                      col.numeric && 'tabular-nums',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                  No projects match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
