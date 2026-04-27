export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getAllGeas, getGeaKpi, getCountiesByGea, getHeatmapPoints, geaToSlug, slugToGea, nameToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'

export default async function GeaRegionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allGeas = await getAllGeas()
  const gea = slugToGea(slug, allGeas)
  if (!gea) notFound()

  const [kpi, counties] = await Promise.all([
    getGeaKpi(gea),
    getCountiesByGea(gea),
  ])
  if (!kpi) notFound()

  const heatmapPoints = await getHeatmapPoints(kpi.lat_min, kpi.lat_max, kpi.lng_min, kpi.lng_max)

  const sorted = [...allGeas].sort()
  const idx = sorted.indexOf(gea)
  const prev = idx > 0 ? { label: fmtGea(sorted[idx - 1]), href: `/gea-regions/${geaToSlug(sorted[idx - 1])}` } : null
  const next = idx < sorted.length - 1 ? { label: fmtGea(sorted[idx + 1]), href: `/gea-regions/${geaToSlug(sorted[idx + 1])}` } : null

  const infoRows = [
    { label: 'Untapped Value / yr', value: fmtUsd(kpi.untapped_annual_value_usd), highlight: true },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(kpi.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${kpi.sunlight_grade}  (${kpi.sunlight_stars}/5 ☀)` },
    { label: 'Qualified Buildings', value: fmtNum(kpi.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(kpi.existing_installs_count) },
    { label: 'Adoption Rate', value: kpi.adoption_rate_pct != null ? `${kpi.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Counties', value: kpi.county_count.toString() },
    { label: 'Cars Off Road Equiv.', value: fmtNum(kpi.cars_off_road_equivalent) },
    { label: 'Homes Powered Equiv.', value: fmtNum(kpi.homes_powered_equivalent) },
  ]

  const carouselItems = counties.map(c => ({
    title: c.region_name,
    subtitle: `${fmtNum(c.count_qualified)} solar-ready buildings`,
    href: `/counties/${nameToSlug(c.region_name)}`,
    metric: fmtUsd(c.untapped_annual_value_usd),
    metricLabel: 'untapped/yr',
  }))

  return (
    <GeoDetailPage
      title={fmtGea(gea)}
      breadcrumbs={[{ label: 'GEA Regions', href: '/gea-regions' }]}
      prev={prev}
      next={next}
      listHref="/gea-regions"
      listLabel="All GEA Regions"
      infoRows={infoRows}
      carouselTitle={`Counties in ${fmtGea(gea)}`}
      carouselItems={carouselItems}
      searchPlaceholder="Search counties…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: kpi.lat_avg, lng: kpi.lng_avg }}
      mapBounds={{ north: kpi.lat_max, south: kpi.lat_min, east: kpi.lng_max, west: kpi.lng_min }}
      mapMarkers={counties.slice(0, 15).map(c => ({ position: { lat: c.lat_avg, lng: c.lng_avg }, label: c.region_name }))}
      heatmapPoints={heatmapPoints}
      chatContext={gea}
    />
  )
}
