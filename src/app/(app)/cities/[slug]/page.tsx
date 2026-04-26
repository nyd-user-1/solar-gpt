import { notFound } from 'next/navigation'
import { NY_COUNTIES, getCitiesByCounty } from '@/data/geo'
import { GeoDetailPage } from '@/components/GeoDetailPage'

// Build static city list from all counties
function getAllCities() {
  return NY_COUNTIES.flatMap(county => getCitiesByCounty(county.slug))
}

export function generateStaticParams() {
  return getAllCities().map(c => ({ slug: c.slug }))
}

export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allCities = getAllCities()
  const city = allCities.find(c => c.slug === slug)
  if (!city) notFound()

  const county = NY_COUNTIES.find(c => c.slug === city.countySlug)!
  const siblingsInCounty = getCitiesByCounty(county.slug).filter(c => c.slug !== city.slug)
  const sorted = allCities.slice().sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex(c => c.slug === city.slug)
  const prev = idx > 0 ? { label: sorted[idx - 1].name, href: `/cities/${sorted[idx - 1].slug}` } : null
  const next = idx < sorted.length - 1 ? { label: sorted[idx + 1].name, href: `/cities/${sorted[idx + 1].slug}` } : null

  const carouselItems = siblingsInCounty.map(c => ({
    title: c.name,
    subtitle: `${city.county} County · Solar score ${c.solarScore.toFixed(1)}`,
    href: `/cities/${c.slug}`,
    metric: `☀ ${c.solarScore.toFixed(1)}`,
    metricLabel: 'solar score',
  }))

  const zipItems = city.zips.map(zip => ({
    title: zip,
    subtitle: `${city.name}, ${city.county} County`,
    href: `/zips/${zip}`,
    metric: `☀ ${city.solarScore.toFixed(1)}`,
    metricLabel: 'area avg',
  }))

  const infoRows = [
    { label: 'Solar Score', value: `${city.solarScore.toFixed(1)} / 5`, highlight: true },
    { label: 'County', value: `${city.county} County` },
    { label: 'Population', value: city.population.toLocaleString() },
    { label: 'ZIP Codes', value: city.zips.join(', ') },
    { label: 'County Installs/yr', value: county.avgInstalls.toString() },
    { label: 'Avg System Size', value: `${county.avgSystemKw} kW` },
    { label: 'Avg Installed Cost', value: `$${county.avgCostK}k` },
    { label: 'Utility Provider', value: county.gea === 'long-island' ? 'PSEG Long Island' : county.gea === 'new-york-city' ? 'Con Edison' : 'National Grid / NYSEG' },
  ]

  return (
    <GeoDetailPage
      title={city.name}
      breadcrumbs={[
        { label: 'Cities', href: '/cities' },
        { label: city.county, href: `/counties/${city.countySlug}` },
      ]}
      prev={prev}
      next={next}
      listHref="/cities"
      listLabel="All Cities"
      infoRows={infoRows}
      carouselTitle={`Other Cities in ${city.county} County`}
      carouselItems={carouselItems}
      carousel2Title="ZIP Codes"
      carousel2Items={zipItems}
      searchPlaceholder="Search nearby cities…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
    />
  )
}
