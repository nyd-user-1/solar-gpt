export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getExploreCounties, getAllGeas, getGeaKpi, getAllStates, getCountiesForMap, getStatesForMap, type CountyKpi, type GeaKpi, type StateKpi } from '@/lib/queries'
import { nameToSlug, geaToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'
import { US_STATES } from '@/lib/us-states'
import CountyChoropleth from '@/components/CountyChoropleth'
import { StateCardClient } from '@/components/StateCardClient'
import GEAMiniMap from '@/components/GEAMiniMap'

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


function CountyCard({ county, index }: { county: CountyKpi; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  return (
    <Link
      href={`/counties/${nameToSlug(county.state_name)}/${nameToSlug(county.region_name)}`}
      className="group relative shrink-0 w-[calc(50vw-22px)] sm:w-[220px] aspect-[3/4] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
        <span className="text-xs font-bold text-white">{fmtUsd(county.untapped_annual_value_usd)}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-sm font-bold text-white leading-snug">{county.region_name}</p>
      </div>
    </Link>
  )
}

function GeaCard({ gea, kpi, stateNames }: { gea: string; kpi: GeaKpi | null; stateNames: string[] }) {
  const bounds = kpi
    ? { north: kpi.lat_max, south: kpi.lat_min, east: kpi.lng_max, west: kpi.lng_min }
    : { north: 49, south: 25, east: -67, west: -124 }
  return (
    <Link
      href={`/gea-regions/${geaToSlug(gea)}`}
      className="group relative w-full aspect-[16/9] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* Mini-map replacing the gradient */}
      <GEAMiniMap stateNames={stateNames} bounds={bounds} />
      {/* Scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      {/* Hover tint */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      {kpi && (
        <div className="absolute top-4 right-4 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1">
          <span className="text-sm font-bold text-white">{fmtUsd(kpi.untapped_annual_value_usd)}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <p className="text-lg font-bold text-white mb-0.5">{fmtGea(gea)}</p>
        <p className="text-sm text-white/80">
          {kpi ? `${fmtNum(kpi.county_count)} counties` : '—'}
        </p>
      </div>
    </Link>
  )
}

export default async function ExplorePage() {
  const [counties, geas, states, mapCounties, mapStates] = await Promise.all([
    getExploreCounties(),
    getAllGeas(),
    getAllStates(),
    getCountiesForMap(),
    getStatesForMap(),
  ])

  const geaKpis = await Promise.all(geas.map(g => getGeaKpi(g)))
  const featuredCounties = counties.slice(0, 12)
  const featuredStates = states
    .filter(s => US_STATES.has(s.state_name))
    .sort((a, b) => a.state_name.localeCompare(b.state_name))

  // Build GEA → unique state names map from county data
  const geaStateMap = new Map<string, Set<string>>()
  for (const c of mapCounties) {
    if (c.cambium_gea) {
      if (!geaStateMap.has(c.cambium_gea)) geaStateMap.set(c.cambium_gea, new Set())
      geaStateMap.get(c.cambium_gea)!.add(c.state_name)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 pt-6 pb-16 sm:pb-10">

          {/* County choropleth map */}
          <CountyChoropleth counties={mapCounties} states={mapStates} />

          {/* States horizontal scroll */}
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

          {/* Regions grid */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Region</span>
            <div className="flex-1 border-t border-[var(--border)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {geas.map((gea, i) => (
              <GeaCard
                key={gea}
                gea={gea}
                kpi={geaKpis[i]}
                stateNames={Array.from(geaStateMap.get(gea) ?? [])}
              />
            ))}
          </div>

          {/* Counties horizontal scroll */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">County</span>
            <div className="flex-1 border-t border-[var(--border)]" />
          </div>
          <div className="-mx-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {featuredCounties.map((county, i) => (
                <CountyCard key={county.id} county={county} index={i} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
