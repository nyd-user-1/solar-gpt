import { notFound } from 'next/navigation'
import { STATES, NY_COUNTIES } from '@/data/geo'
import { GeoDetailPage } from '@/components/GeoDetailPage'
import { Map } from 'lucide-react'

export function generateStaticParams() {
  return STATES.map(s => ({ slug: s.slug }))
}

export default async function StateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const state = STATES.find(s => s.slug === slug)
  if (!state) notFound()

  const sorted = STATES.slice().sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex(s => s.slug === state.slug)
  const prev = idx > 0 ? { label: sorted[idx - 1].name, href: `/states/${sorted[idx - 1].slug}` } : null
  const next = idx < sorted.length - 1 ? { label: sorted[idx + 1].name, href: `/states/${sorted[idx + 1].slug}` } : null

  // counties for this state (NY only has full data)
  const countySlugs = state.slug === 'new-york' ? NY_COUNTIES.map(c => c.slug) : state.counties
  const nyCounties = countySlugs
    .map(slug => NY_COUNTIES.find(c => c.slug === slug))
    .filter(Boolean) as typeof NY_COUNTIES

  const carouselItems = nyCounties.slice(0, 20).map(c => ({
    title: c.name,
    subtitle: `${c.avgInstalls} installs/yr · ${c.avgSystemKw} kW avg`,
    href: `/counties/${c.slug}`,
    metric: `☀ ${c.solarScore.toFixed(1)}`,
    metricLabel: 'solar score',
  }))

  const infoRows = [
    { label: 'Total Annual Installs', value: state.avgInstalls.toLocaleString(), highlight: true },
    { label: 'Solar Score', value: `${state.solarScore.toFixed(1)} / 5` },
    { label: 'Population', value: state.population.toLocaleString() },
    { label: 'Counties', value: state.counties.length.toString() },
    { label: 'Incentive Programs', value: 'NY-Sun, ITC (30%), NYSERDA' },
    { label: 'Net Metering', value: 'Full retail credit' },
    { label: 'Avg Payback Period', value: '7–9 years' },
    { label: 'Peak Sun Hours/Day', value: '4.0–5.2 hrs' },
  ]

  const prompts = [
    { title: 'NYSERDA incentives', subtitle: 'Learn about NY-Sun incentive program rebates and how to apply for residential solar', href: '/leads/new' },
    { title: 'Net metering policy', subtitle: 'Understand New York\'s net metering rules and how excess power credits work', href: '/leads/new' },
    { title: 'Solar tax credits', subtitle: 'Federal 30% ITC and NY 25% state credit — how to stack both incentives', href: '/leads/new' },
  ]

  return (
    <GeoDetailPage
      icon={<Map className="h-5 w-5" />}
      title={state.name}
      breadcrumbs={[{ label: 'States', href: '/states' }]}
      prev={prev}
      next={next}
      listHref="/states"
      listLabel="All States"
      infoRows={infoRows}
      carouselTitle="Counties"
      carouselItems={carouselItems}
      carousel2Title="Learn More"
      carousel2Items={prompts}
      searchPlaceholder="Search counties…"
      ctaHref="/leads/new"
      ctaLabel="Get Quote"
    />
  )
}
