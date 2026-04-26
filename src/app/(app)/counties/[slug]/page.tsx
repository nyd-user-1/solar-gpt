export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import {
  getCountyBySlug,
  getAdjacentCounties,
  getCitiesByState,
  getHeatmapPoints,
  nameToSlug,
} from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function CountyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const county = await getCountyBySlug(slug)
  if (!county) notFound()

  const [adjacent, cities, heatmapPoints] = await Promise.all([
    getAdjacentCounties(county.id, county.state_name),
    getCitiesByState(county.state_name, 16),
    getHeatmapPoints(county.lat_min, county.lat_max, county.lng_min, county.lng_max),
  ])

  const prev = adjacent.prev
    ? { label: adjacent.prev.region_name, href: `/counties/${nameToSlug(adjacent.prev.region_name)}` }
    : null
  const next = adjacent.next
    ? { label: adjacent.next.region_name, href: `/counties/${nameToSlug(adjacent.next.region_name)}` }
    : null

  const infoRows = [
    { label: 'Untapped Value / yr', value: fmtUsd(county.untapped_annual_value_usd), highlight: true },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(county.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${county.sunlight_grade}  (${county.sunlight_stars}/5 ☀)` },
    { label: 'Qualified Buildings', value: fmtNum(county.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(county.existing_installs_count) },
    { label: 'Adoption Rate', value: county.adoption_rate_pct != null ? `${county.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(county.median_install_cost_usd) },
    { label: 'Median Payback', value: county.median_payback_years != null ? `${county.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(county.median_annual_savings_usd) },
    { label: 'GEA Region', value: county.cambium_gea ?? '—' },
  ]

  const carouselItems = cities.map(city => ({
    title: city.region_name,
    subtitle: `${fmtNum(city.count_qualified)} solar-ready buildings`,
    href: `/cities/${nameToSlug(city.region_name)}`,
    metric: fmtUsd(city.untapped_annual_value_usd),
    metricLabel: 'untapped/yr',
  }))

  return (
    <GeoDetailPage
      title={county.region_name}
      breadcrumbs={[
        { label: 'Counties', href: '/counties' },
        ...(county.cambium_gea ? [{ label: county.cambium_gea, href: `/gea-regions/${county.cambium_gea.toLowerCase().replace(/_/g, '-')}` }] : []),
      ]}
      prev={prev}
      next={next}
      listHref="/counties"
      listLabel="All Counties"
      infoRows={infoRows}
      carouselTitle={`Top Cities in ${county.state_name}`}
      carouselItems={carouselItems}
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: county.lat_avg, lng: county.lng_avg }}
      mapBounds={{ north: county.lat_max, south: county.lat_min, east: county.lng_max, west: county.lng_min }}
      mapMarkers={cities.map(c => ({ position: { lat: c.lat_avg, lng: c.lng_avg }, label: c.region_name }))}
      heatmapPoints={heatmapPoints}
      chatContext={`${county.region_name}, ${county.state_name}`}
    />
  )
}
