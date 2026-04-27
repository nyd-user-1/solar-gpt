import { NextRequest, NextResponse } from 'next/server'
import { getDashboardConfig, type DashboardTab } from '@/lib/dashboard-config'
import {
  getDashboardStateRows,
  getDashboardGeaRows,
  getDashboardGradeRows,
  getDashboardCountyRows,
  getDashboardCityRows,
  getDashboardCountyChildRows,
  getDashboardCityChildRows,
  getDashboardStateInGeaRows,
  getDashboardStateInGradeRows,
  type DashboardTableRow,
} from '@/lib/queries'

export const dynamic = 'force-dynamic'

async function fetchMainRows(tab: DashboardTab): Promise<DashboardTableRow[]> {
  switch (tab.id) {
    case 'state':
      return getDashboardStateRows(tab.metric)
    case 'gea':
      return getDashboardGeaRows(tab.metric)
    case 'grade':
      return getDashboardGradeRows(tab.metric, tab.agg)
    case 'county':
      return getDashboardCountyRows(20)
    case 'city':
      return getDashboardCityRows(20)
    default:
      return []
  }
}

async function fetchChildRows(
  tab: DashboardTab,
  parentId: string,
): Promise<DashboardTableRow[]> {
  const childTab = tab.childTab
  if (!childTab) return []

  if (tab.id === 'state' && childTab === 'county') {
    return getDashboardCountyChildRows(parentId, tab.metric)
  }
  if (tab.id === 'state' && childTab === 'city') {
    return getDashboardCityChildRows(parentId)
  }
  if (tab.id === 'gea' && childTab === 'state') {
    return getDashboardStateInGeaRows(parentId, tab.metric)
  }
  if (tab.id === 'grade' && childTab === 'state') {
    return getDashboardStateInGradeRows(parentId, tab.metric)
  }
  return []
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const tabId = req.nextUrl.searchParams.get('tab') ?? 'state'
  const parentId = req.nextUrl.searchParams.get('parentId')

  const config = getDashboardConfig(slug)
  if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tab = config.tabs.find(t => t.id === tabId)
  if (!tab) return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })

  try {
    if (parentId) {
      const rows = await fetchChildRows(tab, parentId)
      return NextResponse.json({ rows })
    }

    const rows = await fetchMainRows(tab)
    const total = rows.reduce((s, r) => s + r.value, 0)
    const chartData = rows.slice(0, 25).map(r => ({ name: r.name, value: r.value }))

    return NextResponse.json({ rows, total, chartData })
  } catch (err) {
    console.error(`Dashboard API error [${slug}/${tabId}]:`, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
