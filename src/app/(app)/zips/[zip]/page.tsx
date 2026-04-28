export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { getZipByCode, getSiblingZips, getHeatmapPoints } from '@/lib/queries'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'

export default async function ZipDetailPage({ params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params
  const zipData = await getZipByCode(zip)
  if (!zipData) notFound()

  const [siblings, heatmapPoints] = await Promise.all([
    getSiblingZips(zipData.state_name, zipData.zip_code, 12),
    getHeatmapPoints(zipData.lat_min, zipData.lat_max, zipData.lng_min, zipData.lng_max),
  ])

  const infoRows = [
    { label: 'Potential / yr', value: fmtUsd(zipData.untapped_annual_value_usd), highlight: true },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(zipData.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${zipData.sunlight_grade}  (${zipData.sunlight_stars}/5 ☀)` },
    { label: 'Qualified Buildings', value: fmtNum(zipData.count_qualified) },
    { label: 'Existing Installs', value: fmtNum(zipData.existing_installs_count) },
    { label: 'Adoption Rate', value: zipData.adoption_rate_pct != null ? `${zipData.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(zipData.median_install_cost_usd) },
    { label: 'Median Payback', value: zipData.median_payback_years != null ? `${zipData.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(zipData.median_annual_savings_usd) },
    { label: 'GEA Region', value: zipData.cambium_gea ? fmtGea(zipData.cambium_gea) : '—' },
    { label: 'State', value: zipData.state_name },
  ]

  const carouselItems = siblings.map(z => ({
    title: z.zip_code,
    subtitle: `${z.state_name} · ${fmtNum(z.count_qualified)} buildings`,
    href: `/zips/${z.zip_code}`,
    metric: fmtUsd(z.untapped_annual_value_usd),
    metricLabel: 'potential/yr',
  }))

  return (
    <GeoDetailPage
      title={`ZIP ${zipData.zip_code}`}
      breadcrumbs={[{ label: 'ZIPs', href: '/zips' }]}
      listHref="/zips"
      listLabel="All ZIPs"
      infoRows={infoRows}
      carouselTitle={`Other ZIPs in ${zipData.state_name}`}
      carouselItems={carouselItems}
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapCenter={{ lat: zipData.lat_avg, lng: zipData.lng_avg }}
      mapBounds={{ north: zipData.lat_max, south: zipData.lat_min, east: zipData.lng_max, west: zipData.lng_min }}
      heatmapPoints={heatmapPoints}
      chatContext={`ZIP ${zipData.zip_code}, ${zipData.state_name}`}
    />
  )
}
