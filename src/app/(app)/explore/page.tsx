'use client'

import Link from 'next/link'
import { NY_COUNTIES, GEA_REGIONS, type GeoCounty } from '@/data/geo'
import { Sun, MapPin, Zap } from 'lucide-react'

// Color palette for county cards (cycles through)
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

function SolarScoreDots({ score }: { score: number }) {
  const full = Math.floor(score)
  const half = score % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Sun
          key={i}
          className={`h-3 w-3 ${i < full ? 'text-solar fill-solar' : i === full && half ? 'text-solar opacity-50' : 'text-[var(--border)]'}`}
        />
      ))}
      <span className="ml-1 text-xs text-[var(--muted)]">{score.toFixed(1)}</span>
    </div>
  )
}

function CountyCard({ county, index }: { county: GeoCounty; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  return (
    <Link
      href={`/counties/${county.slug}`}
      className="group relative shrink-0 w-[calc(50vw-22px)] sm:w-[220px] aspect-[3/4] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Solar score badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
        <Sun className="h-3 w-3 text-white fill-white" />
        <span className="text-xs font-bold text-white">{county.solarScore.toFixed(1)}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-sm font-bold text-white leading-snug">{county.name}</p>
        <p className="text-xs text-white/80">{county.avgInstalls.toLocaleString()} installs/yr</p>
      </div>
    </Link>
  )
}

function GEACard({ region, index }: { region: typeof GEA_REGIONS[0]; index: number }) {
  const gradient = CARD_GRADIENTS[(index + 3) % CARD_GRADIENTS.length]
  return (
    <Link
      href={`/gea-regions/${region.slug}`}
      className="group relative w-full aspect-[16/9] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-85 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="h-4 w-4 text-white/90" />
          <p className="text-lg font-bold text-white">{region.name}</p>
        </div>
        <p className="text-sm text-white/80">{region.counties.length} counties · {region.totalInstalls.toLocaleString()} installs</p>
      </div>
    </Link>
  )
}

export default function ExplorePage() {
  // Featured: top 12 counties by solar score
  const featured = [...NY_COUNTIES].sort((a, b) => b.solarScore - a.solarScore).slice(0, 12)

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-2 pb-16 sm:pb-10">

          {/* Hero */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[var(--txt)]">SolarGPT</h1>
            <p className="text-[var(--muted)] mt-1">Solar installation quotes for New York State</p>
          </div>

          {/* Top counties horizontal scroll */}
          <h2 className="text-xl font-bold text-[var(--txt)] mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5 text-solar" />
            Top Solar Counties
          </h2>
          <div className="-mx-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {featured.map((county, i) => (
                <CountyCard key={county.slug} county={county} index={i} />
              ))}
            </div>
          </div>

          {/* GEA Regions grid */}
          <h2 className="text-xl font-bold text-[var(--txt)] mt-8 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-solar" />
            GEA Regions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GEA_REGIONS.map((region, i) => (
              <GEACard key={region.slug} region={region} index={i} />
            ))}
          </div>

          {/* All counties */}
          <h2 className="text-xl font-bold text-[var(--txt)] mt-8 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-solar" />
            All NY Counties
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {NY_COUNTIES.map(county => (
              <Link
                key={county.slug}
                href={`/counties/${county.slug}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] px-4 py-3 transition-all hover:shadow-md hover:border-solar group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--txt)] truncate">{county.name}</p>
                  <p className="text-xs text-[var(--muted)]">{county.avgInstalls}/yr</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Sun className="h-3.5 w-3.5 text-solar" />
                  <span className="text-xs font-bold text-solar">{county.solarScore.toFixed(1)}</span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
