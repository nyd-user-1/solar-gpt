'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { SolarRow } from '@/components/SolarDataTable'

function fmtCompact(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

type MetricKey = keyof Pick<SolarRow,
  'untapped_annual_value_usd' | 'yearly_sunlight_kwh_total' |
  'untapped_buildings' | 'untapped_kwh_yr' | 'untapped_carbon_tonnes_yr'>

const METRICS: { key: MetricKey; label: string; fmt: (v: number) => string }[] = [
  { key: 'untapped_annual_value_usd', label: 'Potential/yr',       fmt: v => '$' + fmtCompact(v) },
  { key: 'yearly_sunlight_kwh_total', label: 'kWh',                fmt: fmtCompact },
  { key: 'untapped_buildings',        label: 'Untapped Bldgs.',    fmt: fmtCompact },
  { key: 'untapped_kwh_yr',           label: 'Untapped kWh/yr',   fmt: fmtCompact },
  { key: 'untapped_carbon_tonnes_yr', label: 'Untapped CO₂',      fmt: v => fmtCompact(v) + 't' },
]

interface Props {
  rows: SolarRow[]
  getLabel: (row: SolarRow) => string
  getHref?: (row: SolarRow) => string
  yAxisWidth?: number
}

export function SolarTopChart({ rows, getLabel, getHref, yAxisWidth = 130 }: Props) {
  const [mi, setMi] = useState(0)
  const router = useRouter()
  const metric = METRICS[mi]

  const data = useMemo(() => {
    return [...rows]
      .filter(r => ((r[metric.key] as number) ?? 0) > 0)
      .sort((a, b) => ((b[metric.key] as number) ?? 0) - ((a[metric.key] as number) ?? 0))
      .slice(0, 15)
      .map(r => ({
        name: getLabel(r),
        value: (r[metric.key] as number) ?? 0,
        href: getHref?.(r),
      }))
  }, [rows, metric, getLabel, getHref])

  return (
    <div className="px-6 pb-4 shrink-0">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-3">
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {METRICS.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setMi(i)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                i === mi
                  ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
                  : 'text-[var(--muted)] hover:text-[var(--txt)]',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
          Top {data.length} — {metric.label}
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 2, right: 60, bottom: 2, left: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={yAxisWidth}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [metric.fmt(Number(v)), metric.label] as [string, string]}
              />
              <Bar
                dataKey="value"
                fill="#f59e0b"
                radius={[0, 4, 4, 0]}
                cursor={getHref ? 'pointer' : 'default'}
                onClick={(d: unknown) => {
                  const href = (d as { payload?: { href?: string } })?.payload?.href
                  if (href) router.push(href)
                }}
                label={{
                  position: 'right',
                  fill: 'var(--txt)',
                  fontSize: 11,
                  formatter: (v: unknown) => metric.fmt(Number(v)),
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
