'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { cn } from '@/lib/utils'
import { fmtUsd, fmtNum } from '@/lib/utils'
import { DashboardsDrawer } from '@/components/DashboardsDrawer'
import {
  type DashboardConfig,
  type DashboardTabId,
  type MetricFormat,
} from '@/lib/dashboard-config'
import type { DashboardTableRow } from '@/lib/queries'

function fmtValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'usd':         return fmtUsd(value)
    case 'count':       return fmtNum(value)
    case 'percent':     return `${value.toFixed(1)}%`
    case 'co2_tons':    return `${fmtNum(value)} t`
    case 'usd_per_mwh': return `$${value.toFixed(2)}/MWh`
    case 'co2_per_mwh': return `${value.toFixed(3)} kg/MWh`
  }
}

function fmtHeader(value: number, format: MetricFormat): string {
  switch (format) {
    case 'usd':         return fmtUsd(value)
    case 'count':       return fmtNum(value)
    case 'percent':     return `${value.toFixed(1)}%`
    case 'co2_tons':    return `${fmtNum(value)} t CO₂`
    case 'usd_per_mwh': return `$${value.toFixed(2)}/MWh`
    case 'co2_per_mwh': return `${value.toFixed(3)} kg/MWh`
  }
}

interface Props {
  slug: string
  config: DashboardConfig
  initialRows: DashboardTableRow[]
  initialTotal: number
  initialChartData: { name: string; value: number }[]
}

export function DashboardDetailClient({
  slug,
  config,
  initialRows,
  initialTotal,
  initialChartData,
}: Props) {
  const [activeTabId, setActiveTabId] = useState<DashboardTabId>(config.tabs[0].id)
  const [rows, setRows] = useState(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [chartData, setChartData] = useState(initialChartData)
  const [tabLoading, setTabLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [childrenMap, setChildrenMap] = useState<Record<string, DashboardTableRow[]>>({})
  const [childLoading, setChildLoading] = useState<Set<string>>(new Set())

  const activeTab = config.tabs.find(t => t.id === activeTabId) ?? config.tabs[0]

  const switchTab = useCallback(async (tabId: DashboardTabId) => {
    if (tabId === activeTabId) return
    setActiveTabId(tabId)
    setExpandedIds(new Set())
    setChildrenMap({})
    setTabLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${slug}?tab=${tabId}`)
      const data = await res.json()
      setRows(data.rows ?? [])
      setTotal(data.total ?? 0)
      setChartData(data.chartData ?? [])
    } catch {
      setRows([])
    } finally {
      setTabLoading(false)
    }
  }, [slug, activeTabId])

  const toggleRow = useCallback(async (row: DashboardTableRow) => {
    const id = row.id
    if (expandedIds.has(id)) {
      setExpandedIds(prev => { const s = new Set(prev); s.delete(id); return s })
      return
    }
    setExpandedIds(prev => new Set([...prev, id]))
    if (childrenMap[id] || !row.hasChildren) return

    setChildLoading(prev => new Set([...prev, id]))
    try {
      const res = await fetch(
        `/api/dashboard/${slug}?tab=${activeTabId}&parentId=${encodeURIComponent(id)}`,
      )
      const data = await res.json()
      setChildrenMap(prev => ({ ...prev, [id]: data.rows ?? [] }))
    } finally {
      setChildLoading(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }, [slug, activeTabId, expandedIds, childrenMap])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header Band ─────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-4 py-4 md:px-6">

          {/* Big number */}
          <div className="mb-3 text-right">
            <div className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--txt)] tabular-nums">
              {fmtHeader(total, activeTab.format)}
            </div>
            <div className="text-sm text-[var(--muted)] mt-0.5">{config.headerContext}</div>
          </div>

          {/* Full-width chart */}
          {chartData.length > 1 && (
            <div className="h-20 md:h-24 mb-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                {config.chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <defs>
                      <linearGradient id={`detail-${slug}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={1.5}
                      fill={`url(#detail-${slug})`}
                      dot={false}
                      animationDuration={400}
                    />
                    <XAxis dataKey="name" hide />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--txt)',
                      }}
                      formatter={(v) => [fmtValue(Number(v ?? 0), activeTab.format), activeTab.label]}
                      labelFormatter={(l) => String(l ?? '')}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <Bar dataKey="value" fill={config.color} radius={[2, 2, 0, 0]} animationDuration={400} />
                    <XAxis dataKey="name" hide />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--txt)',
                      }}
                      formatter={(v) => [fmtValue(Number(v ?? 0), activeTab.format), activeTab.label]}
                      labelFormatter={(l) => String(l ?? '')}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab row: Dashboards picker + dimension tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <DashboardsDrawer />
            <div className="h-4 w-px bg-[var(--border)] mx-1" />
            {config.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  activeTabId === tab.id
                    ? 'bg-[var(--surface)] text-[var(--txt)] font-medium shadow-sm border border-[var(--border)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--txt)]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {tabLoading ? (
          <div className="px-4 md:px-6 py-4 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--surface)] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 px-4 text-[var(--muted)]">
            No data available for this view.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[1fr_120px_80px] gap-4 px-6 py-3 text-xs text-[var(--muted)] font-medium uppercase tracking-wider bg-[var(--surface)] sticky top-0 z-10 border-b border-[var(--border)]">
              <span>Name</span>
              <span className="text-right">{activeTab.label}</span>
              <span className="text-right">Share</span>
            </div>

            {rows.map((row) => (
              <DashboardRow
                key={row.id}
                row={row}
                isExpanded={expandedIds.has(row.id)}
                isChildLoading={childLoading.has(row.id)}
                children={childrenMap[row.id] ?? null}
                onToggle={() => toggleRow(row)}
                format={activeTab.format}
                color={config.color}
              />
            ))}

            {/* Total row */}
            <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-4 bg-[var(--surface)] font-semibold text-[var(--txt)]">
              <span>Total</span>
              <span className="text-right tabular-nums">{fmtValue(total, activeTab.format)}</span>
              <span className="hidden md:block text-right">100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Row component ─────────────────────────────────────────────────

interface RowProps {
  row: DashboardTableRow
  isExpanded: boolean
  isChildLoading: boolean
  children: DashboardTableRow[] | null
  onToggle: () => void
  format: MetricFormat
  color: string
}

function DashboardRow({ row, isExpanded, isChildLoading, children, onToggle, format, color }: RowProps) {
  return (
    <div>
      {/* Main row */}
      <div
        onClick={row.hasChildren ? onToggle : undefined}
        className={cn(
          'group grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-3.5 items-center transition-colors',
          row.hasChildren ? 'cursor-pointer hover:bg-[var(--surface)]' : 'cursor-default',
        )}
      >
        {/* Name */}
        <div className="flex items-center gap-2 min-w-0">
          {row.hasChildren ? (
            <span className="flex-shrink-0 text-[var(--muted)]">
              {isExpanded
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />
              }
            </span>
          ) : (
            <span className="flex-shrink-0 w-4" />
          )}
          <span className="font-medium text-sm text-[var(--txt)] truncate">{row.name}</span>
          {/* Mobile: value inline */}
          <span className="md:hidden text-sm text-[var(--muted)] ml-auto pl-2 whitespace-nowrap tabular-nums">
            {fmtValue(row.value, format)}
          </span>
        </div>

        {/* Desktop: value */}
        <span className="hidden md:block text-right text-sm font-medium text-[var(--txt)] tabular-nums">
          {fmtValue(row.value, format)}
        </span>

        {/* Share bar */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(row.sharePct, 100)}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-[var(--muted)] tabular-nums w-8 text-right">
            {row.sharePct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Child loading skeleton */}
      {isChildLoading && (
        <div className="bg-[var(--surface)] px-6 py-3 space-y-2 border-t border-[var(--border)]">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 bg-[var(--border)] rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Expanded child rows */}
      {isExpanded && children && children.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)]/50">
          {children.map((child) => (
            <div
              key={child.id}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-3 pl-10 md:pl-14 items-center hover:bg-[var(--surface)] transition-colors"
            >
              <span className="text-sm text-[var(--txt)] truncate">{child.name}</span>
              <span className="text-right text-sm text-[var(--muted)] tabular-nums">
                {fmtValue(child.value, format)}
              </span>
              <div className="hidden md:flex items-center gap-2">
                <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(child.sharePct, 100)}%`, backgroundColor: color, opacity: 0.6 }}
                  />
                </div>
                <span className="text-xs text-[var(--muted2)] tabular-nums w-8 text-right">
                  {child.sharePct.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
