export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import {
  getCountyBySlug,
  getAdjacentCounties,
  getZipsForCounty,
  getCountyFips,
  nameToSlug,
} from '@/lib/queries'
import { STATE_ABBR } from '@/lib/state-abbr'
import { fmtUsd, fmtNum, fmtGea } from '@/lib/utils'

export default async function CountyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const county = await getCountyBySlug(slug)
  if (!county) notFound()

  const [adjacent, zipData, countyFips] = await Promise.all([
    getAdjacentCounties(county.id, county.state_name),
    getZipsForCounty(county.state_name, county.lat_min, county.lat_max, county.lng_min, county.lng_max),
    getCountyFips(county.state_name, county.region_name),
  ])

  const stateAbbr = STATE_ABBR[county.state_name] ?? ''

  const prev = adjacent.prev
    ? { label: adjacent.prev.region_name, href: `/counties/${nameToSlug(adjacent.prev.region_name)}` }
    : null
  const next = adjacent.next
    ? { label: adjacent.next.region_name, href: `/counties/${nameToSlug(adjacent.next.region_name)}` }
    : null

  const infoRows = [
    { label: 'Potential / yr', value: fmtUsd(county.untapped_annual_value_usd), highlight: true },
    { label: 'Qualified Buildings', value: fmtNum(county.count_qualified) },
    { label: 'Lifetime Value (25 yr)', value: fmtUsd(county.untapped_lifetime_value_usd) },
    { label: 'Sunlight Grade', value: `${county.sunlight_grade}  (${county.sunlight_stars}/5 ☀)` },
    { label: 'Existing Installs', value: fmtNum(county.existing_installs_count) },
    { label: 'Adoption Rate', value: county.adoption_rate_pct != null ? `${county.adoption_rate_pct.toFixed(1)}%` : '—' },
    { label: 'Median Install Cost', value: fmtUsd(county.median_install_cost_usd) },
    { label: 'Median Payback', value: county.median_payback_years != null ? `${county.median_payback_years.toFixed(1)} years` : '—' },
    { label: 'Median Savings / yr', value: fmtUsd(county.median_annual_savings_usd) },
    { label: 'GEA Region', value: county.cambium_gea ? fmtGea(county.cambium_gea) : '—' },
  ]

  const carouselItems = [...zipData]
    .sort((a, b) => a.zip_code.localeCompare(b.zip_code))
    .map(z => ({
      title: z.zip_code,
      subtitle: z.region_name
        ? `${z.region_name} · ${fmtNum(z.count_qualified)} qualified buildings`
        : `${fmtNum(z.count_qualified)} qualified buildings`,
      href: `/zips/${z.zip_code}`,
      metric: fmtUsd(z.untapped_annual_value_usd),
    }))

  return (
    <GeoDetailPage
      title={county.region_name}
      breadcrumbs={[
        { label: 'Counties', href: '/counties' },
        ...(county.cambium_gea ? [{ label: fmtGea(county.cambium_gea), href: `/gea-regions/${county.cambium_gea.toLowerCase().replace(/_/g, '-')}` }] : []),
      ]}
      prev={prev}
      next={next}
      listHref="/counties"
      listLabel="All Counties"
      infoRows={infoRows}
      carouselTitle="ZIP Codes"
      carouselItems={carouselItems}
      carouselScrollable
      defaultInfoRows={2}
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
      mapBounds={{ north: county.lat_max, south: county.lat_min, east: county.lng_max, west: county.lng_min }}
      countyZipData={countyFips && stateAbbr ? {
        zips: zipData,
        countyFips,
        stateAbbr,
        stateName: county.state_name,
      } : undefined}
      chatContext={`${county.region_name}, ${county.state_name}`}
    />
  )
}
