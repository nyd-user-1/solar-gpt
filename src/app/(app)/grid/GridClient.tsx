'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { GEA_COLORS } from '@/lib/gea-colors'
import type { GeaKpi, CambiumCountyMapEntry, CountyMapEntry } from '@/lib/queries'

const GEAChoropleth = dynamic(() => import('@/components/GEAChoropleth'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface EiaRow {
  period: string
  respondent?: string
  fueltype?: string
  stateid?: string
  value?: number | string
  price?: number | string
  [key: string]: unknown
}

interface Props {
  baLoad: EiaRow[]
  retailRates: EiaRow[]
  retailHistory: EiaRow[]
  fuelMix: EiaRow[]
  demandData: EiaRow[]
  netGenData: EiaRow[]
  geaKpis: GeaKpi[]
  cambiumCounties: CambiumCountyMapEntry[]
  sunroofCounties: CountyMapEntry[]
}

// ─── GEA → EIA-930 BA mapping ─────────────────────────────────────────────────

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

const CHART_BAS: { ba: string; label: string; color: string }[] = [
  { ba: 'ERCO', label: 'ERCOT',  color: GEA_COLORS['ERCOT']        },
  { ba: 'CISO', label: 'CAISO',  color: GEA_COLORS['CAISO']        },
  { ba: 'SWPP', label: 'SPP',    color: GEA_COLORS['SPP_North']     },
  { ba: 'PJM',  label: 'PJM',    color: GEA_COLORS['PJM_West']      },
  { ba: 'MISO', label: 'MISO',   color: GEA_COLORS['MISO_Central']  },
  { ba: 'NYIS', label: 'NYISO',  color: GEA_COLORS['NYISO']        },
  { ba: 'ISNE', label: 'ISONE',  color: GEA_COLORS['ISONE']        },
]

const FUEL_COLORS: Record<string, string> = {
  SUN: '#f59e0b', WND: '#10b981', WAT: '#3b82f6', NUC: '#8b5cf6',
  NG:  '#6366f1', COL: '#64748b', OIL: '#f97316', OTH: '#94a3b8', BAT: '#06b6d4',
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

const TT = {
  contentStyle: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12,
  },
}

// ─── Region Table ─────────────────────────────────────────────────────────────

const ROW_H = 40 // px per row
const VISIBLE_ROWS = 8

// BA → representative state for retail rate lookup
const BA_STATE: Record<string, string> = {
  ERCO: 'TX', CISO: 'CA', SWPP: 'KS', PJM: 'PA',
  MISO: 'IL', NYIS: 'NY', ISNE: 'MA', BPAT: 'WA',
  PACW: 'OR', WACM: 'CO', AZPS: 'AZ', SOCO: 'GA',
}

function RegionTable({ baLoad, retailRates, fuelMix }: {
  baLoad: EiaRow[]; retailRates: EiaRow[]; fuelMix: EiaRow[]
}) {
  // Latest demand per BA
  const latestLoad = useMemo(() => {
    const byBA: Record<string, number> = {}
    for (const row of baLoad) {
      const ba = row.respondent ?? ''
      if (!byBA[ba]) byBA[ba] = Number(row.value)
    }
    return byBA
  }, [baLoad])

  // Latest solar + wind per BA (for net load = load − renewables)
  const latestRenewables = useMemo(() => {
    const byBA: Record<string, { solar: number; wind: number; period: string }> = {}
    for (const row of fuelMix) {
      const ba = row.respondent ?? ''
      const period = row.period ?? ''
      if (!byBA[ba] || period > byBA[ba].period) {
        byBA[ba] = { solar: 0, wind: 0, period }
      }
      if (period === byBA[ba].period) {
        if (row.fueltype === 'SUN') byBA[ba].solar += Number(row.value)
        if (row.fueltype === 'WND') byBA[ba].wind += Number(row.value)
      }
    }
    return byBA
  }, [fuelMix])

  // Main source per BA from latest fuel mix hour
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

  // Latest retail rate per state (¢/kWh → $/MWh = multiply by 10)
  const stateRates = useMemo(() => {
    const latest = retailRates[0]?.period
    const byState: Record<string, number> = {}
    for (const r of retailRates) {
      if (r.period === latest && r.stateid && r.price != null) {
        byState[r.stateid] = Number(r.price) * 10 // $/MWh
      }
    }
    return byState
  }, [retailRates])

  const avgRate = useMemo(() => {
    const latest = retailRates[0]?.period
    const rows = retailRates.filter(r => r.period === latest && r.price != null)
    if (!rows.length) return null
    return rows.reduce((s, r) => s + Number(r.price), 0) / rows.length
  }, [retailRates])

  return (
    <div className={cn(CARD, 'flex flex-col overflow-hidden h-full')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <p className={CHART_TITLE + ' mb-0'}>Live Grid Overview</p>
        {avgRate ? (
          <span className="text-xs text-[var(--muted)]">
            Nat. avg retail: <span className="font-semibold text-[var(--txt)]">${(avgRate / 100).toFixed(3)}/kWh</span>
          </span>
        ) : null}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_100px_110px_110px] shrink-0 border-b border-[var(--border)] pb-1.5 mb-0">
        {['Region', 'Load (MW)', 'Net Load', 'Rate $/MWh', 'Main Source'].map(h => (
          <span key={h} className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">{h}</span>
        ))}
      </div>

      {/* Rows — first VISIBLE_ROWS shown, rest scroll */}
      <div
        className="overflow-y-auto no-scrollbar divide-y divide-[var(--border)] flex-1"
        style={{ maxHeight: VISIBLE_ROWS * ROW_H }}
      >
        {GEA_ROWS.map(({ gea, label, ba }) => {
          const load = ba ? latestLoad[ba] : undefined
          const ren = ba ? latestRenewables[ba] : undefined
          const netLoad = load != null && ren != null ? load - ren.solar - ren.wind : undefined
          const src = ba ? mainSource[ba] : undefined
          const state = ba ? BA_STATE[ba] : undefined
          const rate = state ? stateRates[state] : undefined
          const color = GEA_COLORS[gea] ?? '#94a3b8'
          return (
            <div key={gea}
              className="grid grid-cols-[1fr_80px_100px_110px_110px] items-center hover:bg-[var(--inp-bg)] transition-colors"
              style={{ height: ROW_H }}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm font-medium text-[var(--txt)]">{label}</span>
              </span>
              <span className="text-sm tabular-nums text-[var(--txt)]">{load != null ? fmtNum(load) : '—'}</span>
              <span className="text-sm tabular-nums text-[var(--txt)]">{netLoad != null ? fmtNum(netLoad) : '—'}</span>
              <span className="text-sm tabular-nums text-[var(--txt)]">{rate != null ? `$${rate.toFixed(0)}` : '—'}</span>
              <span className="text-sm text-[var(--muted)]">{src ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chart panels ─────────────────────────────────────────────────────────────

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
    for (const [, v] of sorted) Object.keys(v).forEach(f => fuelSet.add(f))
    return {
      data: sorted.map(([p, v]) => ({ period: p.slice(11, 16), ...v })),
      fuels: [...fuelSet],
    }
  }, [fuelMix, ba])

  return (
    <div className={CARD}>
      <p className={CHART_TITLE} style={{ color }}>Fuel Mix — {label}</p>
      <div style={{ height: 240 }}>
        {data.length > 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => fmtNum(v)} width={36} />
              <Tooltip {...TT} formatter={(v: unknown, n: unknown) => [fmtNum(Number(v)) + ' MW', String(n)]} />
              {fuels.map(f => (
                <Area key={f} type="monotone" dataKey={f} stackId="1"
                  stroke={FUEL_COLORS[f] ?? '#94a3b8'} fill={FUEL_COLORS[f] ?? '#94a3b8'} fillOpacity={0.8} strokeWidth={0} />
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

function LoadPanel({ demandData, ba, label, color }: { demandData: EiaRow[]; ba: string; label: string; color: string }) {
  const data = useMemo(() =>
    demandData.filter(r => r.respondent === ba)
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
              <Tooltip {...TT} formatter={(v: unknown) => [fmtNum(Number(v)) + ' MW', 'Load']} />
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

function RenewablesPanel({ fuelMix, ba, label, color }: { fuelMix: EiaRow[]; ba: string; label: string; color: string }) {
  const data = useMemo(() => {
    const byPeriod: Record<string, { Solar: number; Wind: number }> = {}
    for (const row of fuelMix) {
      if (row.respondent !== ba) continue
      const period = row.period ?? ''
      if (!byPeriod[period]) byPeriod[period] = { Solar: 0, Wind: 0 }
      const v = Number(row.value)
      if (row.fueltype === 'SUN') byPeriod[period].Solar += v
      if (row.fueltype === 'WND') byPeriod[period].Wind += v
    }
    return Object.entries(byPeriod).sort(([a], [b]) => a.localeCompare(b)).slice(-48)
      .map(([p, v]) => ({ period: p.slice(11, 16), ...v }))
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
              <Tooltip {...TT} formatter={(v: unknown, n: unknown) => [fmtNum(Number(v)) + ' MW', String(n)]} />
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
    return Object.entries(byPeriod).sort(([a], [b]) => a.localeCompare(b)).slice(-24)
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
            <Tooltip {...TT} formatter={(v: unknown) => [`$${Number(v).toFixed(3)}/kWh`]} />
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
            <Tooltip {...TT} formatter={(v: unknown) => [`$${Number(v).toFixed(3)}/kWh`, 'Rate']} />
            <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]}
              label={{ position: 'right', fill: 'var(--txt)', fontSize: 10, formatter: (v: unknown) => `$${Number(v).toFixed(2)}` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GridClient({
  baLoad, retailRates, retailHistory, fuelMix, demandData,
  geaKpis, cambiumCounties, sunroofCounties,
}: Props) {
  const [tab, setTab] = useState<Tab>('Retail Rates')

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-zoom-in gap-5 p-4">

      {/* ── Top half: table (left) + GEA map (right) ── */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* Left: region table */}
        <div className="w-[42%] min-w-0 shrink-0">
          <RegionTable baLoad={baLoad} retailRates={retailRates} fuelMix={fuelMix} />
        </div>

        {/* Right: GEA choropleth map */}
        <div className="flex-1 min-w-0 rounded-xl border border-[var(--border)] overflow-hidden">
          <GEAChoropleth
            mode="cambium"
            cambiumCounties={cambiumCounties}
            sunroofCounties={sunroofCounties}
            geaKpis={geaKpis}
            className="w-full h-full"
          />
        </div>

      </div>

      {/* ── Bottom half: tabs + charts ── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] shrink-0 mb-3">
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

        {/* Chart content */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">

          {tab === 'Retail Rates' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
              <RetailRatePanel retailHistory={retailHistory} />
              <RetailRateBar retailRates={retailRates} />
            </div>
          )}

          {(tab === 'Fuel Mix' || tab === 'Load' || tab === 'Renewables') && (
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
                {CHART_BAS.map(({ ba, label, color }) => (
                  <div key={ba} style={{ width: 380 }}>
                    {tab === 'Fuel Mix' && <FuelMixPanel fuelMix={fuelMix} ba={ba} label={label} color={color} />}
                    {tab === 'Load' && <LoadPanel demandData={demandData} ba={ba} label={label} color={color} />}
                    {tab === 'Renewables' && <RenewablesPanel fuelMix={fuelMix} ba={ba} label={label} color={color} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Capacity' && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--txt)] mb-1">Capacity data coming soon</p>
                <p className="text-xs text-[var(--muted)]">EIA state-level generating capacity by fuel type</p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
