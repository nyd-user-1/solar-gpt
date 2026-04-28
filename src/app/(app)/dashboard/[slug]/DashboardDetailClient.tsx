'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, ChevronLeft, LayoutDashboard } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { cn, fmtUsd, fmtNum } from '@/lib/utils'
import { nameToSlug, geaToSlug } from '@/lib/queries'
import {
  type DashboardConfig, type DashboardTabId, type MetricFormat,
  DASHBOARD_CONFIGS,
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

function getRowHref(row: DashboardTableRow, tabId: DashboardTabId, parentName?: string): string | null {
  switch (tabId) {
    case 'state':
      return `/states/${nameToSlug(row.name)}`
    case 'gea':
      return `/gea-regions/${geaToSlug(row.name)}`
    case 'county': {
      const parts = row.name.split(', ')
      if (parts.length >= 2) {
        const state = parts[parts.length - 1]
        const county = parts.slice(0, -1).join(', ')
        return `/counties/${nameToSlug(state)}/${nameToSlug(county)}`
      }
      if (parentName) return `/counties/${nameToSlug(parentName)}/${nameToSlug(row.name)}`
      return null
    }
    case 'city': {
      const parts = row.name.split(', ')
      if (parts.length >= 2) {
        const state = parts[parts.length - 1]
        const city = parts.slice(0, -1).join(', ')
        return `/cities/${nameToSlug(state)}/${nameToSlug(city)}`
      }
      if (parentName) return `/cities/${nameToSlug(parentName)}/${nameToSlug(row.name)}`
      return null
    }
    default: return null
  }
}

interface Props {
  slug: string
  config: DashboardConfig
  initialRows: DashboardTableRow[]
  initialTotal: number
  initialChartData: { name: string; value: number }[]
}

export function DashboardDetailClient({ slug, config, initialRows, initialTotal, initialChartData }: Props) {
  const router = useRouter()

  const visibleTabs = config.tabs.filter(t => t.id !== 'grade')
  const [activeTabId, setActiveTabId] = useState<DashboardTabId>(visibleTabs[0].id)
  const [rows, setRows] = useState(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [chartData, setChartData] = useState(initialChartData)
  const [tabLoading, setTabLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [childrenMap, setChildrenMap] = useState<Record<string, DashboardTableRow[]>>({})
  const [childLoading, setChildLoading] = useState<Set<string>>(new Set())
  const [focusedRow, setFocusedRow] = useState<DashboardTableRow | null>(null)

  const activeTab = visibleTabs.find(t => t.id === activeTabId) ?? visibleTabs[0]

  const displayTotal = focusedRow ? focusedRow.value : total
  const displayChartData = focusedRow && childrenMap[focusedRow.id]?.length
    ? childrenMap[focusedRow.id].slice(0, 25).map(r => ({ name: r.name, value: r.value }))
    : chartData

  // Send total to AppLayout header
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('solargpt:dashboard-header', {
      detail: { formatted: fmtHeader(displayTotal, activeTab.format), color: config.color }
    }))
    return () => {
      window.dispatchEvent(new CustomEvent('solargpt:dashboard-header', { detail: null }))
    }
  }, [displayTotal, activeTab.format, config.color])

  // Dashboard cycle
  const n = DASHBOARD_CONFIGS.length
  const currentIdx = DASHBOARD_CONFIGS.findIndex(c => c.slug === slug)
  const prevSlug = DASHBOARD_CONFIGS[(currentIdx - 1 + n) % n].slug
  const nextSlug = DASHBOARD_CONFIGS[(currentIdx + 1) % n].slug

  const switchTab = useCallback(async (tabId: DashboardTabId) => {
    if (tabId === activeTabId) return
    setActiveTabId(tabId); setExpandedIds(new Set()); setChildrenMap({}); setFocusedRow(null)
    setTabLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${slug}?tab=${tabId}`)
      const data = await res.json()
      setRows(data.rows ?? []); setTotal(data.total ?? 0); setChartData(data.chartData ?? [])
    } catch { setRows([]) } finally { setTabLoading(false) }
  }, [slug, activeTabId])

  const toggleRow = useCallback(async (row: DashboardTableRow) => {
    const id = row.id
    if (expandedIds.has(id)) {
      setExpandedIds(prev => { const s = new Set(prev); s.delete(id); return s })
      if (focusedRow?.id === id) setFocusedRow(null)
      return
    }
    setExpandedIds(prev => new Set([...prev, id]))
    if (row.hasChildren) setFocusedRow(row)
    if (childrenMap[id] || !row.hasChildren) return
    setChildLoading(prev => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/dashboard/${slug}?tab=${activeTabId}&parentId=${encodeURIComponent(id)}`)
      const data = await res.json()
      setChildrenMap(prev => ({ ...prev, [id]: data.rows ?? [] }))
    } finally {
      setChildLoading(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }, [slug, activeTabId, expandedIds, childrenMap, focusedRow])

  const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header band */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-4 py-4 md:px-6">

          {/* Chart */}
          {displayChartData.length > 1 && (
            <div className="h-20 md:h-24 mb-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                {config.chartType === 'area' ? (
                  <AreaChart data={displayChartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <defs>
                      <linearGradient id={`detail-${slug}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={1.5}
                      fill={`url(#detail-${slug})`} dot={false} animationDuration={400} />
                    <XAxis dataKey="name" hide />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v) => [fmtValue(Number(v ?? 0), activeTab.format), activeTab.label]}
                      labelFormatter={(l) => String(l ?? '')}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={displayChartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <Bar dataKey="value" fill={config.color} radius={[2, 2, 0, 0]} animationDuration={400} />
                    <XAxis dataKey="name" hide />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v) => [fmtValue(Number(v ?? 0), activeTab.format), activeTab.label]}
                      labelFormatter={(l) => String(l ?? '')}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab row */}
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboards
            </Link>
            <div className="h-4 w-px bg-[var(--border)] mx-1" />
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTabId === tab.id
                    ? 'text-[var(--txt)] border border-blue-500/50 bg-white shadow-sm dark:bg-[var(--surface)]'
                    : 'text-[var(--muted)] hover:text-[var(--txt)]',
                )}>{tab.label}</button>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => router.push(`/dashboard/${prevSlug}`)}
                className="h-7 w-7 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => router.push(`/dashboard/${nextSlug}`)}
                className="h-7 w-7 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {tabLoading ? (
          <div className="px-6 py-4 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--border)] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)]">No data available.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            <div className="hidden md:grid grid-cols-[1fr_120px_80px] gap-4 px-6 py-3 text-xs text-[var(--muted)] font-medium uppercase tracking-wider bg-[var(--surface)] sticky top-0 z-10 border-b border-[var(--border)]">
              <span>Name</span>
              <span className="text-right">{activeTab.label}</span>
              <span className="text-right">Share</span>
            </div>
            {sortedRows.map(row => (
              <DashboardRow
                key={row.id} row={row}
                isExpanded={expandedIds.has(row.id)}
                isChildLoading={childLoading.has(row.id)}
                children={childrenMap[row.id] ?? null}
                onToggle={() => toggleRow(row)}
                format={activeTab.format} color={config.color}
                tabId={activeTabId} childTabId={activeTab.childTab}
              />
            ))}
            <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-4 bg-[var(--surface)] font-semibold text-[var(--txt)]">
              <span>{focusedRow ? focusedRow.name : 'Total'}</span>
              <span className="text-right tabular-nums">{fmtValue(displayTotal, activeTab.format)}</span>
              <span className="hidden md:block text-right">100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardRow({ row, isExpanded, isChildLoading, children, onToggle, format, color, tabId, childTabId }: {
  row: DashboardTableRow; isExpanded: boolean; isChildLoading: boolean
  children: DashboardTableRow[] | null; onToggle: () => void
  format: MetricFormat; color: string; tabId: DashboardTabId; childTabId?: DashboardTabId
}) {
  const router = useRouter()
  const href = getRowHref(row, tabId)
  const sortedChildren = children ? [...children].sort((a, b) => a.name.localeCompare(b.name)) : null

  return (
    <div>
      <div
        onClick={() => row.hasChildren ? onToggle() : href && router.push(href)}
        className="group/row grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-3.5 items-center transition-colors hover:bg-[var(--inp-bg)] cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 text-[var(--muted)] group-hover/row:text-solar transition-colors">
            {row.hasChildren
              ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
              : <span className="w-4 inline-block" />}
          </span>
          <span className="font-medium text-sm text-[var(--txt)] group-hover/row:text-solar truncate transition-colors">{row.name}</span>
          <span className="md:hidden text-sm text-[var(--muted)] group-hover/row:text-solar ml-auto pl-2 whitespace-nowrap tabular-nums transition-colors">{fmtValue(row.value, format)}</span>
        </div>
        <span className="hidden md:block text-right text-sm font-medium text-[var(--txt)] group-hover/row:text-solar tabular-nums transition-colors">{fmtValue(row.value, format)}</span>
        <div className="hidden md:flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(row.sharePct, 100)}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs text-[var(--muted)] group-hover/row:text-solar tabular-nums w-8 text-right transition-colors">{row.sharePct.toFixed(0)}%</span>
        </div>
      </div>

      {isChildLoading && (
        <div className="bg-[var(--inp-bg)] px-6 py-3 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-9 bg-[var(--border)] rounded animate-pulse" />)}
        </div>
      )}

      {isExpanded && sortedChildren && sortedChildren.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--inp-bg)]/40">
          {sortedChildren.map(child => {
            const childHref = childTabId ? getRowHref(child, childTabId, row.name) : null
            return (
              <div key={child.id}
                onClick={() => childHref && router.push(childHref)}
                className="group/row grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_80px] gap-4 px-4 md:px-6 py-3 pl-10 md:pl-14 items-center hover:bg-[var(--inp-bg)] transition-colors cursor-pointer"
              >
                <span className="text-sm text-[var(--txt)] group-hover/row:text-solar truncate transition-colors">{child.name}</span>
                <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-solar tabular-nums transition-colors">{fmtValue(child.value, format)}</span>
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(child.sharePct, 100)}%`, backgroundColor: color, opacity: 0.6 }} />
                  </div>
                  <span className="text-xs text-[var(--muted)] group-hover/row:text-solar tabular-nums w-8 text-right transition-colors">{child.sharePct.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
