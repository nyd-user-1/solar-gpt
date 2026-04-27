export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getCityBySlug, getAdjacentCities, getSiblingCities, getHeatmapPoints, nameToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const [adjacent, siblings, heatmapPoints] = await Promise.all([
    getAdjacentCities(city.id, city.state_name),
    getSiblingCities(city.state_name, city.id, 12),
    getHeatmapPoints(city.lat_min, city.lat_max, city.lng_min, city.lng_max),
  ])

  const prev = adjacent.prev
    ? { label: adjacent.prev.region_name, href: `/cities/${nameToSlug(adjacent.prev.region_name)}` }
    : null
  const next = adjacent.next
    ? { label: adjacent.next.region_name, href: `/cities/${nameToSlug(adjacent.next.region_name)}` }
    : null

  const infoRows = [
    { label: 'Untapped Value / yr', value: fmtUsd(city.untapped_annual_value_usd), highlight: true },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(city.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${city.sunlight_grade}  (${city.sunlight_stars}/5 ☀)` },
    { label: 'Qualified Buildings', value: fmtNum(city.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(city.existing_installs_count) },
    { label: 'Adoption Rate', value: city.adoption_rate_pct != null ? `${city.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(city.median_install_cost_usd) },
    { label: 'Median Payback', value: city.median_payback_years != null ? `${city.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(city.median_annual_savings_usd) },
    { label: 'State', value: city.state_name },
  ]

  const carouselItems = siblings.map(c => ({
    title: c.region_name,
    subtitle: `${fmtNum(c.count_qualified)} solar-ready buildings`,
    href: `/cities/${nameToSlug(c.region_name)}`,
    metric: fmtUsd(c.untapped_annual_value_usd),
    metricLabel: 'untapped/yr',
  }))

  return (
    <GeoDetailPage
      title={city.region_name}
      breadcrumbs={[{ label: 'Cities', href: '/cities' }]}
      prev={prev}
      next={next}
      listHref="/cities"
      listLabel="All Cities"
      infoRows={infoRows}
      carouselTitle={`Other Cities in ${city.state_name}`}
      carouselItems={carouselItems}
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: city.lat_avg, lng: city.lng_avg }}
      mapBounds={{ north: city.lat_max, south: city.lat_min, east: city.lng_max, west: city.lng_min }}
      heatmapPoints={heatmapPoints}
      chatContext={`${city.region_name}, ${city.state_name}`}
    />
  )
}
