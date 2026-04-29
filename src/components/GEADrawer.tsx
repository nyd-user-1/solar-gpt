'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import { getGeaColor } from '@/lib/gea-colors'

type TopCounty = {
  region_name: string
  state_name: string
  untapped_annual_value_usd: number
  count_qualified: number
}

type GeaKpiData = {
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  adoption_rate_pct: number
  existing_installs_count: number
  count_qualified: number
  yearly_sunlight_kwh_total: number
  sunlight_grade: string
  county_count: number
  cars_off_road_equivalent: number
  homes_powered_equivalent: number
}

type CambiumMetrics = { cost_per_mwh: number; lrmer_co2_per_mwh: number } | null

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="grid px-3 py-2.5 bg-[var(--inp-bg)] border-b border-[var(--border)]"
      style={{ gridTemplateColumns: cols.length === 2 ? '1fr auto' : '1fr auto auto' }}>
      {cols.map((c, i) => (
        <span key={c} className={`text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide ${i > 0 ? 'text-right' : ''}`}>{c}</span>
      ))}
    </div>
  )
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--txt)]">{value}</span>
    </div>
  )
}

function AccordionSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div>
      <button onClick={onToggle} className="flex items-center justify-between w-full pt-1 pb-2 group">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] group-hover:text-[var(--txt)] transition-colors">{title}</p>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-1">
          {children}
        </div>
      )}
    </div>
  )
}

function DrawerContent({ gea, onClose }: { gea: string; onClose: () => void }) {
  const router = useRouter()
  const color = getGeaColor(gea)
  const [data, setData] = useState<{ kpi: GeaKpiData | null; cambiumMetrics: CambiumMetrics; topCounties: TopCounty[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState({ grid: true, solar: true, impact: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/gea/${geaToSlug(gea)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [gea])

  const impact = data?.kpi && data.cambiumMetrics ? (() => {
    const mwh = (data.kpi.yearly_sunlight_kwh_total ?? 0) / 1000
    const co2Tons = (mwh * (data.cambiumMetrics!.lrmer_co2_per_mwh ?? 0)) / 1000
    const costOffset = mwh * (data.cambiumMetrics!.cost_per_mwh ?? 0)
    return { co2Tons, costOffset }
  })() : null

  return (
    <div className="h-full w-full sm:w-[360px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
        <span className="flex-1 text-sm font-semibold text-[var(--txt)]">{fmtGea(gea)}</span>
        <button onClick={() => router.push(`/gea-regions/${geaToSlug(gea)}`)}
          className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <ExternalLink className="h-4 w-4" />
        </button>
        <button onClick={onClose}
          className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-5 w-5 rounded-full border-2 border-[var(--border)] border-t-solar animate-spin" />
          </div>
        ) : data ? (
          <div className="px-4 py-4 flex flex-col gap-4">

            <AccordionSection title="Grid Economics" open={sections.grid} onToggle={() => toggle('grid')}>
              <TableHeader cols={['Metric', 'Value']} />
              <KpiRow label="Marginal Cost" value={data.cambiumMetrics ? `$${data.cambiumMetrics.cost_per_mwh.toFixed(2)}/MWh` : '—'} />
              <KpiRow label="Emissions Intensity" value={data.cambiumMetrics ? `${data.cambiumMetrics.lrmer_co2_per_mwh.toFixed(1)} kg CO₂/MWh` : '—'} />
            </AccordionSection>

            <AccordionSection title="Solar Potential" open={sections.solar} onToggle={() => toggle('solar')}>
              <TableHeader cols={['Metric', 'Value']} />
              <KpiRow label="Annual Potential" value={data.kpi ? fmtUsd(data.kpi.untapped_annual_value_usd) : '—'} />
              <KpiRow label="Lifetime Value (25yr)" value={data.kpi ? fmtUsd(data.kpi.untapped_lifetime_value_usd) : '—'} />
              <KpiRow label="Qualified Buildings" value={data.kpi ? fmtNum(data.kpi.count_qualified) : '—'} />
              <KpiRow label="Existing Installs" value={data.kpi ? fmtNum(data.kpi.existing_installs_count) : '—'} />
              <KpiRow label="Adoption Rate" value={data.kpi?.adoption_rate_pct != null ? `${data.kpi.adoption_rate_pct.toFixed(1)}%` : '—'} />
              <KpiRow label="Sunlight Grade" value={data.kpi?.sunlight_grade ?? '—'} />
              <KpiRow label="Counties" value={data.kpi ? fmtNum(data.kpi.county_count) : '—'} />
            </AccordionSection>

            <AccordionSection title="Potential Impact" open={sections.impact} onToggle={() => toggle('impact')}>
              <TableHeader cols={['If All Untapped Solar Installed', 'Est./yr']} />
              <KpiRow label="CO₂ Offset" value={impact ? `${fmtNum(Math.round(impact.co2Tons))} tons` : '—'} />
              <KpiRow label="Grid Cost Offset" value={impact ? fmtUsd(impact.costOffset) : '—'} />
              <KpiRow label="Homes Powered" value={data.kpi ? fmtNum(data.kpi.homes_powered_equivalent) : '—'} />
              <KpiRow label="Cars Off Road Equiv." value={data.kpi ? fmtNum(data.kpi.cars_off_road_equivalent) : '—'} />
            </AccordionSection>

            {data.topCounties.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] pt-1 pb-2">Top Counties</p>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <TableHeader cols={['County', 'Buildings', 'Potential/yr']} />
                  <div className="divide-y divide-[var(--border)]">
                    {data.topCounties.map((c, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2.5 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--txt)] truncate">{c.region_name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{c.state_name}</p>
                        </div>
                        <span className="text-xs text-[var(--muted)] tabular-nums">{fmtNum(c.count_qualified)}</span>
                        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{fmtUsd(c.untapped_annual_value_usd)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-[var(--muted)]">Failed to load data</p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)]">
        <button onClick={() => router.push(`/gea-regions/${geaToSlug(gea)}`)}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: color }}>
          View Full Region Detail →
        </button>
      </div>
    </div>
  )
}

export function GEADrawer({ gea, onClose }: { gea: string | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const root = document.getElementById('chat-panel-root')
  if (!root) return null
  return createPortal(
    <div className={`fixed inset-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${gea ? 'w-full sm:w-[360px] sm:ml-[18px]' : 'w-0'}`}>
      {gea && (
        <>
          <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={onClose} />
          <div className="relative h-full"><DrawerContent gea={gea} onClose={onClose} /></div>
        </>
      )}
    </div>,
    root
  )
}
