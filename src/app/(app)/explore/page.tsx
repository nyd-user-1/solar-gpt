export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getExploreCounties, getAllGeas, getGeaKpi, type CountyKpi, type GeaKpi } from '@/lib/queries'
import { nameToSlug, geaToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'

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
      href={`/counties/${nameToSlug(county.region_name)}`}
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

function GeaCard({ gea, kpi, index }: { gea: string; kpi: GeaKpi | null; index: number }) {
  const gradient = CARD_GRADIENTS[(index + 3) % CARD_GRADIENTS.length]
  return (
    <Link
      href={`/gea-regions/${geaToSlug(gea)}`}
      className="group relative w-full aspect-[16/9] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-85 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      {kpi && (
        <div className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1">
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
  const [counties, geas] = await Promise.all([
    getExploreCounties(),
    getAllGeas(),
  ])

  const geaKpis = await Promise.all(geas.map(g => getGeaKpi(g)))
  const featured = counties.slice(0, 12)

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 pt-6 pb-16 sm:pb-10">

          {/* Top counties horizontal scroll */}
          <div className="-mx-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {featured.map((county, i) => (
                <CountyCard key={county.id} county={county} index={i} />
              ))}
            </div>
          </div>

          {/* Regions grid */}
          <h2 className="text-xl font-bold text-[var(--txt)] mt-8 mb-4">Region</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {geas.map((gea, i) => (
              <GeaCard key={gea} gea={gea} kpi={geaKpis[i]} index={i} />
            ))}
          </div>

          <h2 className="text-xl font-bold text-[var(--txt)] mt-8 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-solar" />
            All NY Counties
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {counties.map(county => (
              <Link
                key={county.id}
                href={`/counties/${nameToSlug(county.region_name)}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] px-4 py-3 transition-all hover:shadow-md hover:border-solar group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--txt)] truncate">{county.region_name}</p>
                  <p className="text-xs text-[var(--muted)]">{fmtUsd(county.untapped_annual_value_usd)}/yr</p>
                </div>
                <span className="text-xs font-bold text-solar shrink-0 ml-2">{county.sunlight_grade}</span>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
