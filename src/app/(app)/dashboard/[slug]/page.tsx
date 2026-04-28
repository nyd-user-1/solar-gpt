export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getDashboardConfig } from '@/lib/dashboard-config'
import {
  getDashboardStateRows,
  getDashboardGeaRows,
  getDashboardGradeRows,
  getDashboardCountyRows,
  getDashboardCityRows,
  getDashboardHeaderTotal,
} from '@/lib/queries'
import { DashboardDetailClient } from './DashboardDetailClient'

export default async function DashboardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const config = getDashboardConfig(slug)
  if (!config) notFound()

  const firstTab = config.tabs[0]

  const [initialRows, total] = await Promise.all([
    (async () => {
      try {
        switch (firstTab.id) {
          case 'state':  return await getDashboardStateRows(firstTab.metric)
          case 'gea':    return await getDashboardGeaRows(firstTab.metric)
          case 'grade':  return await getDashboardGradeRows(firstTab.metric, firstTab.agg)
          case 'county': return await getDashboardCountyRows(20)
          case 'city':   return await getDashboardCityRows(20)
          default:       return []
        }
      } catch { return [] }
    })(),
    getDashboardHeaderTotal(slug).catch(() => 0),
  ])

  const chartData = initialRows.map(r => ({ name: r.name, value: r.value }))

  return (
    <DashboardDetailClient
      slug={slug}
      config={config}
      initialRows={initialRows}
      initialTotal={total}
      initialChartData={chartData}
    />
  )
}
