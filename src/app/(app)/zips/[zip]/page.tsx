export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import {
  getZipByCode,
  getAdjacentZips,
  getCountyForZip,
  getZipsForCounty,
  getZipPlaceName,
  getHeatmapPoints,
} from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'

export default async function ZipDetailPage({ params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params
  const zipData = await getZipByCode(zip)
  if (!zipData) notFound()

  const [heatmapPoints, adjacent, countyData, placeName] = await Promise.all([
    getHeatmapPoints(zipData.lat_min, zipData.lat_max, zipData.lng_min, zipData.lng_max),
    getAdjacentZips(zipData.zip_code, zipData.state_name),
    getCountyForZip(zipData.state_name, zipData.lat_avg, zipData.lng_avg),
    getZipPlaceName(zipData.state_name, zipData.lat_min, zipData.lat_max, zipData.lng_min, zipData.lng_max),
  ])

  const countyZips = countyData
    ? (await getZipsForCounty(zipData.state_name, countyData.lat_min, countyData.lat_max, countyData.lng_min, countyData.lng_max))
        .filter(z => z.zip_code !== zipData.zip_code)
        .sort((a, b) => a.zip_code.localeCompare(b.zip_code))
    : []

  const title = placeName
    ? `${zipData.zip_code} (${placeName})`
    : zipData.zip_code

  const prev = adjacent.prev ? { label: adjacent.prev, href: `/zips/${adjacent.prev}` } : null
  const next = adjacent.next ? { label: adjacent.next, href: `/zips/${adjacent.next}` } : null

  const infoRows = [
    { label: 'Potential / yr', value: fmtUsd(zipData.untapped_annual_value_usd), highlight: true },
    { label: 'Qualified Buildings', value: fmtNum(zipData.count_qualified) },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(zipData.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${zipData.sunlight_grade}  (${zipData.sunlight_stars}/5 ☀)` },
    { label: 'Existing Installs', value: fmtNum(zipData.existing_installs_count) },
    { label: 'Adoption Rate', value: zipData.adoption_rate_pct != null ? `${zipData.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(zipData.median_install_cost_usd) },
    { label: 'Median Payback', value: zipData.median_payback_years != null ? `${zipData.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(zipData.median_annual_savings_usd) },
    { label: 'GEA Region', value: zipData.cambium_gea ? fmtGea(zipData.cambium_gea) : '—' },
    { label: 'State', value: zipData.state_name },
  ]

  const carouselTitle = countyData
    ? `${countyData.region_name} ZIP Codes`
    : `${zipData.state_name} ZIP Codes`

  const carouselItems = countyZips.map(z => ({
    title: z.zip_code,
    subtitle: z.region_name ?? '',
    subtitle2: `Qualified Bldgs. ${fmtNum(z.count_qualified)}`,
    href: `/zips/${z.zip_code}`,
    metric: fmtUsd(z.untapped_annual_value_usd),
  }))

  return (
    <GeoDetailPage
      title={title}
      breadcrumbs={[{ label: 'ZIP Codes', href: '/zips' }]}
      prev={prev}
      next={next}
      listHref="/zips"
      listLabel="All ZIPs"
      infoRows={infoRows}
      defaultInfoRows={2}
      carouselTitle={carouselTitle}
      carouselItems={carouselItems}
      carouselScrollable
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: zipData.lat_avg, lng: zipData.lng_avg }}
      mapBounds={{ north: zipData.lat_max, south: zipData.lat_min, east: zipData.lng_max, west: zipData.lng_min }}
      heatmapPoints={heatmapPoints}
      chatContext={`ZIP ${zipData.zip_code}, ${zipData.state_name}`}
    />
  )
}
