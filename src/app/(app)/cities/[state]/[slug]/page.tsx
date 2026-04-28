export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getCityBySlug, getAdjacentCities, getAllCitiesForState, getHeatmapPoints, nameToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function CityDetailPage({ params }: { params: Promise<{ state: string; slug: string }> }) {
  const { state: stateSlug, slug } = await params
  const city = await getCityBySlug(stateSlug, slug)
  if (!city) notFound()

  const cityStateSlug = nameToSlug(city.state_name)

  const [adjacent, allCities, heatmapPoints] = await Promise.all([
    getAdjacentCities(city.id, city.state_name),
    getAllCitiesForState(city.state_name),
    getHeatmapPoints(city.lat_min, city.lat_max, city.lng_min, city.lng_max),
  ])

  const prev = adjacent.prev
    ? { label: adjacent.prev.region_name, href: `/cities/${cityStateSlug}/${nameToSlug(adjacent.prev.region_name)}` }
    : null
  const next = adjacent.next
    ? { label: adjacent.next.region_name, href: `/cities/${cityStateSlug}/${nameToSlug(adjacent.next.region_name)}` }
    : null

  const infoRows = [
    { label: 'Potential / yr', value: fmtUsd(city.untapped_annual_value_usd), highlight: true },
    { label: 'Qualified Buildings', value: fmtNum(city.count_qualified) },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(city.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${city.sunlight_grade}  (${city.sunlight_stars}/5 ☀)` },
    { label: 'Existing Installs', value: fmtNum(city.existing_installs_count) },
    { label: 'Adoption Rate', value: city.adoption_rate_pct != null ? `${city.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(city.median_install_cost_usd) },
    { label: 'Median Payback', value: city.median_payback_years != null ? `${city.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(city.median_annual_savings_usd) },
    { label: 'State', value: city.state_name },
  ]

  const carouselItems = allCities
    .filter(c => c.id !== city.id)
    .map(c => ({
      title: c.region_name,
      subtitle: fmtNum(c.count_qualified),
      href: `/cities/${cityStateSlug}/${nameToSlug(c.region_name)}`,
      metric: fmtUsd(c.untapped_annual_value_usd),
    }))

  return (
    <GeoDetailPage
      title={city.region_name}
      breadcrumbs={[
        { label: 'Cities', href: '/cities' },
        { label: city.state_name, href: `/states/${cityStateSlug}` },
      ]}
      prev={prev}
      next={next}
      listHref="/cities"
      listLabel="All Cities"
      infoRows={infoRows}
      defaultInfoRows={2}
      carouselTitle={`${city.state_name} Cities`}
      carouselItems={carouselItems}
      carouselScrollable
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: city.lat_avg, lng: city.lng_avg }}
      mapBounds={{ north: city.lat_max, south: city.lat_min, east: city.lng_max, west: city.lng_min }}
      heatmapPoints={heatmapPoints}
      chatContext={`${city.region_name}, ${city.state_name}`}
    />
  )
}
