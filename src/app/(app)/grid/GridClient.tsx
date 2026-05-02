'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { GEA_COLORS } from '@/lib/gea-colors'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EiaRow {
  period: string
  respondent?: string
  fueltype?: string
  stateid?: string
  sectorid?: string
  // EIA v2 field names vary by endpoint:
  value?: number | string    // rto/region-data, rto/fuel-type-data
  price?: number | string    // retail-sales
  [key: string]: unknown
}

interface Props {
  baLoad: EiaRow[]
  retailRates: EiaRow[]
  retailHistory: EiaRow[]
  fuelMix: EiaRow[]
  demandData: EiaRow[]
  netGenData: EiaRow[]
}

// ─── Region definitions ───────────────────────────────────────────────────────
// Maps every Cambium GEA to its EIA-930 BA code (null = no direct mapping)
const GEA_ROWS: { gea: string; label: string; ba: string | null }[] = [
  { gea: 'CAISO',              label: 'CAISO',              ba: 'CISO' },
  { gea: 'ERCOT',              label: 'ERCOT',              ba: 'ERCO' },
  { gea: 'FRCC',               label: 'FRCC',               ba: null   },
  { gea: 'ISONE',              label: 'ISONE',              ba: 'ISNE' },
  { gea: 'MISO_Central',       label: 'MISO Central',       ba: 'MISO' },
  { gea: 'MISO_North',         label: 'MISO North',         ba: 'MISO' },
  { gea: 'MISO_South',         label: 'MISO South',         ba: 'MISO' },
  { gea: 'NYISO',              label: 'NYISO',              ba: 'NYIS' },
  { gea: 'NorthernGrid_East',  label: 'NorthernGrid East',  ba: 'BPAT' },
  { gea: 'NorthernGrid_South', label: 'NorthernGrid South', ba: null   },
  { gea: 'NorthernGrid_West',  label: 'NorthernGrid West',  ba: 'PACW' },
  { gea: 'PJM_East',           label: 'PJM East',           ba: 'PJM'  },
  { gea: 'PJM_West',           label: 'PJM West',           ba: 'PJM'  },
  { gea: 'SERTP',              label: 'SERTP',              ba: 'SOCO' },
  { gea: 'SPP_North',          label: 'SPP North',          ba: 'SWPP' },
  { gea: 'SPP_South',          label: 'SPP South',          ba: 'SWPP' },
  { gea: 'WestConnect_North',  label: 'WestConnect North',  ba: 'WACM' },
  { gea: 'WestConnect_South',  label: 'WestConnect South',  ba: 'AZPS' },
]

// Chart BAs (subset with richest EIA-930 data) and their representative GEA color
const CHART_BAS: { ba: string; label: string; color: string }[] = [
  { ba: 'ERCO', label: 'ERCOT',  color: GEA_COLORS['ERCOT'] },
  { ba: 'CISO', label: 'CAISO',  color: GEA_COLORS['CAISO'] },
  { ba: 'SWPP', label: 'SPP',    color: GEA_COLORS['SPP_North'] },
  { ba: 'PJM',  label: 'PJM',    color: GEA_COLORS['PJM_West'] },
  { ba: 'MISO', label: 'MISO',   color: GEA_COLORS['MISO_Central'] },
  { ba: 'NYIS', label: 'NYISO',  color: GEA_COLORS['NYISO'] },
  { ba: 'ISNE', label: 'ISONE',  color: GEA_COLORS['ISONE'] },
]

const FUEL_COLORS: Record<string, string> = {
  SUN: '#f59e0b', WND: '#10b981', WAT: '#3b82f6', NUC: '#8b5cf6',
  NG:  '#6366f1', COL: '#64748b', OIL: '#f97316', OTH: '#94a3b8',
  BAT: '#06b6d4', GEO: '#84cc16',
}

const TABS = ['Retail Rates', 'Fuel Mix', 'Load', 'Renewables', 'Capacity'] as const
type Tab = typeof TABS[number]

const CARD = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-3'
const CHART_TITLE = 'text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3'

function fmtNum(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 12,
  },
}

// ─── BA Summary Table ─────────────────────────────────────────────────────────

function BaSummaryTable({ baLoad, retailRates, fuelMix }: {
  baLoad: EiaRow[]; retailRates: EiaRow[]; fuelMix: EiaRow[]
}) {
  const latestLoad = useMemo(() => {
    const byBA: Record<string, number> = {}
    for (const row of baLoad) {
      const ba = row.respondent ?? ''
      if (!byBA[ba]) byBA[ba] = Number(row.value)
    }
    return byBA
  }, [baLoad])

  const mainSource = useMemo(() => {
    const byBAPeriod: Record<string, Record<string, Record<string, number>>> = {}
    for (const row of fuelMix) {
      const ba = row.respondent ?? '', period = row.period ?? '', fuel = row.fueltype ?? ''
      if (!byBAPeriod[ba]) byBAPeriod[ba] = {}
      if (!byBAPeriod[ba][period]) byBAPeriod[ba][period] = {}
      byBAPeriod[ba][period][fuel] = (byBAPeriod[ba][period][fuel] ?? 0) + Number(row.value)
    }
    const FUEL_NAMES: Record<string, string> = {
      SUN: 'Solar', WND: 'Wind', WAT: 'Hydro', NUC: 'Nuclear',
      NG: 'Natural Gas', COL: 'Coal', OIL: 'Oil', OTH: 'Other', BAT: 'Battery',
    }
    const result: Record<string, string> = {}
    for (const [ba, periods] of Object.entries(byBAPeriod)) {
      const latest = Object.keys(periods).sort().at(-1)
      if (!latest) continue
      const top = Object.entries(periods[latest]).sort((a, b) => b[1] - a[1])[0]
      result[ba] = top ? (FUEL_NAMES[top[0]] ?? top[0]) : '—'
    }
    return result
  }, [fuelMix])

  const avgRate = useMemo(() => {
    const latest = retailRates[0]?.period
    const rows = retailRates.filter(r => r.period === latest && r.price != null)
    if (!rows.length) return null
    return rows.reduce((s, r) => s + Number(r.price), 0) / rows.length
  }, [retailRates])

  return (
    <div className={cn(CARD, 'overflow-hidden')}>
      <div className="flex items-center justify-between mb-3">
        <p className={CHART_TITLE + ' mb-0'}>Live Grid Overview</p>
        {avgRate ? (
          <span className="text-xs text-[var(--muted)]">
            Nat. avg retail: <span className="text-[var(--txt)] font-semibold">${(avgRate / 100).toFixed(3)}/kWh</span>
          </span>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Region', 'Load (MW)', 'Main Source'].map(h => (
                <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {GEA_ROWS.map(({ gea, label, ba }) => {
              const load = ba ? latestLoad[ba] : undefined
              const src = ba ? mainSource[ba] : undefined
              const color = GEA_COLORS[gea] ?? '#94a3b8'
              return (
                <tr key={gea} className="hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
                      <span className="font-medium text-[var(--txt)] text-xs">{label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 tabular-nums text-xs text-[var(--txt)]">{load ? fmtNum(load) : '—'}</td>
                  <td className="px-2 py-2 text-xs text-[var(--muted)]">{src ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Retail Rate Charts ───────────────────────────────────────────────────────

const TOP_STATES = ['CA', 'TX', 'NY', 'FL', 'MA', 'HI', 'WA', 'ID']

function RetailRatePanel({ retailHistory }: { retailHistory: EiaRow[] }) {
  const chartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {}
    for (const row of retailHistory) {
      const state = row.stateid ?? ''
      if (!TOP_STATES.includes(state)) continue
      const period = (row.period ?? '').slice(0, 7)
      if (!byPeriod[period]) byPeriod[period] = {}
      const p = Number(row.price)
      if (!isNaN(p) && p > 0) byPeriod[period][state] = p / 100
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([period, vals]) => ({ period, ...vals }))
  }, [retailHistory])

  const colors = ['#ef4444', '#84cc16', '#3b82f6', '#06b6d4', '#f97316', '#a78bfa', '#10b981', '#fb923c']

  return (
    <div className={cn(CARD, 'col-span-2')}>
      <p className={CHART_TITLE}>Residential Retail Rate — Top States ($/kWh, 24-month)</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => `$${Number(v).toFixed(2)}`} width={48} />
            <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`$${Number(v).toFixed(3)}/kWh`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {TOP_STATES.map((s, i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={colors[i]} dot={false} strokeWidth={1.5} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RetailRateBar({ retailRates }: { retailRates: EiaRow[] }) {
  const data = useMemo(() => {
    const latest = retailRates[0]?.period
    return retailRates
      .filter(r => r.period === latest && r.stateid && r.stateid !== 'US' && r.price != null)
      .map(r => ({ state: r.stateid!, rate: Number(r.price) / 100 }))
      .filter(r => r.rate > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 15)
  }, [retailRates])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE}>Highest Rates — Latest Month</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={14} margin={{ top: 2, right: 56, bottom: 2, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="state" type="category" width={28} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`$${Number(v).toFixed(3)}/kWh`, 'Rate']} />
            <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]}
              label={{ position: 'right', fill: 'var(--txt)', fontSize: 10, formatter: (v: unknown) => `$${Number(v).toFixed(2)}` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Fuel Mix ─────────────────────────────────────────────────────────────────

function FuelMixPanel({ fuelMix, ba, label, color }: { fuelMix: EiaRow[]; ba: string; label: string; color: string }) {
  const { data, fuels } = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {}
    for (const row of fuelMix) {
      if (row.respondent !== ba) continue
      const period = row.period ?? '', fuel = row.fueltype ?? ''
      if (!byPeriod[period]) byPeriod[period] = {}
      byPeriod[period][fuel] = (byPeriod[period][fuel] ?? 0) + Number(row.value)
    }
    const sorted = Object.entries(byPeriod).sort(([a], [b]) => a.localeCompare(b)).slice(-48)
    const fuelSet = new Set<string>()
    for (const [, vals] of sorted) Object.keys(vals).forEach(f => fuelSet.add(f))
    return {
      data: sorted.map(([p, vals]) => ({ period: p.slice(11, 16), ...vals })),
      fuels: [...fuelSet],
    }
  }, [fuelMix, ba])

  const hasData = data.length > 2

  return (
    <div className={CARD}>
      <p className={CHART_TITLE} style={{ color }}>Fuel Mix — {label}</p>
      <div style={{ height: 240 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => fmtNum(v)} width={36} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [fmtNum(Number(v)) + ' MW', String(name)]} />
              {fuels.map(f => (
                <Area key={f} type="monotone" dataKey={f} stackId="1"
                  stroke={FUEL_COLORS[f] ?? '#94a3b8'} fill={FUEL_COLORS[f] ?? '#94a3b8'}
                  fillOpacity={0.8} strokeWidth={0} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-[var(--muted)]">Loading…</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Load ─────────────────────────────────────────────────────────────────────

function LoadPanel({ demandData, ba, label, color }: { demandData: EiaRow[]; ba: string; label: string; color: string }) {
  const data = useMemo(() =>
    demandData
      .filter(r => r.respondent === ba)
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-48)
      .map(r => ({ period: r.period.slice(11, 16), load: Number(r.value) }))
  , [demandData, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE} style={{ color }}>Load — {label} (MW)</p>
      <div style={{ height: 240 }}>
        {data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => fmtNum(v)} width={36} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [fmtNum(Number(v)) + ' MW', 'Load']} />
              <Area type="monotone" dataKey="load" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-[var(--muted)]">Loading…</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Renewables ───────────────────────────────────────────────────────────────

function RenewablesPanel({ fuelMix, ba, label, color }: { fuelMix: EiaRow[]; ba: string; label: string; color: string }) {
  const data = useMemo(() => {
    const byPeriod: Record<string, { solar: number; wind: number; total: number }> = {}
    for (const row of fuelMix) {
      if (row.respondent !== ba) continue
      const period = row.period ?? ''
      if (!byPeriod[period]) byPeriod[period] = { solar: 0, wind: 0, total: 0 }
      const v = Number(row.value)
      if (row.fueltype === 'SUN') byPeriod[period].solar += v
      if (row.fueltype === 'WND') byPeriod[period].wind += v
      byPeriod[period].total += Math.max(v, 0)
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-48)
      .map(([p, v]) => ({ period: p.slice(11, 16), Solar: v.solar, Wind: v.wind }))
  }, [fuelMix, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE} style={{ color }}>Renewables — {label}</p>
      <div style={{ height: 240 }}>
        {data.length > 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => fmtNum(v)} width={36} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [fmtNum(Number(v)) + ' MW', String(name)]} />
              <Area type="monotone" dataKey="Solar" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} strokeWidth={0} />
              <Area type="monotone" dataKey="Wind" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} strokeWidth={0} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-[var(--muted)]">Loading…</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Horizontal chart row ─────────────────────────────────────────────────────

function ChartRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto no-scrollbar px-6">
      {/* 380px cards × 7 = 2660px + gaps; peek of 7th card is visible at ~1200px viewport */}
      <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GridClient({ baLoad, retailRates, retailHistory, fuelMix, demandData }: Props) {
  const [tab, setTab] = useState<Tab>('Retail Rates')

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">

      <div className="px-6 pt-4 pb-4 shrink-0">
        <BaSummaryTable baLoad={baLoad} retailRates={retailRates} fuelMix={fuelMix} />
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="flex items-center gap-1 border-b border-[var(--border)]">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === t ? 'border-solar text-[var(--txt)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
              )}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">

        {tab === 'Retail Rates' && (
          <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RetailRatePanel retailHistory={retailHistory} />
            <RetailRateBar retailRates={retailRates} />
          </div>
        )}

        {tab === 'Fuel Mix' && (
          <ChartRow>
            {CHART_BAS.map(({ ba, label, color }) => (
              <div key={ba} style={{ width: 380 }}>
                <FuelMixPanel fuelMix={fuelMix} ba={ba} label={label} color={color} />
              </div>
            ))}
          </ChartRow>
        )}

        {tab === 'Load' && (
          <ChartRow>
            {CHART_BAS.map(({ ba, label, color }) => (
              <div key={ba} style={{ width: 380 }}>
                <LoadPanel demandData={demandData} ba={ba} label={label} color={color} />
              </div>
            ))}
          </ChartRow>
        )}

        {tab === 'Renewables' && (
          <ChartRow>
            {CHART_BAS.map(({ ba, label, color }) => (
              <div key={ba} style={{ width: 380 }}>
                <RenewablesPanel fuelMix={fuelMix} ba={ba} label={label} color={color} />
              </div>
            ))}
          </ChartRow>
        )}

        {tab === 'Capacity' && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--txt)] mb-1">Capacity data coming soon</p>
              <p className="text-xs text-[var(--muted)]">EIA state-level generating capacity by fuel type</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
