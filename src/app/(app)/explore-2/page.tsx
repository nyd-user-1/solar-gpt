export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllGeas, getGeaKpi, getAllStates, getCountiesForMap, getStatesForMap, getStateGeaMappings, type GeaKpi, type StateKpi } from '@/lib/queries'
import { nameToSlug, geaToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { US_STATES } from '@/lib/us-states'
import GEAChoropleth from '@/components/GEAChoropleth'
import { StateCardClient } from '@/components/StateCardClient'
import GEAMiniMap from '@/components/GEAMiniMap'
import { GEA_COLORS } from '@/lib/gea-colors'

const CARD_GRADIENTS = [
  'from-amber-400 to-orange-500',
  'from-yellow-400 to-amber-500',
  'from-orange-400 to-red-400',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
]

function GeaScrollCard({ gea, kpi, stateNames, index }: { gea: string; kpi: GeaKpi | null; stateNames: string[]; index: number }) {
  const gradient = CARD_GRADIENTS[(index + 3) % CARD_GRADIENTS.length]
  const bounds = kpi
    ? { north: kpi.lat_max, south: kpi.lat_min, east: kpi.lng_max, west: kpi.lng_min }
    : { north: 49, south: 25, east: -67, west: -124 }
  return (
    <Link
      href={`/gea-regions/${geaToSlug(gea)}`}
      className="group relative shrink-0 w-[calc(72vw-22px)] sm:w-[380px] aspect-[4/3] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      <GEAMiniMap stateNames={stateNames} bounds={bounds} highlightColor={GEA_COLORS[gea]} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      <div className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm px-2 py-1">
        <span className="text-xs font-bold text-white">{kpi ? fmtUsd(kpi.untapped_annual_value_usd) : '—'}</span>
      </div>
      <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">
        <p className="text-sm font-bold text-white leading-snug">{fmtGea(gea)}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
        <p className="text-xs text-white/80">{kpi ? `${fmtNum(kpi.county_count)} counties` : '—'}</p>
        <span className="text-[10px] font-bold text-white bg-[#f59e0b] px-2 py-1 rounded-full">
          Detail →
        </span>
      </div>
    </Link>
  )
}

export default async function Explore2Page() {
  const [geas, allStates, mapCounties, mapStates, stateGeaMappings] = await Promise.all([
    getAllGeas(),
    getAllStates(),
    getCountiesForMap(),
    getStatesForMap(),
    getStateGeaMappings(),
  ])

  const geaKpis = await Promise.all(geas.map(g => getGeaKpi(g)))
  const stateGeaMap: Record<string, string> = {}
  for (const m of stateGeaMappings) stateGeaMap[m.state_name] = m.cambium_gea
  const featuredStates = allStates
    .filter(s => US_STATES.has(s.state_name))
    .sort((a, b) => a.state_name.localeCompare(b.state_name))

  // Build GEA → state names (≥5 counties threshold)
  const geaStateCountMap = new Map<string, Map<string, number>>()
  for (const c of mapCounties) {
    if (c.cambium_gea) {
      if (!geaStateCountMap.has(c.cambium_gea)) geaStateCountMap.set(c.cambium_gea, new Map())
      const sm = geaStateCountMap.get(c.cambium_gea)!
      sm.set(c.state_name, (sm.get(c.state_name) ?? 0) + 1)
    }
  }
  const getGeaStateNames = (gea: string): string[] => {
    const sm = geaStateCountMap.get(gea)
    if (!sm) return []
    return Array.from(sm.entries()).filter(([, n]) => n >= 1).map(([s]) => s)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 pt-6 pb-16 sm:pb-10">

          {/* GEA Region choropleth map */}
          <GEAChoropleth mode="county" counties={mapCounties} geaKpis={geaKpis.filter(Boolean) as import('@/lib/queries').GeaKpi[]} />

          {/* GEA region horizontal scroll */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Region</span>
            <div className="flex-1 border-t border-[var(--border)]" />
          </div>
          <div className="-mx-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {geas.map((gea, i) => (
                <GeaScrollCard
                  key={gea}
                  gea={gea}
                  kpi={geaKpis[i]}
                  stateNames={getGeaStateNames(gea)}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* State horizontal scroll */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">State</span>
            <div className="flex-1 border-t border-[var(--border)]" />
          </div>
          <div className="-mx-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {featuredStates.map((state, i) => (
                <StateCardClient key={state.id} state={state} index={i} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
