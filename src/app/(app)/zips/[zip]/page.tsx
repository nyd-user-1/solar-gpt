import { notFound } from 'next/navigation'
import { SAMPLE_ZIPS, NY_COUNTIES, getCitiesByCounty } from '@/data/geo'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { Hash } from 'lucide-react'

export function generateStaticParams() {
  return SAMPLE_ZIPS.map(z => ({ zip: z.zip }))
}

export default async function ZipDetailPage({ params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params
  const zipData = SAMPLE_ZIPS.find(z => z.zip === zip)
  if (!zipData) notFound()

  const county = NY_COUNTIES.find(c => c.slug === zipData.countySlug)
  const siblings = SAMPLE_ZIPS.filter(z => z.countySlug === zipData.countySlug && z.zip !== zipData.zip)
  const cities = getCitiesByCounty(zipData.countySlug)

  const sorted = SAMPLE_ZIPS.slice().sort((a, b) => a.zip.localeCompare(b.zip))
  const idx = sorted.findIndex(z => z.zip === zipData.zip)
  const prev = idx > 0 ? { label: sorted[idx - 1].zip, href: `/zips/${sorted[idx - 1].zip}` } : null
  const next = idx < sorted.length - 1 ? { label: sorted[idx + 1].zip, href: `/zips/${sorted[idx + 1].zip}` } : null

  const carouselItems = siblings.map(z => ({
    title: z.zip,
    subtitle: `${z.city}, ${z.county} County`,
    href: `/zips/${z.zip}`,
    metric: `☀ ${z.solarScore.toFixed(1)}`,
    metricLabel: 'solar score',
  }))

  const cityItems = cities.slice(0, 8).map(c => ({
    title: c.name,
    subtitle: `${zipData.county} County · Solar score ${c.solarScore.toFixed(1)}`,
    href: `/cities/${c.slug}`,
  }))

  const infoRows = [
    { label: 'ZIP Code', value: zipData.zip },
    { label: 'City', value: zipData.city },
    { label: 'County', value: `${zipData.county} County` },
    { label: 'Solar Score', value: `${zipData.solarScore.toFixed(1)} / 5`, highlight: true },
    { label: 'Installs/yr', value: zipData.avgInstalls.toString() },
    { label: 'Avg System Size', value: `${county?.avgSystemKw ?? 9.0} kW` },
    { label: 'Avg Installed Cost', value: `$${county?.avgCostK ?? 25}k` },
    { label: 'Utility Provider', value: zipData.state === 'NY' ? 'National Grid / NYSEG' : 'Contact for info' },
  ]

  return (
    <GeoDetailPage
      icon={<Hash className="h-5 w-5" />}
      title={`ZIP ${zipData.zip}`}
      breadcrumbs={[
        { label: 'ZIPs', href: '/zips' },
        { label: zipData.county, href: `/counties/${zipData.countySlug}` },
      ]}
      prev={prev}
      next={next}
      listHref="/zips"
      listLabel="All ZIPs"
      infoRows={infoRows}
      carouselTitle={`Other ZIPs in ${zipData.county} County`}
      carouselItems={carouselItems}
      carousel2Title="Cities in this County"
      carousel2Items={cityItems}
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
    />
  )
}
