import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=LOW&key=${key}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: err?.error?.message ?? `Solar API error ${res.status}` },
      { status: res.status }
    )
  }

  const data = await res.json()
  const sp = data.solarPotential
  if (!sp) return NextResponse.json({ error: 'No solar potential data' }, { status: 404 })

  const configs: Array<{ panelsCount: number; yearlyEnergyDcKwh: number }> = sp.solarPanelConfigs ?? []
  const lastConfig = configs[configs.length - 1]
  const finances: Array<{
    panelConfigIndex: number
    monthlyBill?: { units?: string }
    cashPurchaseDetails?: { paybackYears?: number; savings?: { savingsYear20?: { units?: string } } }
  }> = sp.financialAnalyses ?? []

  const relevantFinances = finances.filter(f => f.panelConfigIndex === configs.length - 1)
  const bestFinance = (relevantFinances.length > 0 ? relevantFinances : finances).sort((a, b) => {
    return Math.abs(parseFloat(a.monthlyBill?.units ?? '0') - 150) -
           Math.abs(parseFloat(b.monthlyBill?.units ?? '0') - 150)
  })[0]

  const maxAreaSqFt = sp.maxArrayAreaMeters2
    ? Math.round(sp.maxArrayAreaMeters2 * 10.764)
    : null

  const recommendedKw = lastConfig && sp.panelCapacityWatts
    ? Math.round((lastConfig.panelsCount * sp.panelCapacityWatts) / 100) / 10
    : null

  const savings20yr = bestFinance?.cashPurchaseDetails?.savings?.savingsYear20?.units
    ? Math.round(parseFloat(bestFinance.cashPurchaseDetails.savings.savingsYear20.units))
    : null

  const paybackYears = bestFinance?.cashPurchaseDetails?.paybackYears != null
    ? Math.round(bestFinance.cashPurchaseDetails.paybackYears * 10) / 10
    : null

  const yearlyEnergyKwh = lastConfig?.yearlyEnergyDcKwh
    ? Math.round(lastConfig.yearlyEnergyDcKwh)
    : null

  return NextResponse.json({
    center: data.center,
    boundingBox: data.boundingBox ?? null,
    maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear ?? null,
    maxAreaSqFt,
    maxPanelsCount: sp.maxArrayPanelsCount ?? null,
    panelCapacityWatts: sp.panelCapacityWatts ?? null,
    recommendedKw,
    yearlyEnergyKwh,
    savings20yr,
    paybackYears,
    imageryQuality: data.imageryQuality ?? null,
  })
}
