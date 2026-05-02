'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, CartesianGrid,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { SolarTopChart } from '@/components/SolarTopChart'
import type { SolarRow } from '@/components/SolarDataTable'

function fmtCompact(n: number): string {
  if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#f59e0b',
  'A':  '#fbbf24',
  'B':  '#6366f1',
  'C':  '#8b5cf6',
  'D':  '#94a3b8',
}

const CHART_CARD = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-3'
const CHART_TITLE = 'text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3'

function GradeDistPie({ rows }: { rows: SolarRow[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const g = r.sunlight_grade ?? 'Unknown'
      counts[g] = (counts[g] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (GRADE_COLORS[b.name] ? 1 : -1) - (GRADE_COLORS[a.name] ? 1 : -1))
  }, [rows])

  return (
    <div className={CHART_CARD}>
      <p className={CHART_TITLE}>Grade Distribution</p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="45%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={11}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={GRADE_COLORS[entry.name] ?? '#cbd5e1'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: unknown) => [String(v), 'count']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TopInstallsChart({ rows, getLabel, getHref, yAxisWidth }: {
  rows: SolarRow[]
  getLabel: (r: SolarRow) => string
  getHref?: (r: SolarRow) => string
  yAxisWidth: number
}) {
  const router = useRouter()
  const data = useMemo(() =>
    [...rows]
      .filter(r => (r.existing_installs_count ?? 0) > 0)
      .sort((a, b) => (b.existing_installs_count ?? 0) - (a.existing_installs_count ?? 0))
      .slice(0, 10)
      .map(r => ({ name: getLabel(r), value: r.existing_installs_count ?? 0, href: getHref?.(r) }))
  , [rows, getLabel, getHref])

  return (
    <div className={CHART_CARD}>
      <p className={CHART_TITLE}>Top 10 — Existing Installs</p>
      <div className="overflow-y-auto" style={{ maxHeight: 10 * 26 }}>
        <div style={{ height: data.length * 26 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={14} margin={{ top: 2, right: 55, bottom: 2, left: 4 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={yAxisWidth} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [fmtCompact(Number(v)), 'Installs']}
              />
              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                cursor={getHref ? 'pointer' : 'default'}
                onClick={(d: unknown) => {
                  const href = (d as { payload?: { href?: string } })?.payload?.href
                  if (href) router.push(href)
                }}
                label={{ position: 'right', fill: 'var(--txt)', fontSize: 11, formatter: (v: unknown) => fmtCompact(Number(v)) }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function AdoptionScatter({ rows, getLabel }: { rows: SolarRow[]; getLabel: (r: SolarRow) => string }) {
  const data = useMemo(() =>
    rows
      .filter(r => r.adoption_rate_pct != null && r.untapped_annual_value_usd != null)
      .map(r => ({
        x: Number(r.adoption_rate_pct),
        y: Number(r.untapped_annual_value_usd),
        name: getLabel(r),
      }))
  , [rows, getLabel])

  return (
    <div className={CHART_CARD}>
      <p className={CHART_TITLE}>Adoption Rate vs Untapped Potential</p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 16, bottom: 20, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Adoption %"
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
              tickLine={false}
              label={{ value: 'Adoption %', position: 'insideBottom', offset: -12, fontSize: 10, fill: 'var(--muted)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Potential/yr"
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
              tickLine={false}
              tickFormatter={(v) => '$' + fmtCompact(v)}
              width={52}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: unknown, name: unknown) =>
                name === 'Potential/yr' ? ['$' + fmtCompact(Number(v)), name as string] : [Number(v).toFixed(1) + '%', name as string]
              }
              labelFormatter={(_: unknown, payload: readonly { payload?: { name?: string } }[]) =>
                payload[0]?.payload?.name ?? ''
              }
            />
            <Scatter data={data} fill="#f59e0b" fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function KwhPerRoofChart({ rows, getLabel, getHref, yAxisWidth }: {
  rows: SolarRow[]
  getLabel: (r: SolarRow) => string
  getHref?: (r: SolarRow) => string
  yAxisWidth: number
}) {
  const router = useRouter()
  const data = useMemo(() =>
    [...rows]
      .filter(r => (r.median_annual_kwh_per_roof ?? 0) > 0)
      .sort((a, b) => (b.median_annual_kwh_per_roof ?? 0) - (a.median_annual_kwh_per_roof ?? 0))
      .slice(0, 10)
      .map(r => ({ name: getLabel(r), value: r.median_annual_kwh_per_roof ?? 0, href: getHref?.(r) }))
  , [rows, getLabel, getHref])

  return (
    <div className={CHART_CARD}>
      <p className={CHART_TITLE}>Top 10 — kWh/Roof (Median)</p>
      <div className="overflow-y-auto" style={{ maxHeight: 10 * 26 }}>
        <div style={{ height: data.length * 26 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={14} margin={{ top: 2, right: 60, bottom: 2, left: 4 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={yAxisWidth} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [fmtCompact(Number(v)), 'kWh/roof']}
              />
              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                cursor={getHref ? 'pointer' : 'default'}
                onClick={(d: unknown) => {
                  const href = (d as { payload?: { href?: string } })?.payload?.href
                  if (href) router.push(href)
                }}
                label={{ position: 'right', fill: 'var(--txt)', fontSize: 11, formatter: (v: unknown) => fmtCompact(Number(v)) }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

interface GeoDashboardProps {
  rows: SolarRow[]
  getLabel: (r: SolarRow) => string
  getHref?: (r: SolarRow) => string
  yAxisWidth?: number
}

export function GeoDashboard({ rows, getLabel, getHref, yAxisWidth = 130 }: GeoDashboardProps) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Row 1: Top 15 by metric */}
      <SolarTopChart rows={rows} getLabel={getLabel} getHref={getHref} yAxisWidth={yAxisWidth} />

      {/* Row 2: Grade Distribution + Top Installs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-4">
        <GradeDistPie rows={rows} />
        <TopInstallsChart rows={rows} getLabel={getLabel} getHref={getHref} yAxisWidth={yAxisWidth} />
      </div>

      {/* Row 3: Adoption Scatter + kWh/Roof */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-8">
        <AdoptionScatter rows={rows} getLabel={getLabel} />
        <KwhPerRoofChart rows={rows} getLabel={getLabel} getHref={getHref} yAxisWidth={yAxisWidth} />
      </div>
    </div>
  )
}
