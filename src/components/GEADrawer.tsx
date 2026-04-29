'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, ChevronDown, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { geaToSlug } from '@/lib/queries'
import { getGeaColor } from '@/lib/gea-colors'

type TopCounty = { region_name: string; state_name: string; untapped_annual_value_usd: number }
type AnnualRow = { year: number; energy_usd_per_mwh?: number; co2_kg_per_mwh?: number }

type CambiumMetrics = {
  cost_per_mwh: number
  lrmer_co2_per_mwh: number
  levelized_cost_per_mwh?: number
  levelized_co2_per_mwh?: number
} | null

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

export type CountyDrawerData = {
  name: string
  state: string
  value: number
  buildings: number
  gea: string
  countySlug: string
  stateSlug: string
}

// Coerce DB numeric-as-string to number
function n(v: unknown): number { return Number(v) }

// ── Shared primitives ─────────────────────────────────────────────────────────

function KpiRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-solar' : 'text-[var(--txt)]'}`}>{value}</span>
    </div>
  )
}

function AccordionSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--txt)]">{title}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

// Shared Grid Economics section — GEA-level metrics cascade to state/county via GEA assignment
function GridEconomicsSection({
  cambium, annualCosts, annualLrmer, open, onToggle,
}: {
  cambium: CambiumMetrics
  annualCosts: AnnualRow[]
  annualLrmer: AnnualRow[]
  open: boolean
  onToggle: () => void
}) {
  const cost2030 = annualCosts.find(r => r.year === 2030)?.energy_usd_per_mwh
  const cost2050 = annualCosts.find(r => r.year === 2050)?.energy_usd_per_mwh
  const co2_2025 = annualLrmer.find(r => r.year === 2025)?.co2_kg_per_mwh
  const co2_2050 = annualLrmer.find(r => r.year === 2050)?.co2_kg_per_mwh

  const co2_2025n = co2_2025 != null ? n(co2_2025) : null
  const co2_2050n = co2_2050 != null ? n(co2_2050) : null

  const decarb = co2_2025n && co2_2050n
    ? `${((1 - co2_2050n / co2_2025n) * 100).toFixed(0)}% by 2050`
    : null

  return (
    <AccordionSection title="Grid Economics" open={open} onToggle={onToggle}>
      <KpiRow label="Marginal Cost (2025)" value={cambium ? `$${n(cambium.cost_per_mwh).toFixed(2)}/MWh` : '—'} />
      {cambium?.levelized_cost_per_mwh != null && (
        <KpiRow label="Levelized Cost (LCOE)" value={`$${n(cambium.levelized_cost_per_mwh).toFixed(2)}/MWh`} />
      )}
      {cost2030 != null && (
        <KpiRow label="2030 Cost Projection" value={`$${n(cost2030).toFixed(2)}/MWh`} />
      )}
      {cost2050 != null && (
        <KpiRow label="2050 Cost Projection" value={`$${n(cost2050).toFixed(2)}/MWh`} />
      )}
      <KpiRow label="Emissions Intensity (2025)" value={cambium ? `${n(cambium.lrmer_co2_per_mwh).toFixed(1)} kg CO₂/MWh` : '—'} />
      {cambium?.levelized_co2_per_mwh != null && (
        <KpiRow label="Levelized CO₂ Rate" value={`${n(cambium.levelized_co2_per_mwh).toFixed(1)} kg CO₂/MWh`} />
      )}
      {co2_2050n != null && (
        <KpiRow label="2050 Emissions Intensity" value={`${co2_2050n.toFixed(1)} kg CO₂/MWh`} />
      )}
      {decarb && (
        <KpiRow label="Grid Decarbonization" value={decarb} highlight />
      )}
    </AccordionSection>
  )
}

// Shared Potential Impact section
function PotentialImpactSection({
  kwhTotal, cambium, homesPowered, carsOffRoad, open, onToggle,
}: {
  kwhTotal: number
  cambium: CambiumMetrics
  homesPowered: number
  carsOffRoad: number
  open: boolean
  onToggle: () => void
}) {
  const mwh = n(kwhTotal) / 1000
  const co2Tons = cambium ? (mwh * n(cambium.lrmer_co2_per_mwh)) / 1000 : null
  const costOffset = cambium ? mwh * n(cambium.cost_per_mwh) : null
  const co2Tons25yr = co2Tons ? co2Tons * 25 : null

  return (
    <AccordionSection title="Potential Impact" open={open} onToggle={onToggle}>
      <KpiRow label="Annual CO₂ Offset" value={co2Tons ? `${fmtNum(Math.round(co2Tons))} tons/yr` : '—'} />
      <KpiRow label="25-Year CO₂ Savings" value={co2Tons25yr ? `${fmtNum(Math.round(co2Tons25yr))} tons` : '—'} />
      <KpiRow label="Grid Cost Offset" value={costOffset ? fmtUsd(costOffset) + '/yr' : '—'} />
      <KpiRow label="Homes Powered" value={fmtNum(homesPowered)} />
      <KpiRow label="Cars Off Road Equiv." value={fmtNum(carsOffRoad)} />
    </AccordionSection>
  )
}

// ── GEA view ──────────────────────────────────────────────────────────────────

function GEAView({ gea, onClose }: { gea: string; onClose: () => void }) {
  const router = useRouter()
  const color = getGeaColor(gea)
  const [data, setData] = useState<{
    kpi: GeaKpiData | null
    cambiumMetrics: CambiumMetrics
    annualCosts: AnnualRow[]
    annualLrmer: AnnualRow[]
    topCounties: TopCounty[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState({ grid: true, solar: true, impact: true, counties: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/gea/${geaToSlug(gea)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [gea])

  return (
    <div className="h-full w-full sm:w-[360px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
        <span className="flex-1 text-sm font-semibold text-[var(--txt)]">{fmtGea(gea)}</span>
        <button onClick={() => router.push(`/gea-regions/${geaToSlug(gea)}`)}
          className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <ExternalLink className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
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
            <GridEconomicsSection
              cambium={data.cambiumMetrics}
              annualCosts={data.annualCosts}
              annualLrmer={data.annualLrmer}
              open={sections.grid} onToggle={() => toggle('grid')}
            />

            <AccordionSection title="Solar Potential" open={sections.solar} onToggle={() => toggle('solar')}>
              <KpiRow label="Annual Potential" value={data.kpi ? fmtUsd(data.kpi.untapped_annual_value_usd) : '—'} />
              <KpiRow label="Lifetime Value (25yr)" value={data.kpi ? fmtUsd(data.kpi.untapped_lifetime_value_usd) : '—'} />
              <KpiRow label="Qualified Buildings" value={data.kpi ? fmtNum(data.kpi.count_qualified) : '—'} />
              <KpiRow label="Existing Installs" value={data.kpi ? fmtNum(data.kpi.existing_installs_count) : '—'} />
              <KpiRow label="Adoption Rate" value={data.kpi?.adoption_rate_pct != null ? `${data.kpi.adoption_rate_pct.toFixed(1)}%` : '—'} />
              <KpiRow label="Sunlight Grade" value={data.kpi?.sunlight_grade ?? '—'} />
              <KpiRow label="Counties" value={data.kpi ? fmtNum(data.kpi.county_count) : '—'} />
            </AccordionSection>

            {data.kpi && (
              <PotentialImpactSection
                kwhTotal={data.kpi.yearly_sunlight_kwh_total}
                cambium={data.cambiumMetrics}
                homesPowered={data.kpi.homes_powered_equivalent}
                carsOffRoad={data.kpi.cars_off_road_equivalent}
                open={sections.impact} onToggle={() => toggle('impact')}
              />
            )}

            {data.topCounties.length > 0 && (
              <AccordionSection title="Top Counties" open={sections.counties} onToggle={() => toggle('counties')}>
                {data.topCounties.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium text-[var(--txt)] truncate">{c.region_name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{c.state_name}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color }}>{fmtUsd(c.untapped_annual_value_usd)}</span>
                  </div>
                ))}
              </AccordionSection>
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

// ── County view ───────────────────────────────────────────────────────────────

type CountyKpiDetail = {
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  count_qualified: number
  existing_installs_count: number
  adoption_rate_pct: number
  sunlight_grade: string
  carbon_offset_metric_tons: number
  median_annual_savings_usd: number
  homes_powered_equivalent: number
  cars_off_road_equivalent: number
  yearly_sunlight_kwh_total: number
  cambium_gea?: string
}

type ZipEntry = { zip_code: string; untapped_annual_value_usd: number }

function CountyView({ county, onBack, onClose }: { county: CountyDrawerData; onBack: () => void; onClose: () => void }) {
  const router = useRouter()
  const color = getGeaColor(county.gea)
  const [data, setData] = useState<{ kpi: CountyKpiDetail | null; cambiumMetrics: CambiumMetrics; topZips: ZipEntry[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState({ grid: true, solar: true, impact: true, zips: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ region: county.name, state: county.state })
    fetch(`/api/county-detail?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [county.name, county.state])

  const kpi = data?.kpi

  return (
    <div className="h-full w-full sm:w-[360px] rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl sm:shadow-none">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border)] shrink-0">
        <button onClick={onBack} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--txt)] truncate">{county.name}</p>
          <p className="text-[10px] text-[var(--muted)]">{county.state}</p>
        </div>
        <button onClick={() => router.push(`/counties/${county.stateSlug}/${county.countySlug}`)}
          className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <ExternalLink className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-5 w-5 rounded-full border-2 border-[var(--border)] border-t-solar animate-spin" />
          </div>
        ) : (
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Grid Economics — GEA-level metrics cascade to county */}
            <GridEconomicsSection
              cambium={data?.cambiumMetrics ?? null}
              annualCosts={[]}
              annualLrmer={[]}
              open={sections.grid} onToggle={() => toggle('grid')}
            />

            <AccordionSection title="Solar Potential" open={sections.solar} onToggle={() => toggle('solar')}>
              <KpiRow label="Annual Potential" value={kpi ? fmtUsd(kpi.untapped_annual_value_usd) : fmtUsd(county.value)} />
              <KpiRow label="Lifetime Value (25yr)" value={kpi ? fmtUsd(kpi.untapped_lifetime_value_usd) : '—'} />
              <KpiRow label="Qualified Buildings" value={kpi ? fmtNum(kpi.count_qualified) : fmtNum(county.buildings)} />
              <KpiRow label="Existing Installs" value={kpi ? fmtNum(kpi.existing_installs_count) : '—'} />
              <KpiRow label="Adoption Rate" value={kpi?.adoption_rate_pct != null ? `${kpi.adoption_rate_pct.toFixed(1)}%` : '—'} />
              <KpiRow label="Sunlight Grade" value={kpi?.sunlight_grade ?? '—'} />
              <KpiRow label="Median Annual Savings" value={kpi ? fmtUsd(kpi.median_annual_savings_usd) : '—'} />
              <KpiRow label="GEA Region" value={fmtGea(county.gea)} />
            </AccordionSection>

            {kpi && (
              <PotentialImpactSection
                kwhTotal={kpi.yearly_sunlight_kwh_total}
                cambium={data?.cambiumMetrics ?? null}
                homesPowered={kpi.homes_powered_equivalent}
                carsOffRoad={kpi.cars_off_road_equivalent}
                open={sections.impact} onToggle={() => toggle('impact')}
              />
            )}

            {data && data.topZips.length > 0 && (
              <AccordionSection title="Top ZIP Codes" open={sections.zips} onToggle={() => toggle('zips')}>
                {data.topZips.map((z, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--txt)]">{z.zip_code}</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color }}>{fmtUsd(z.untapped_annual_value_usd)}</span>
                  </div>
                ))}
              </AccordionSection>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[var(--border)]">
        <button onClick={() => router.push(`/counties/${county.stateSlug}/${county.countySlug}`)}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: color }}>
          View County Detail →
        </button>
      </div>
    </div>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function GEADrawer({ gea, county, onClose, onCountyBack }: {
  gea: string | null
  county?: CountyDrawerData | null
  onClose: () => void
  onCountyBack?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const root = document.getElementById('chat-panel-root')
  if (!root) return null

  const open = !!(gea || county)

  return createPortal(
    <div className={`fixed inset-0 z-50 sm:static sm:inset-auto sm:z-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? 'w-full sm:w-[360px] sm:ml-[18px]' : 'w-0'}`}>
      {open && (
        <>
          <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={onClose} />
          <div className="relative h-full">
            {county
              ? <CountyView county={county} onBack={onCountyBack ?? onClose} onClose={onClose} />
              : gea ? <GEAView gea={gea} onClose={onClose} /> : null
            }
          </div>
        </>
      )}
    </div>,
    root
  )
}
