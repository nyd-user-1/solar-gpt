export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getStateBySlug, getCountiesByState, nameToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function StateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const state = await getStateBySlug(slug)
  if (!state) notFound()

  const counties = await getCountiesByState(state.state_name)

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
      listHref="/states"
      listLabel="All States"
      infoRows={infoRows}
      carouselTitle="Top Counties"
      carouselItems={carouselItems}
      searchPlaceholder="Search counties…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: state.lat_avg, lng: state.lng_avg }}
      mapBounds={{ north: state.lat_max, south: state.lat_min, east: state.lng_max, west: state.lng_min }}
      mapMarkers={counties.slice(0, 10).map(c => ({ position: { lat: c.lat_avg, lng: c.lng_avg }, label: c.region_name }))}
    />
  )
}
