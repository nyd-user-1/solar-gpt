'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'
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
  sunlight_grade: string
  county_count: number
}

function DrawerContent({ gea, onClose }: { gea: string; onClose: () => void }) {
  const router = useRouter()
  const color = getGeaColor(gea)
  const [data, setData] = useState<{ kpi: GeaKpiData | null; topCounties: TopCounty[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/gea/${geaToSlug(gea)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [gea])

  const kpiRows = data?.kpi ? [
    { label: 'Annual Potential', value: fmtUsd(data.kpi.untapped_annual_value_usd) },
    { label: 'Lifetime Value (25yr)', value: fmtUsd(data.kpi.untapped_lifetime_value_usd) },
    { label: 'Qualified Buildings', value: fmtNum(data.kpi.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(data.kpi.existing_installs_count) },
    { label: 'Adoption Rate', value: data.kpi.adoption_rate_pct != null ? `${data.kpi.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Sunlight Grade', value: data.kpi.sunlight_grade ?? '—' },
    { label: 'Counties', value: fmtNum(data.kpi.county_count) },
  ] : []

  return (
    <div className="h-full w-full sm:w-[360px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none">
      {/* Header */}
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
          <div className="px-4 py-4 flex flex-col gap-5">

            {/* Region Overview */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Region Overview</p>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] px-3 py-2.5 bg-[var(--inp-bg)] border-b border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Metric</span>
                  <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide text-right">Value</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {kpiRows.map(row => (
                    <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2.5">
                      <span className="text-sm text-[var(--muted)]">{row.label}</span>
                      <span className="text-sm font-semibold text-[var(--txt)]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Counties */}
            {data.topCounties.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Top Counties</p>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2.5 bg-[var(--inp-bg)] border-b border-[var(--border)]">
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">County</span>
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide text-right">Buildings</span>
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide text-right">Potential/yr</span>
                  </div>
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

      {/* Footer */}
      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)]">
        <button
          onClick={() => router.push(`/gea-regions/${geaToSlug(gea)}`)}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: color }}
        >
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
