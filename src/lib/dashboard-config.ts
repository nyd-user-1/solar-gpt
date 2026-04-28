export type DashboardTabId = 'state' | 'gea' | 'grade' | 'county' | 'city'
export type MetricFormat = 'usd' | 'count' | 'percent' | 'co2_tons' | 'usd_per_mwh' | 'co2_per_mwh' | 'kwh'
export type MetricAgg = 'sum' | 'avg'

export type DashboardTab = {
  id: DashboardTabId
  label: string
  metric: string
  format: MetricFormat
  agg: MetricAgg
  hasChildren: boolean
  childTab?: DashboardTabId
}

export type DashboardConfig = {
  slug: string
  title: string
  desc: string
  color: string
  chartType: 'area' | 'bar' | 'pie'
  previewData: { x: number; y: number }[]
  tabs: DashboardTab[]
  headerContext: string
}

export const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    slug: 'untapped-value',
    title: 'Untapped Value',
    desc: 'Annual untapped solar value by state',
    color: 'hsl(160 60% 45%)',
    chartType: 'area',
    previewData: [{x:0,y:8},{x:1,y:12},{x:2,y:22},{x:3,y:28},{x:4,y:18},{x:5,y:24},{x:6,y:30},{x:7,y:22},{x:8,y:26},{x:9,y:20}],
    tabs: [
      { id: 'state', label: 'State', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'county' },
      { id: 'gea', label: 'GEA', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'state' },
      { id: 'grade', label: 'Grade', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: false },
    ],
    headerContext: 'annual opportunity',
  },
  {
    slug: 'adoption-rate',
    title: 'Adoption Rate',
    desc: 'Solar adoption % by state',
    color: 'hsl(217 91% 60%)',
    chartType: 'bar',
    previewData: [{x:0,y:80},{x:1,y:60},{x:2,y:50},{x:3,y:40},{x:4,y:30},{x:5,y:25},{x:6,y:20},{x:7,y:15},{x:8,y:10},{x:9,y:8}],
    tabs: [
      { id: 'state', label: 'State', metric: 'adoption_rate_pct', format: 'percent', agg: 'avg', hasChildren: true, childTab: 'county' },
      { id: 'gea', label: 'GEA', metric: 'adoption_rate_pct', format: 'percent', agg: 'avg', hasChildren: true, childTab: 'state' },
      { id: 'grade', label: 'Grade', metric: 'adoption_rate_pct', format: 'percent', agg: 'avg', hasChildren: false },
    ],
    headerContext: 'of eligible buildings',
  },
  {
    slug: 'sunlight-grade',
    title: 'Sunlight Grade',
    desc: 'State distribution by grade A+ → F',
    color: 'hsl(32 95% 50%)',
    chartType: 'bar',
    previewData: [{x:0,y:6},{x:1,y:8},{x:2,y:15},{x:3,y:25},{x:4,y:10},{x:5,y:4},{x:6,y:2}],
    tabs: [
      { id: 'grade', label: 'Grade', metric: 'count_qualified', format: 'count', agg: 'sum', hasChildren: true, childTab: 'state' },
      { id: 'state', label: 'State', metric: 'count_qualified', format: 'count', agg: 'sum', hasChildren: true, childTab: 'county' },
    ],
    headerContext: 'states analyzed',
  },
  {
    slug: 'existing-installs',
    title: 'Existing Installs',
    desc: 'Solar systems already installed by state',
    color: 'hsl(32 95% 50%)',
    chartType: 'bar',
    previewData: [{x:0,y:65},{x:1,y:50},{x:2,y:40},{x:3,y:30},{x:4,y:22},{x:5,y:18},{x:6,y:12},{x:7,y:9},{x:8,y:6},{x:9,y:4}],
    tabs: [
      { id: 'state', label: 'State', metric: 'existing_installs_count', format: 'count', agg: 'sum', hasChildren: true, childTab: 'county' },
      { id: 'gea', label: 'GEA', metric: 'existing_installs_count', format: 'count', agg: 'sum', hasChildren: true, childTab: 'state' },
    ],
    headerContext: 'systems installed',
  },
  {
    slug: 'top-counties',
    title: 'Top Counties',
    desc: 'Top 20 counties by untapped value',
    color: 'hsl(280 67% 55%)',
    chartType: 'bar',
    previewData: [{x:0,y:80},{x:1,y:65},{x:2,y:55},{x:3,y:45},{x:4,y:38},{x:5,y:30},{x:6,y:25},{x:7,y:20},{x:8,y:15},{x:9,y:10}],
    tabs: [
      { id: 'county', label: 'County', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: false },
      { id: 'state', label: 'State', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'county' },
    ],
    headerContext: 'top 20 county opportunity',
  },
  {
    slug: 'top-cities',
    title: 'Top Cities',
    desc: 'Top 20 cities by untapped value',
    color: 'hsl(340 82% 52%)',
    chartType: 'bar',
    previewData: [{x:0,y:80},{x:1,y:65},{x:2,y:55},{x:3,y:45},{x:4,y:38},{x:5,y:30},{x:6,y:25},{x:7,y:20},{x:8,y:15},{x:9,y:10}],
    tabs: [
      { id: 'city', label: 'City', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: false },
      { id: 'state', label: 'State', metric: 'untapped_annual_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'city' },
    ],
    headerContext: 'top 20 city opportunity',
  },
  {
    slug: 'marginal-cost',
    title: 'Marginal Cost',
    desc: '$/MWh by GEA region',
    color: 'hsl(217 91% 60%)',
    chartType: 'bar',
    previewData: [{x:0,y:40},{x:1,y:70},{x:2,y:55},{x:3,y:30},{x:4,y:90},{x:5,y:45},{x:6,y:60},{x:7,y:35},{x:8,y:50},{x:9,y:25}],
    tabs: [
      { id: 'gea', label: 'GEA', metric: 'cost_per_mwh', format: 'usd_per_mwh', agg: 'avg', hasChildren: false },
    ],
    headerContext: '$/MWh marginal cost',
  },
  {
    slug: 'emissions-intensity',
    title: 'Emissions Intensity',
    desc: 'LRMER kg CO₂/MWh by GEA',
    color: 'hsl(0 84% 60%)',
    chartType: 'bar',
    previewData: [{x:0,y:60},{x:1,y:45},{x:2,y:35},{x:3,y:55},{x:4,y:70},{x:5,y:40},{x:6,y:50},{x:7,y:30},{x:8,y:65},{x:9,y:20}],
    tabs: [
      { id: 'gea', label: 'GEA', metric: 'lrmer_co2_per_mwh', format: 'co2_per_mwh', agg: 'avg', hasChildren: false },
    ],
    headerContext: 'kg CO₂/MWh avg',
  },
  {
    slug: 'carbon-offset',
    title: 'Carbon Offset',
    desc: 'Annual CO₂ offset potential by state',
    color: 'hsl(160 60% 45%)',
    chartType: 'area',
    previewData: [{x:0,y:8},{x:1,y:10},{x:2,y:14},{x:3,y:18},{x:4,y:16},{x:5,y:20},{x:6,y:22},{x:7,y:19},{x:8,y:24},{x:9,y:28}],
    tabs: [
      { id: 'state', label: 'State', metric: 'carbon_offset_metric_tons', format: 'co2_tons', agg: 'sum', hasChildren: true, childTab: 'county' },
      { id: 'grade', label: 'Grade', metric: 'carbon_offset_metric_tons', format: 'co2_tons', agg: 'sum', hasChildren: false },
    ],
    headerContext: 'metric tons CO₂ annually',
  },
  {
    slug: 'qualified-buildings',
    title: 'Qualified Buildings',
    desc: 'Solar-ready building count by state',
    color: 'hsl(32 95% 50%)',
    chartType: 'bar',
    previewData: [{x:0,y:65},{x:1,y:50},{x:2,y:40},{x:3,y:30},{x:4,y:22},{x:5,y:18},{x:6,y:12},{x:7,y:9},{x:8,y:6},{x:9,y:4}],
    tabs: [
      { id: 'state', label: 'State', metric: 'count_qualified', format: 'count', agg: 'sum', hasChildren: true, childTab: 'county' },
      { id: 'gea', label: 'GEA', metric: 'count_qualified', format: 'count', agg: 'sum', hasChildren: true, childTab: 'state' },
      { id: 'grade', label: 'Grade', metric: 'count_qualified', format: 'count', agg: 'sum', hasChildren: false },
    ],
    headerContext: 'solar-ready rooftops',
  },
  {
    slug: 'lifetime-value',
    title: 'Lifetime Value',
    desc: '25-year projected value by state',
    color: 'hsl(280 67% 55%)',
    chartType: 'area',
    previewData: [{x:0,y:8},{x:1,y:12},{x:2,y:22},{x:3,y:28},{x:4,y:18},{x:5,y:24},{x:6,y:30},{x:7,y:22},{x:8,y:26},{x:9,y:20}],
    tabs: [
      { id: 'state', label: 'State', metric: 'untapped_lifetime_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'county' },
      { id: 'gea', label: 'GEA', metric: 'untapped_lifetime_value_usd', format: 'usd', agg: 'sum', hasChildren: true, childTab: 'state' },
      { id: 'grade', label: 'Grade', metric: 'untapped_lifetime_value_usd', format: 'usd', agg: 'sum', hasChildren: false },
    ],
    headerContext: '25-year opportunity',
  },
  {
    slug: 'mwh-by-region',
    title: 'MWh by Region',
    desc: 'Annual solar energy potential by GEA region',
    color: 'hsl(191 91% 37%)',
    chartType: 'pie',
    previewData: [{x:0,y:35},{x:1,y:28},{x:2,y:20},{x:3,y:12},{x:4,y:5}],
    tabs: [
      { id: 'gea', label: 'Region', metric: 'yearly_sunlight_kwh_total', format: 'kwh', agg: 'sum', hasChildren: true, childTab: 'state' },
      { id: 'state', label: 'State', metric: 'yearly_sunlight_kwh_total', format: 'kwh', agg: 'sum', hasChildren: true, childTab: 'county' },
    ],
    headerContext: 'kWh annual solar potential',
  },
]

export function getDashboardConfig(slug: string): DashboardConfig | null {
  return DASHBOARD_CONFIGS.find(c => c.slug === slug) ?? null
}
