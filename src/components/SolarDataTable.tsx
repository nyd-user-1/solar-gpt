'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, Info, ArrowUpRight } from 'lucide-react'
import { cn, formatNumber, fmtUsd, fmtPct, fmtKwMedian } from '@/lib/utils'

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
  | 'adoption_rate_pct'
  | 'untapped_buildings'
  | 'untapped_pct'
  | 'untapped_kwh_yr'
  | 'untapped_carbon_tonnes_yr'
  | 'untapped_annual_value_usd'
  | 'untapped_lifetime_value_usd'
  | 'untapped_install_cost_usd'
  | 'median_annual_kwh_per_roof'
  | 'median_annual_savings_usd'
  | 'median_lifetime_savings_usd'
  | 'median_install_cost_usd'
  | 'median_payback_years'
  | 'cars_off_road_equivalent'
  | 'homes_powered_equivalent'

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
  adoption_rate_pct?: number | null
  untapped_buildings?: number | null
  untapped_pct?: number | null
  untapped_kwh_yr?: number | null
  untapped_carbon_tonnes_yr?: number | null
  untapped_annual_value_usd?: number | null
  untapped_lifetime_value_usd?: number | null
  untapped_install_cost_usd?: number | null
  median_annual_kwh_per_roof?: number | null
  median_annual_savings_usd?: number | null
  median_lifetime_savings_usd?: number | null
  median_install_cost_usd?: number | null
  median_payback_years?: number | null
  cars_off_road_equivalent?: number | null
  homes_powered_equivalent?: number | null
}

interface ColDef {
  key: SortableKey
  header: string
  anchor: string
  tooltip: string
  footnote?: string
  fmt: (row: SolarRow) => string
}

function fmtUsdOrDash(v: number | null | undefined): string {
  if (v == null || isNaN(v as number)) return '—'
  return fmtUsd(v as number)
}
function fmtYearsOrDash(v: number | null | undefined): string {
  if (v == null || isNaN(v as number)) return '—'
  return `${(v as number).toFixed(1)} yr`
}

const COLS: ColDef[] = [
  {
    key: 'count_qualified', header: 'Bldgs.', anchor: 'suitable-bldgs',
    tooltip: 'Buildings whose rooftops are suitable for solar panels based on shade, orientation, and roof area.',
    fmt: r => formatNumber(r.count_qualified),
  },
  {
    key: 'percent_covered', header: '% Covered', anchor: 'pct-covered',
    tooltip: 'Share of buildings in this region that Project Sunroof has imagery and analysis for.',
    fmt: r => fmtPct(r.percent_covered),
  },
  {
    key: 'percent_qualified', header: '% Qualified', anchor: 'pct-qualified',
    tooltip: 'Of the buildings analyzed, the share whose rooftops are viable for solar.',
    fmt: r => fmtPct(r.percent_qualified),
  },
  {
    key: 'yearly_sunlight_kwh_total', header: 'kWh', anchor: 'kwh-total',
    tooltip: 'Total annual electricity all qualified rooftops in this region could generate combined.',
    fmt: r => formatNumber(r.yearly_sunlight_kwh_total, { decimals: 2 }),
  },
  {
    key: 'number_of_panels_total', header: 'Total Panels', anchor: 'total-panels',
    tooltip: 'Total number of solar panels that could fit across all qualified rooftops.',
    fmt: r => formatNumber(r.number_of_panels_total),
  },
  {
    key: 'carbon_offset_metric_tons', header: 'CO₂ Offset', anchor: 'co2-offset',
    tooltip: 'Metric tons of CO₂ avoided per year if every qualified rooftop went solar.',
    fmt: r => formatNumber(r.carbon_offset_metric_tons, { suffix: 't' }),
  },
  {
    key: 'number_of_panels_median', header: 'Median Panels', anchor: 'avg-panels',
    tooltip: 'Typical number of panels that fit on a qualified rooftop in this region.',
    fmt: r => formatNumber(r.number_of_panels_median),
  },
  {
    key: 'kw_total', header: 'kW Total', anchor: 'kw-total',
    tooltip: 'Combined nameplate capacity if all qualified rooftops were fully outfitted.',
    fmt: r => formatNumber(r.kw_total, { decimals: 2 }),
  },
  {
    key: 'kw_median', header: 'kW Median', anchor: 'kw-median',
    tooltip: 'Typical system size for a single qualified building in this region.',
    fmt: r => fmtKwMedian(r.kw_median),
  },
  {
    key: 'existing_installs_count', header: 'Installed', anchor: 'existing-installs',
    tooltip: 'Solar systems already installed and operating in this region.',
    fmt: r => formatNumber(r.existing_installs_count),
  },
  // ── Untapped / opportunity ────────────────────────────────────────────────
  {
    key: 'adoption_rate_pct', header: 'Adoption', anchor: 'adoption-rate',
    tooltip: 'Share of qualified rooftops that already have a solar installation.',
    fmt: r => r.adoption_rate_pct == null ? '—' : `${(r.adoption_rate_pct as number).toFixed(1)}%`,
  },
  {
    key: 'untapped_buildings', header: 'Untapped Bldgs.', anchor: 'untapped-bldgs',
    tooltip: 'Qualified buildings in this region without any existing installation.',
    fmt: r => formatNumber(r.untapped_buildings),
  },
  {
    key: 'untapped_pct', header: '% Untapped', anchor: 'untapped-pct',
    tooltip: 'Share of qualified rooftops that have not yet gone solar.',
    fmt: r => fmtPct(r.untapped_pct),
  },
  {
    key: 'untapped_kwh_yr', header: 'Untapped kWh/yr', anchor: 'untapped-kwh',
    tooltip: 'Annual electricity left on the table if untapped rooftops stay unbuilt.',
    fmt: r => formatNumber(r.untapped_kwh_yr, { decimals: 2 }),
  },
  {
    key: 'untapped_carbon_tonnes_yr', header: 'Untapped CO₂', anchor: 'untapped-co2',
    tooltip: 'Metric tons of CO₂ that would be avoided per year if untapped rooftops were built.',
    fmt: r => formatNumber(r.untapped_carbon_tonnes_yr, { suffix: 't' }),
  },
  {
    key: 'untapped_annual_value_usd', header: 'Potential/yr', anchor: 'potential-annual',
    tooltip: 'Combined dollar value of energy + carbon if every untapped rooftop went solar — per year.',
    footnote: 'Residential rates as of May 2026 (EIA Form 826). Actual rates vary by utility and tariff.',
    fmt: r => fmtUsdOrDash(r.untapped_annual_value_usd),
  },
  {
    key: 'untapped_lifetime_value_usd', header: 'Potential/life', anchor: 'potential-lifetime',
    tooltip: '25-year lifetime value of fully developing every untapped rooftop in this region.',
    footnote: 'Residential rates as of May 2026 (EIA Form 826). Actual rates vary by utility and tariff.',
    fmt: r => fmtUsdOrDash(r.untapped_lifetime_value_usd),
  },
  {
    key: 'untapped_install_cost_usd', header: 'Untapped Cost', anchor: 'untapped-cost',
    tooltip: 'Estimated upfront cost to install solar on every currently untapped rooftop.',
    fmt: r => fmtUsdOrDash(r.untapped_install_cost_usd),
  },
  // ── Median per-roof economics ─────────────────────────────────────────────
  {
    key: 'median_annual_kwh_per_roof', header: 'Median kWh/roof', anchor: 'median-kwh',
    tooltip: 'Annual kWh a typical qualified roof in this region would produce.',
    fmt: r => formatNumber(r.median_annual_kwh_per_roof, { decimals: 0 }),
  },
  {
    key: 'median_annual_savings_usd', header: 'Median Savings/yr', anchor: 'median-savings',
    tooltip: 'Typical first-year electric-bill savings for a homeowner in this region going solar.',
    footnote: 'Residential rates as of May 2026 (EIA Form 826). Actual rates vary by utility and tariff.',
    fmt: r => fmtUsdOrDash(r.median_annual_savings_usd),
  },
  {
    key: 'median_lifetime_savings_usd', header: 'Median Life Savings', anchor: 'median-life-savings',
    tooltip: '25-year electric-bill savings for the typical solar homeowner in this region.',
    footnote: 'Residential rates as of May 2026 (EIA Form 826). Actual rates vary by utility and tariff.',
    fmt: r => fmtUsdOrDash(r.median_lifetime_savings_usd),
  },
  {
    key: 'median_install_cost_usd', header: 'Median Cost', anchor: 'median-cost',
    tooltip: 'Typical upfront install cost for a single home in this region.',
    fmt: r => fmtUsdOrDash(r.median_install_cost_usd),
  },
  {
    key: 'median_payback_years', header: 'Median Payback', anchor: 'median-payback',
    tooltip: 'Years until the typical homeowner recoups their install cost through bill savings.',
    footnote: 'Residential rates as of May 2026 (EIA Form 826). Actual rates vary by utility and tariff.',
    fmt: r => fmtYearsOrDash(r.median_payback_years),
  },
  // ── Equivalents ───────────────────────────────────────────────────────────
  {
    key: 'cars_off_road_equivalent', header: 'Cars Off Road', anchor: 'cars-equiv',
    tooltip: 'Number of gas-powered cars taken off the road equivalent to this region’s untapped solar.',
    fmt: r => formatNumber(r.cars_off_road_equivalent),
  },
  {
    key: 'homes_powered_equivalent', header: 'Homes Powered', anchor: 'homes-equiv',
    tooltip: 'Number of average US homes that could be fully powered by this region’s untapped solar.',
    fmt: r => formatNumber(r.homes_powered_equivalent),
  },
]

interface ExtraCol<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

interface Props<T extends SolarRow> {
  rows: T[]
  sortCol: SortableKey | 'region'
  sortDir: 'asc' | 'desc'
  onSort: (key: SortableKey) => void
  renderRegion: (row: T) => React.ReactNode
  regionLabel?: string
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
    <th className="px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] whitespace-nowrap">
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
        <div className="pointer-events-none group-hover/col:pointer-events-auto absolute top-full left-0 z-50 mt-2 hidden group-hover/col:block w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl text-left overflow-hidden normal-case tracking-normal whitespace-normal">
          <div className="px-3.5 py-3 whitespace-normal">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--txt)] mb-1.5 whitespace-normal break-words">{col.header}</p>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed font-normal whitespace-normal break-words">{col.tooltip}</p>
            {col.footnote && (
              <p className="mt-2 text-[10.5px] italic text-[var(--muted2)] leading-snug font-normal whitespace-normal break-words">{col.footnote}</p>
            )}
          </div>
          <Link
            href={`/glossary#${col.anchor}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-[11px] font-medium text-solar hover:bg-[var(--inp-bg)] transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3 w-3" />
              Learn more
            </span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </th>
  )
}

export function SolarDataTable<T extends SolarRow>({ rows, sortCol, sortDir, onSort, renderRegion, regionLabel = 'Region', hideCols, extraCols, getRowHref }: Props<T>) {
  const router = useRouter()
  const visibleCols = hideCols ? COLS.filter(c => !hideCols.includes(c.key)) : COLS
  return (
    <div className="mx-3 sm:mx-6 mb-8 rounded-lg border border-[var(--border)] overflow-x-auto scroll-smooth">
      <table className="w-max min-w-full text-left text-sm">
        <thead className="sticky top-0 z-20">
          <tr>
            {/* Region — always visible, sticky during horizontal scroll */}
            <th className="w-[200px] px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] sticky left-0 z-30">
              <button
                onClick={() => onSort('region')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--txt)]',
                  sortCol === 'region' ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
                )}
              >
                {regionLabel}
                {sortCol === 'region'
                  ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  : <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />}
              </button>
            </th>
            {extraCols?.map(col => (
              <th
                key={col.key}
                className="px-3 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] whitespace-nowrap"
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
                'group/row transition-colors hover:bg-[var(--row-hover)]',
                href && 'cursor-pointer',
              )}
            >
              <td className="px-4 py-3 font-medium text-[var(--txt)] whitespace-nowrap sticky left-0 z-[1] overflow-hidden bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] transition-colors">
                {renderRegion(row)}
              </td>
              {extraCols?.map(col => (
                <td
                  key={col.key}
                  className="px-3 py-3 text-[var(--muted)] text-xs whitespace-nowrap transition-colors group-hover/row:text-solar"
                >
                  {col.render(row)}
                </td>
              ))}
              {visibleCols.map(col => (
                <td
                  key={col.key}
                  className="px-3 py-3 tabular-nums text-left text-[var(--muted)] text-xs whitespace-nowrap transition-colors group-hover/row:text-solar"
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
