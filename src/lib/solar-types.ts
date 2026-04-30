export type SolarInsight = {
  center: { latitude: number; longitude: number }
  boundingBox: { sw: { latitude: number; longitude: number }; ne: { latitude: number; longitude: number } } | null
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
