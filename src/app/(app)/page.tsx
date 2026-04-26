export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Sun, TrendingUp, Zap, Users, MapPin, Map, ChevronRight, Activity, Building2 } from 'lucide-react'
import {
  getDashboardStats, getTopStates, getTopCounties,
  nameToSlug,
} from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

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

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'A':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'B':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'C':  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'D':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default async function DashboardPage() {
  const [stats, topStates, topCounties] = await Promise.all([
    getDashboardStats(),
    getTopStates(10),
    getTopCounties(10),
  ])

  const kpiCards = [
    {
      label: 'Qualified Buildings',
      value: fmtNum(stats.total_qualified),
      sub: 'solar-ready rooftops',
      icon: Users,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Existing Installs',
      value: fmtNum(stats.total_installs),
      sub: 'already solar-powered',
      icon: Sun,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Untapped / Year',
      value: fmtUsd(stats.total_untapped_annual),
      sub: 'annual opportunity',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Avg Adoption',
      value: `${Number(stats.avg_adoption_pct).toFixed(1)}%`,
      sub: 'of eligible buildings',
      icon: Zap,
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
  ]

  // Lifetime opportunity for the secondary highlight
  const lifetimeValue = topStates.reduce((sum, s) => sum + Number(s.untapped_lifetime_value_usd ?? 0), 0)
  const topState = topStates[0]

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-zoom-in">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-16 sm:pb-10 max-w-5xl mx-auto w-full">

          {/* Welcome header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--txt)]">Solar Opportunity Dashboard</h1>
            <p className="text-sm text-[var(--muted)] mt-1">US rooftop solar · Google Sunroof + NREL Cambium · {fmtNum(stats.total_states)} states analyzed</p>
          </div>

          {/* KPI stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {kpiCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${bg} mb-3`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="text-xl font-bold text-[var(--txt)] tabular-nums">{value}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{label}</div>
                <div className="text-[11px] text-[var(--muted2)] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Highlight row — top opportunity + lifetime value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {topState && (
              <Link
                href={`/states/${nameToSlug(topState.state_name)}`}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 hover:border-solar transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                  <Map className="h-5 w-5 text-solar" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--muted)] mb-0.5">Top Opportunity</div>
                  <div className="text-sm font-bold text-[var(--txt)] group-hover:text-solar transition-colors truncate">{topState.state_name}</div>
                  <div className="text-xs text-[var(--muted)]">{fmtUsd(topState.untapped_annual_value_usd)}/yr untapped</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[topState.sunlight_grade] ?? GRADE_COLORS['B']}`}>
                  {topState.sunlight_grade}
                </span>
              </Link>
            )}
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/30">
                <Activity className="h-5 w-5 text-violet-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--muted)] mb-0.5">25-Year Lifetime Value</div>
                <div className="text-sm font-bold text-[var(--txt)] tabular-nums">{fmtUsd(Number(stats.total_untapped_lifetime ?? 0))}</div>
                <div className="text-xs text-[var(--muted)]">across all states (top 10 scope)</div>
              </div>
            </div>
          </div>

          {/* Top States carousel */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--txt)] flex items-center gap-2">
              <Map className="h-4 w-4 text-solar" />
              Top States
            </h2>
            <Link href="/states" className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="-mx-4 overflow-x-auto scrollbar-hide mb-6">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {topStates.map((state, i) => {
                const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                const slug = nameToSlug(state.state_name)
                return (
                  <Link
                    key={state.id}
                    href={`/states/${slug}`}
                    className="group relative shrink-0 w-[160px] sm:w-[200px] aspect-[3/4] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
                      <span className="text-xs font-bold text-white">{state.sunlight_grade}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                      <p className="text-sm font-bold text-white leading-snug">{state.state_name}</p>
                      <p className="text-xs text-white/80">{fmtUsd(state.untapped_annual_value_usd)}/yr untapped</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Top Counties carousel */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--txt)] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-solar" />
              Top Counties
            </h2>
            <Link href="/counties" className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="-mx-4 overflow-x-auto scrollbar-hide mb-6">
            <div className="flex gap-3 px-4 snap-x snap-mandatory pb-2">
              {topCounties.map((county, i) => {
                const gradient = CARD_GRADIENTS[(i + 2) % CARD_GRADIENTS.length]
                const slug = nameToSlug(county.region_name)
                return (
                  <Link
                    key={county.id}
                    href={`/counties/${slug}`}
                    className="group relative shrink-0 w-[calc(50vw-22px)] sm:w-[200px] aspect-[3/4] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
                      <span className="text-xs font-bold text-white">{county.sunlight_grade}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                      <p className="text-sm font-bold text-white leading-snug">{county.region_name}</p>
                      <p className="text-xs text-white/80">{county.state_name}</p>
                      <p className="text-xs text-white/70">{fmtUsd(county.untapped_annual_value_usd)}/yr untapped</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center">
              <div className="text-lg font-bold text-[var(--txt)] tabular-nums">{fmtNum(stats.total_states)}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">States Covered</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center">
              <div className="text-lg font-bold text-solar tabular-nums">{Number(stats.avg_adoption_pct).toFixed(1)}%</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Avg Adoption Rate</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center">
              <div className="text-lg font-bold text-[var(--txt)] tabular-nums">{fmtNum(Number(stats.total_qualified) - Number(stats.total_installs))}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Untapped Buildings</div>
            </div>
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/new-chat"
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 hover:border-solar transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                <Sun className="h-5 w-5 text-solar" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--txt)] group-hover:text-solar transition-colors">Chat with SolarGPT</div>
                <div className="text-xs text-[var(--muted)]">Ask anything about solar potential</div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted)] ml-auto group-hover:text-solar transition-colors" />
            </Link>
            <Link
              href="/leads/new"
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 hover:border-solar transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                <Building2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--txt)] group-hover:text-solar transition-colors">New Lead</div>
                <div className="text-xs text-[var(--muted)]">Add a solar installation prospect</div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted)] ml-auto group-hover:text-solar transition-colors" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
