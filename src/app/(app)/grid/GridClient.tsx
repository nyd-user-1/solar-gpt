'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EiaRow {
  period: string
  respondent?: string
  respondent_name?: string
  'respondent-name'?: string
  type?: string
  'type-name'?: string
  fueltype?: string
  'fuel-type-name'?: string
  stateid?: string
  stateDescription?: string
  sectorid?: string
  value: number | string
  units?: string
}

interface Props {
  baLoad: EiaRow[]
  retailRates: EiaRow[]
  retailHistory: EiaRow[]
  fuelMix: EiaRow[]
  demandData: EiaRow[]
  netGenData: EiaRow[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ISOs = ['ERCO', 'CISO', 'SWPP', 'PJM', 'MISO', 'NYIS', 'ISNE', 'IESO'] as const
const ISO_LABELS: Record<string, string> = {
  ERCO: 'ERCOT', CISO: 'CAISO', SWPP: 'SPP', PJM: 'PJM',
  MISO: 'MISO', NYIS: 'NYISO', ISNE: 'ISONE', IESO: 'IESO',
}

const FUEL_COLORS: Record<string, string> = {
  SUN:  '#f59e0b',  // solar — amber
  WND:  '#10b981',  // wind — emerald
  WAT:  '#3b82f6',  // hydro — blue
  NUC:  '#8b5cf6',  // nuclear — purple
  NG:   '#6366f1',  // nat gas — indigo
  COL:  '#64748b',  // coal — slate
  OIL:  '#f97316',  // oil — orange
  OTH:  '#94a3b8',  // other — gray
  BAT:  '#06b6d4',  // battery — cyan
  GEO:  '#84cc16',  // geothermal — lime
}

const TABS = ['Retail Rates', 'Fuel Mix', 'Load', 'Renewables', 'Capacity'] as const
type Tab = typeof TABS[number]

const CARD = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-3'
const CHART_TITLE = 'text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3'

function fmtNum(n: number, dec = 0) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(dec)
}

function fmtPrice(v: number) { return `$${v.toFixed(2)}`}

// ─── Tooltip ────────────────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
  },
}

// ─── BA Summary Table ─────────────────────────────────────────────────────────

function BaSummaryTable({ baLoad, retailRates, fuelMix }: {
  baLoad: EiaRow[]
  retailRates: EiaRow[]
  fuelMix: EiaRow[]
}) {
  // Get latest demand per BA
  const latestLoad = useMemo(() => {
    const byBA: Record<string, number> = {}
    for (const row of baLoad) {
      const ba = row.respondent ?? ''
      if (!byBA[ba]) byBA[ba] = Number(row.value)
    }
    return byBA
  }, [baLoad])

  // Get latest net gen per BA from fuelMix (sum all fuel types for that BA/period)
  const latestNetGen = useMemo(() => {
    const byBAPeriod: Record<string, Record<string, number>> = {}
    for (const row of fuelMix) {
      const ba = row.respondent ?? ''
      const period = row.period ?? ''
      if (!byBAPeriod[ba]) byBAPeriod[ba] = {}
      byBAPeriod[ba][period] = (byBAPeriod[ba][period] ?? 0) + Number(row.value)
    }
    const result: Record<string, number> = {}
    for (const [ba, periods] of Object.entries(byBAPeriod)) {
      const latest = Object.keys(periods).sort().at(-1)
      if (latest) result[ba] = periods[latest]
    }
    return result
  }, [fuelMix])

  // Get latest main fuel type per BA
  const mainSource = useMemo(() => {
    const byBAPeriod: Record<string, Record<string, Record<string, number>>> = {}
    for (const row of fuelMix) {
      const ba = row.respondent ?? ''
      const period = row.period ?? ''
      const fuel = row.fueltype ?? row['fuel-type-name'] ?? ''
      if (!byBAPeriod[ba]) byBAPeriod[ba] = {}
      if (!byBAPeriod[ba][period]) byBAPeriod[ba][period] = {}
      byBAPeriod[ba][period][fuel] = (byBAPeriod[ba][period][fuel] ?? 0) + Number(row.value)
    }
    const result: Record<string, string> = {}
    const FUEL_NAMES: Record<string, string> = {
      SUN: 'Solar', WND: 'Wind', WAT: 'Hydro', NUC: 'Nuclear',
      NG: 'Natural Gas', COL: 'Coal', OIL: 'Oil', OTH: 'Other',
      BAT: 'Battery', GEO: 'Geothermal',
    }
    for (const [ba, periods] of Object.entries(byBAPeriod)) {
      const latest = Object.keys(periods).sort().at(-1)
      if (!latest) continue
      const fuels = periods[latest]
      const top = Object.entries(fuels).sort((a, b) => b[1] - a[1])[0]
      result[ba] = top ? (FUEL_NAMES[top[0]] ?? top[0]) : '—'
    }
    return result
  }, [fuelMix])

  // National avg retail rate
  const avgRate = useMemo(() => {
    if (!retailRates.length) return null
    const latest = retailRates[0]?.period
    const latestRows = retailRates.filter(r => r.period === latest && r.value != null)
    const avg = latestRows.reduce((s, r) => s + Number(r.value), 0) / (latestRows.length || 1)
    return avg
  }, [retailRates])

  return (
    <div className={cn(CARD, 'overflow-hidden')}>
      <div className="flex items-center justify-between mb-3">
        <p className={CHART_TITLE + ' mb-0'}>Live Grid Overview</p>
        {avgRate && (
          <span className="text-xs text-[var(--muted)]">Nat. avg retail: <span className="text-[var(--txt)] font-semibold">{fmtPrice(avgRate / 100)}/kWh</span></span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['ISO', 'Load (MW)', 'Net Gen (MW)', 'Main Source'].map(h => (
                <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {ISOs.map(ba => {
              const load = latestLoad[ba]
              const ng = latestNetGen[ba]
              const src = mainSource[ba]
              return (
                <tr key={ba} className="hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-solar shrink-0" />
                      <span className="font-semibold text-[var(--txt)]">{ISO_LABELS[ba] ?? ba}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-[var(--txt)]">{load ? fmtNum(load) : '—'}</td>
                  <td className="px-2 py-2.5 tabular-nums text-[var(--txt)]">{ng ? fmtNum(ng) : '—'}</td>
                  <td className="px-2 py-2.5 text-[var(--muted)]">{src ?? '—'}</td>
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

function RetailRatePanel({ retailHistory }: { retailHistory: EiaRow[] }) {
  const TOP_STATES = ['CA', 'TX', 'NY', 'FL', 'MA', 'HI', 'WA', 'ID']

  const chartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {}
    for (const row of retailHistory) {
      if (!TOP_STATES.includes(row.stateid ?? '')) continue
      const period = row.period ?? ''
      if (!byPeriod[period]) byPeriod[period] = {}
      byPeriod[period][row.stateid!] = Number(row.value) / 100
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([period, vals]) => ({ period: period.slice(0, 7), ...vals }))
  }, [retailHistory])

  const colors = ['#f59e0b', '#6366f1', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']

  return (
    <div className={cn(CARD, 'col-span-2')}>
      <p className={CHART_TITLE}>Residential Retail Rate — Top States ($/kWh, 24-month)</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => `$${v.toFixed(2)}`} width={48} />
            <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`$${Number(v).toFixed(3)}/kWh`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {TOP_STATES.map((s, i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={colors[i % colors.length]} dot={false} strokeWidth={1.5} />
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
      .filter(r => r.period === latest && r.stateid && r.stateid !== 'US')
      .map(r => ({ state: r.stateid!, rate: Number(r.value) / 100 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 15)
  }, [retailRates])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE}>Highest Retail Rates — Latest Month</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={14} margin={{ top: 2, right: 56, bottom: 2, left: 4 }}>
            <XAxis type="number" hide tickFormatter={v => `$${v}`} />
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

// ─── Fuel Mix Charts ──────────────────────────────────────────────────────────

function FuelMixPanel({ fuelMix, ba }: { fuelMix: EiaRow[]; ba: string }) {
  const data = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {}
    for (const row of fuelMix) {
      if (row.respondent !== ba) continue
      const period = row.period ?? ''
      const fuel = row.fueltype ?? ''
      if (!byPeriod[period]) byPeriod[period] = {}
      byPeriod[period][fuel] = (byPeriod[period][fuel] ?? 0) + Number(row.value)
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-48)
      .map(([period, vals]) => ({
        period: period.slice(11, 16),
        ...vals,
      }))
  }, [fuelMix, ba])

  const fuels = useMemo(() => {
    const seen = new Set<string>()
    for (const row of fuelMix) {
      if (row.respondent === ba && row.fueltype) seen.add(row.fueltype)
    }
    return [...seen]
  }, [fuelMix, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE}>Fuel Mix — {ISO_LABELS[ba] ?? ba}</p>
      <div style={{ height: 240 }}>
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
      </div>
    </div>
  )
}

// ─── Load Charts ──────────────────────────────────────────────────────────────

function LoadPanel({ demandData, ba }: { demandData: EiaRow[]; ba: string }) {
  const data = useMemo(() => {
    return demandData
      .filter(r => r.respondent === ba)
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-48)
      .map(r => ({ period: r.period.slice(11, 16), load: Number(r.value) }))
  }, [demandData, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE}>Load — {ISO_LABELS[ba] ?? ba} (MW)</p>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} interval={7} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => fmtNum(v)} width={36} />
            <Tooltip {...tooltipStyle} formatter={(v: unknown) => [fmtNum(Number(v)) + ' MW', 'Load']} />
            <Area type="monotone" dataKey="load" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Renewables Charts ────────────────────────────────────────────────────────

function RenewablesPanel({ fuelMix, ba }: { fuelMix: EiaRow[]; ba: string }) {
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
      .map(([period, vals]) => ({
        period: period.slice(11, 16),
        Solar: vals.solar,
        Wind: vals.wind,
        pct: vals.total > 0 ? ((vals.solar + vals.wind) / vals.total * 100) : 0,
      }))
  }, [fuelMix, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE}>Renewables — {ISO_LABELS[ba] ?? ba}</p>
      <div style={{ height: 240 }}>
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
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CHART_BAS = ['ERCO', 'CISO', 'PJM', 'MISO', 'NYIS', 'ISNE'] as const

export default function GridClient({ baLoad, retailRates, retailHistory, fuelMix, demandData }: Props) {
  const [tab, setTab] = useState<Tab>('Retail Rates')

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in">

      {/* Top: BA summary table */}
      <div className="px-6 pt-4 pb-4 shrink-0">
        <BaSummaryTable baLoad={baLoad} retailRates={retailRates} fuelMix={fuelMix} />
      </div>

      {/* Tab bar */}
      <div className="px-6 pb-3 shrink-0">
        <div className="flex items-center gap-1 border-b border-[var(--border)]">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'border-solar text-[var(--txt)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">

        {tab === 'Retail Rates' && (
          <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RetailRatePanel retailHistory={retailHistory} />
            <RetailRateBar retailRates={retailRates} />
          </div>
        )}

        {tab === 'Fuel Mix' && (
          <div className="overflow-x-auto no-scrollbar px-6">
            <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
              {CHART_BAS.map(ba => (
                <div key={ba} style={{ width: 380 }}>
                  <FuelMixPanel fuelMix={fuelMix} ba={ba} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Load' && (
          <div className="overflow-x-auto no-scrollbar px-6">
            <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
              {CHART_BAS.map(ba => (
                <div key={ba} style={{ width: 380 }}>
                  <LoadPanel demandData={demandData} ba={ba} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Renewables' && (
          <div className="overflow-x-auto no-scrollbar px-6">
            <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
              {CHART_BAS.map(ba => (
                <div key={ba} style={{ width: 380 }}>
                  <RenewablesPanel fuelMix={fuelMix} ba={ba} />
                </div>
              ))}
            </div>
          </div>
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
