import { notFound } from 'next/navigation'
import { NY_COUNTIES, GEA_REGIONS, getCitiesByCounty } from '@/data/geo'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { MapPin } from 'lucide-react'

export function generateStaticParams() {
  return NY_COUNTIES.map(c => ({ slug: c.slug }))
}

export default async function CountyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const county = NY_COUNTIES.find(c => c.slug === slug)
  if (!county) notFound()

  const sorted = NY_COUNTIES.slice().sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex(c => c.slug === county.slug)
  const prev = idx > 0 ? { label: sorted[idx - 1].name, href: `/counties/${sorted[idx - 1].slug}` } : null
  const next = idx < sorted.length - 1 ? { label: sorted[idx + 1].name, href: `/counties/${sorted[idx + 1].slug}` } : null

  const gea = GEA_REGIONS.find(g => g.slug === county.gea)
  const cities = getCitiesByCounty(county.slug)

  const carouselItems = cities.map(c => ({
    title: c.name,
    subtitle: `Pop. ${c.population.toLocaleString()} · Solar score ${c.solarScore.toFixed(1)}`,
    href: `/cities/${c.slug}`,
    metric: `☀ ${c.solarScore.toFixed(1)}`,
    metricLabel: 'solar score',
  }))

  // ZIP codes for second carousel
  const zips = cities.flatMap(c => c.zips.slice(0, 2)).slice(0, 10)
  const zipItems = zips.map(zip => ({
    title: zip,
    subtitle: `${county.name} County · ${county.avgInstalls} installs/yr avg`,
    href: `/zips/${zip}`,
    metric: `☀ ${county.solarScore.toFixed(1)}`,
    metricLabel: 'county avg',
  }))

  const infoRows = [
    { label: 'Avg Installs/yr', value: county.avgInstalls.toLocaleString(), highlight: true },
    { label: 'Solar Score', value: `${county.solarScore.toFixed(1)} / 5` },
    { label: 'Avg System Size', value: `${county.avgSystemKw} kW` },
    { label: 'Avg Installed Cost', value: `$${county.avgCostK}k` },
    { label: 'GEA Region', value: gea?.name ?? county.gea },
    { label: 'Population', value: county.population.toLocaleString() },
    { label: 'Typical Monthly Savings', value: `$${Math.round(county.avgCostK * 100 / 10)}/mo` },
    { label: 'Estimated Payback', value: `${Math.round(county.avgCostK / (county.avgSystemKw * 0.18))} years` },
  ]

  return (
    <GeoDetailPage
      icon={<MapPin className="h-5 w-5" />}
      title={`${county.name} County`}
      breadcrumbs={[
        { label: 'Counties', href: '/counties' },
        ...(gea ? [{ label: gea.name, href: `/gea-regions/${gea.slug}` }] : []),
      ]}
      prev={prev}
      next={next}
      listHref="/counties"
      listLabel="All Counties"
      infoRows={infoRows}
      carouselTitle={`Cities & Towns in ${county.name} County`}
      carouselItems={carouselItems}
      carousel2Title="ZIP Codes"
      carousel2Items={zipItems}
      searchPlaceholder="Search cities…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
    />
  )
}
