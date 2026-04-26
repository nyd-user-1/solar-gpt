import { notFound } from 'next/navigation'
import { GEA_REGIONS, NY_COUNTIES } from '@/data/geo'
import { GeoDetailPage } from '@/components/GeoDetailPage'

export function generateStaticParams() {
  return GEA_REGIONS.map(g => ({ slug: g.slug }))
}

export default async function GeaRegionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const region = GEA_REGIONS.find(g => g.slug === slug)
  if (!region) notFound()

  const sorted = GEA_REGIONS.slice().sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex(g => g.slug === region.slug)
  const prev = idx > 0 ? { label: sorted[idx - 1].name, href: `/gea-regions/${sorted[idx - 1].slug}` } : null
  const next = idx < sorted.length - 1 ? { label: sorted[idx + 1].name, href: `/gea-regions/${sorted[idx + 1].slug}` } : null

  const counties = region.counties
    .map(slug => NY_COUNTIES.find(c => c.slug === slug))
    .filter(Boolean) as typeof NY_COUNTIES

  const carouselItems = counties.map(c => ({
    title: `${c.name} County`,
    subtitle: `${c.avgInstalls} installs/yr · ${c.avgSystemKw} kW avg`,
    href: `/counties/${c.slug}`,
    metric: `☀ ${c.solarScore.toFixed(1)}`,
    metricLabel: 'solar score',
  }))

  const totalInstalls = counties.reduce((sum, c) => sum + c.avgInstalls, 0)
  const avgScore = counties.length > 0
    ? (counties.reduce((sum, c) => sum + c.solarScore, 0) / counties.length)
    : 0

  const prompts = [
    { title: 'Best installers in region', subtitle: `Find top-rated solar installation companies serving the ${region.name} area`, href: '/leads/new' },
    { title: 'NYSERDA programs', subtitle: `NY-Sun incentives available to homeowners in the ${region.name} region`, href: '/leads/new' },
    { title: 'Grid interconnection', subtitle: `Utility interconnection requirements and timelines for ${region.name}`, href: '/leads/new' },
  ]

  const infoRows = [
    { label: 'Total Installs/yr', value: totalInstalls.toLocaleString(), highlight: true },
    { label: 'Avg Solar Score', value: `${avgScore.toFixed(1)} / 5` },
    { label: 'Counties', value: region.counties.length.toString() },
    { label: 'Community Solar', value: 'Available — contact for details' },
    { label: 'Primary Utility', value: region.slug === 'long-island' ? 'PSEG Long Island' : region.slug === 'new-york-city' ? 'Con Edison' : 'National Grid / NYSEG' },
    { label: 'NYSERDA Region', value: region.name },
    { label: 'Net Metering Policy', value: 'Full retail credit (NY)' },
    { label: 'Avg Payback Period', value: '7–9 years' },
  ]

  return (
    <GeoDetailPage
      title={region.name}
      breadcrumbs={[{ label: 'GEA Regions', href: '/gea-regions' }]}
      prev={prev}
      next={next}
      listHref="/gea-regions"
      listLabel="All GEA Regions"
      infoRows={infoRows}
      carouselTitle={`Counties in ${region.name}`}
      carouselItems={carouselItems}
      carousel2Title="Learn More"
      carousel2Items={prompts}
      searchPlaceholder="Search counties…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
    />
  )
}
