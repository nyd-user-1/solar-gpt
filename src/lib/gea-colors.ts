export const GEA_COLORS: Record<string, string> = {
  'CAISO':               '#ef4444',
  'ERCOT':               '#84cc16',
  'FRCC':                '#06b6d4',
  'ISONE':               '#60a5fa',
  'MISO_Central':        '#10b981',
  'MISO_North':          '#a78bfa',
  'MISO_South':          '#c084fc',
  'NYISO':               '#3b82f6',
  'NorthernGrid_East':   '#f97316',
  'NorthernGrid_South':  '#d97706',
  'NorthernGrid_West':   '#34d399',
  'PJM_East':            '#facc15',
  'PJM_West':            '#fb923c',
  'SERTP':               '#f87171',
  'SPP_North':           '#0891b2',
  'SPP_South':           '#22d3ee',
  'WestConnect_North':   '#a855f7',
  'WestConnect_South':   '#7c3aed',
}

export function getGeaColor(gea: string): string {
  return GEA_COLORS[gea] ?? '#e5e7eb'
}
