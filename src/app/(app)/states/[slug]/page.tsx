export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getStateBySlug, getAllStates, getCountiesByState, getCountiesForState, nameToSlug } from '@/lib/queries'
import { US_STATES } from '@/lib/us-states'
import { STATE_FIPS } from '@/lib/state-fips'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function StateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [state, allStates] = await Promise.all([
    getStateBySlug(slug),
    getAllStates(),
  ])
  if (!state) notFound()

  const sorted = allStates
    .filter(s => US_STATES.has(s.state_name))
    .sort((a, b) => (b.count_qualified ?? 0) - (a.count_qualified ?? 0))
  const idx = sorted.findIndex(s => s.state_name === state.state_name)
  const n = sorted.length

  const prevState = n > 0 ? sorted[(idx - 1 + n) % n] : null
  const nextState = n > 0 ? sorted[(idx + 1) % n] : null

  const prev = prevState ? { label: prevState.state_name, href: `/states/${nameToSlug(prevState.state_name)}` } : null
  const next = nextState ? { label: nextState.state_name, href: `/states/${nameToSlug(nextState.state_name)}` } : null

  const [counties, countyMapData] = await Promise.all([
    getCountiesByState(state.state_name),
    getCountiesForState(state.state_name),
  ])
  const stateFips = STATE_FIPS[state.state_name] ?? ''

  const infoRows = [
    { label: 'Untapped Value / yr', value: fmtUsd(state.untapped_annual_value_usd), highlight: true },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(state.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${state.sunlight_grade}  (${state.sunlight_stars}/5 ☀)` },
    { label: 'Qualified Buildings', value: fmtNum(state.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(state.existing_installs_count) },
    { label: 'Adoption Rate', value: state.adoption_rate_pct != null ? `${state.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(state.median_install_cost_usd) },
    { label: 'Median Payback', value: state.median_payback_years != null ? `${state.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(state.median_annual_savings_usd) },
    { label: 'Counties', value: counties.length.toString() },
  ]

  const carouselItems = counties.slice(0, 20).map(c => ({
    title: c.region_name,
    subtitle: `${fmtNum(c.count_qualified)} solar-ready buildings`,
    href: `/counties/${nameToSlug(c.region_name)}`,
    metric: fmtUsd(c.untapped_annual_value_usd),
    metricLabel: 'untapped/yr',
  }))

  return (
    <GeoDetailPage
      title={state.state_name}
      breadcrumbs={[{ label: 'States', href: '/states' }]}
      prev={prev}
      next={next}
      listHref="/states"
      listLabel="All States"
      infoRows={infoRows}
      carouselTitle="Top Counties"
      carouselItems={carouselItems}
      searchPlaceholder="Search counties…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapBounds={{ north: state.lat_max, south: state.lat_min, east: state.lng_max, west: state.lng_min }}
      stateCountyData={{ counties: countyMapData, fips: stateFips, name: state.state_name }}
      chatContext={state.state_name}
    />
  )
}
