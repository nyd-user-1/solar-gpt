'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn, formatNumber, fmtPct, fmtKwMedian } from '@/lib/utils'

export type SortableKey =
  | 'region'
  | 'count_qualified'
  | 'percent_covered'
  | 'percent_qualified'
  | 'yearly_sunlight_kwh_total'
  | 'number_of_panels_total'
  | 'carbon_offset_metric_tons'
  | 'number_of_panels_median'
  | 'kw_total'
  | 'kw_median'
  | 'existing_installs_count'

export interface SolarRow {
  id: string | number
  count_qualified?: number | null
  percent_covered?: number | null
  percent_qualified?: number | null
  yearly_sunlight_kwh_total?: number | null
  number_of_panels_total?: number | null
  carbon_offset_metric_tons?: number | null
  number_of_panels_median?: number | null
  kw_total?: number | null
  kw_median?: number | null
  existing_installs_count?: number | null
}

interface ColDef {
  key: SortableKey
  header: string
  anchor: string
  tooltip: string
  mobile: boolean
  fmt: (row: SolarRow) => string
}

const COLS: ColDef[] = [
  {
    key: 'count_qualified', header: 'Bldgs.', anchor: 'suitable-bldgs', mobile: true,
    tooltip: 'Buildings whose rooftops are suitable for solar panels based on shade, orientation, and roof area.',
    fmt: r => formatNumber(r.count_qualified),
  },
  {
    key: 'percent_covered', header: '% Covered', anchor: 'pct-covered', mobile: false,
    tooltip: 'Share of buildings in this region that Project Sunroof has imagery and analysis for.',
    fmt: r => fmtPct(r.percent_covered),
  },
  {
    key: 'percent_qualified', header: '% Qualified', anchor: 'pct-qualified', mobile: false,
    tooltip: 'Of the buildings analyzed, the share whose rooftops are viable for solar.',
    fmt: r => fmtPct(r.percent_qualified),
  },
  {
    key: 'yearly_sunlight_kwh_total', header: 'kWh', anchor: 'kwh-total', mobile: true,
    tooltip: 'Total annual electricity all qualified rooftops in this region could generate combined.',
    fmt: r => formatNumber(r.yearly_sunlight_kwh_total, { decimals: 2 }),
  },
  {
    key: 'number_of_panels_total', header: 'Total Panels', anchor: 'total-panels', mobile: false,
    tooltip: 'Total number of solar panels that could fit across all qualified rooftops.',
    fmt: r => formatNumber(r.number_of_panels_total),
  },
  {
    key: 'carbon_offset_metric_tons', header: 'CO₂ Offset', anchor: 'co2-offset', mobile: true,
    tooltip: 'Metric tons of CO₂ avoided per year if every qualified rooftop went solar.',
    fmt: r => formatNumber(r.carbon_offset_metric_tons, { suffix: 't' }),
  },
  {
    key: 'number_of_panels_median', header: 'Median Panels', anchor: 'avg-panels', mobile: false,
    tooltip: 'Typical number of panels that fit on a qualified rooftop in this region.',
    fmt: r => formatNumber(r.number_of_panels_median),
  },
  {
    key: 'kw_total', header: 'kW Total', anchor: 'kw-total', mobile: false,
    tooltip: 'Combined nameplate capacity if all qualified rooftops were fully outfitted.',
    fmt: r => formatNumber(r.kw_total, { decimals: 2 }),
  },
  {
    key: 'kw_median', header: 'kW Median', anchor: 'kw-median', mobile: false,
    tooltip: 'Typical system size for a single qualified building in this region.',
    fmt: r => fmtKwMedian(r.kw_median),
  },
  {
    key: 'existing_installs_count', header: 'Installed', anchor: 'existing-installs', mobile: true,
    tooltip: 'Solar systems already installed and operating in this region.',
    fmt: r => formatNumber(r.existing_installs_count),
  },
]

interface ExtraCol<T> {
  key: string
  header: string
  mobile?: boolean
  render: (row: T) => React.ReactNode
}

interface Props<T extends SolarRow> {
  rows: T[]
  sortCol: SortableKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortableKey) => void
  renderRegion: (row: T) => React.ReactNode
  hideCols?: SortableKey[]
  extraCols?: ExtraCol<T>[]
  getRowHref?: (row: T) => string
}

function ColHeader({ col, active, dir, onSort }: {
  col: ColDef
  active: boolean
  dir: 'asc' | 'desc'
  onSort: () => void
}) {
  return (
    <th className={cn(
      'px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] whitespace-nowrap',
      !col.mobile && 'hidden md:table-cell',
    )}>
      <div className="relative group/col inline-block">
        <button
          onClick={onSort}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--txt)]',
            active ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
          )}
        >
          {col.header}
          {active
            ? dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            : <ChevronUp className="h-3 w-3 opacity-0 group-hover/col:opacity-40" />
          }
        </button>
        {/* Tooltip */}
        <div className="pointer-events-none group-hover/col:pointer-events-auto absolute top-full left-0 z-50 mt-1 hidden group-hover/col:block w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl text-left">
          <p className="text-xs text-[var(--muted)] leading-relaxed">{col.tooltip}</p>
          <Link
            href={`/glossary#${col.anchor}`}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--solar)] hover:underline"
            onClick={e => e.stopPropagation()}
          >
            ⓘ Learn more →
          </Link>
        </div>
      </div>
    </th>
  )
}

export function SolarDataTable<T extends SolarRow>({ rows, sortCol, sortDir, onSort, renderRegion, hideCols, extraCols, getRowHref }: Props<T>) {
  const router = useRouter()
  const visibleCols = hideCols ? COLS.filter(c => !hideCols.includes(c.key)) : COLS
  return (
    <div className="overflow-x-auto no-scrollbar mx-6 mb-8 rounded-lg border border-[var(--border)]">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr>
            {/* Region — always visible, no tooltip */}
            <th className="min-w-[160px] px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] sticky left-0 z-10 whitespace-nowrap">
              <button
                onClick={() => onSort('region')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--txt)]',
                  sortCol === 'region' ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
                )}
              >
                Region
                {sortCol === 'region'
                  ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  : <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />}
              </button>
            </th>
            {extraCols?.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] whitespace-nowrap',
                  !col.mobile && 'hidden md:table-cell',
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{col.header}</span>
              </th>
            ))}
            {visibleCols.map(col => (
              <ColHeader
                key={col.key}
                col={col}
                active={sortCol === col.key}
                dir={sortDir}
                onSort={() => onSort(col.key)}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] align-middle">
          {rows.map(row => {
            const href = getRowHref?.(row)
            return (
            <tr
              key={row.id}
              onClick={href ? () => router.push(href) : undefined}
              className={cn(
                'group/row transition-colors hover:bg-[var(--inp-bg)]',
                href && 'cursor-pointer',
              )}
            >
              <td className="px-4 py-3 font-medium text-[var(--txt)] sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--inp-bg)] transition-colors whitespace-nowrap">
                {renderRegion(row)}
              </td>
              {extraCols?.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-3 text-[var(--muted)] text-xs whitespace-nowrap',
                    !col.mobile && 'hidden md:table-cell',
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
              {visibleCols.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-3 tabular-nums text-left text-[var(--muted)] text-xs whitespace-nowrap',
                    !col.mobile && 'hidden md:table-cell',
                  )}
                >
                  {col.fmt(row)}
                </td>
              ))}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
