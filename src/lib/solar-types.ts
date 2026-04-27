export type SolarInsight = {
  center: { latitude: number; longitude: number }
  maxSunshineHoursPerYear: number | null
  maxAreaSqFt: number | null
  maxPanelsCount: number | null
  panelCapacityWatts: number | null
  recommendedKw: number | null
  yearlyEnergyKwh: number | null
  savings20yr: number | null
  paybackYears: number | null
  imageryQuality: string | null
}
