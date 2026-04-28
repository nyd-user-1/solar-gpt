export const GEA_COLORS: Record<string, string> = {
  'CAISO':              '#ef4444',
  'ERCOT':              '#84cc16',
  'FRCC':               '#06b6d4',
  'ISONE':              '#60a5fa',
  'MISO_Central':       '#10b981',
  'MISO_North':         '#9ca3af',
  'MISO_South':         '#c084fc',
  'NYISO':              '#3b82f6',
  'NorthernGrid_East':  '#f97316',
  'NorthernGrid_West':  '#78716c',
  'PJM_East':           '#facc15',
  'PJM_West':           '#fb923c',
  'SERTP':              '#f87171',
  'SPP_N':              '#0891b2',
  'SPP_S':              '#22d3ee',
  'WestConnect_N':      '#a855f7',
  'WestConnect_S':      '#7c3aed',
}

export function getGeaColor(gea: string): string {
  return GEA_COLORS[gea] ?? '#e5e7eb'
}
