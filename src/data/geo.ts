export interface GeoCounty {
  name: string
  slug: string
  gea: string
  population: number
  solarScore: number
  avgInstalls: number
  avgSystemKw: number
  avgCostK: number
}

export interface GeoCity {
  name: string
  slug: string
  county: string
  countySlug: string
  zips: string[]
  population: number
  solarScore: number
}

export interface GeoState {
  name: string
  slug: string
  counties: string[]
  population: number
  solarScore: number
  avgInstalls: number
}

export interface GeaRegion {
  name: string
  slug: string
  counties: string[]
  description: string
  totalInstalls: number
  avgSolarScore: number
}

// ── GEA Regions (NY Regional Economic Development Councils) ──────────────────

export const GEA_REGIONS: GeaRegion[] = [
  {
    name: 'Capital Region',
    slug: 'capital-region',
    counties: ['albany', 'columbia', 'greene', 'rensselaer', 'saratoga', 'schenectady', 'warren', 'washington'],
    description: 'Includes the Albany metro area and surrounding communities. Strong net metering incentives and municipal solar programs.',
    totalInstalls: 18420,
    avgSolarScore: 4.1,
  },
  {
    name: 'Central New York',
    slug: 'central-new-york',
    counties: ['cayuga', 'cortland', 'madison', 'onondaga', 'oswego'],
    description: 'Syracuse metro region with growing commercial solar market and community solar subscriptions.',
    totalInstalls: 11800,
    avgSolarScore: 3.8,
  },
  {
    name: 'Finger Lakes',
    slug: 'finger-lakes',
    counties: ['genesee', 'livingston', 'monroe', 'ontario', 'orleans', 'seneca', 'wayne', 'wyoming', 'yates'],
    description: 'Rochester region with excellent rooftop solar conditions and strong utility incentive programs.',
    totalInstalls: 21340,
    avgSolarScore: 4.3,
  },
  {
    name: 'Hudson Valley',
    slug: 'hudson-valley',
    counties: ['dutchess', 'orange', 'putnam', 'rockland', 'sullivan', 'ulster', 'westchester'],
    description: 'Dense suburban market with high electricity rates driving strong solar ROI. Top NY region for residential installs.',
    totalInstalls: 32100,
    avgSolarScore: 4.6,
  },
  {
    name: 'Long Island',
    slug: 'long-island',
    counties: ['nassau', 'suffolk'],
    description: 'PSEG Long Island territory. Highest residential solar adoption rate in NY driven by elevated utility rates.',
    totalInstalls: 54200,
    avgSolarScore: 4.8,
  },
  {
    name: 'Mohawk Valley',
    slug: 'mohawk-valley',
    counties: ['fulton', 'herkimer', 'montgomery', 'oneida', 'otsego', 'schoharie'],
    description: 'Rural and small-town market with emerging solar adoption and strong state incentive uptake.',
    totalInstalls: 7600,
    avgSolarScore: 3.6,
  },
  {
    name: 'New York City',
    slug: 'new-york-city',
    counties: ['bronx', 'kings', 'new-york', 'queens', 'richmond'],
    description: 'NYC boroughs with Con Edison territory. Growing rooftop and community solar market, especially in outer boroughs.',
    totalInstalls: 28700,
    avgSolarScore: 4.0,
  },
  {
    name: 'North Country',
    slug: 'north-country',
    counties: ['clinton', 'essex', 'franklin', 'hamilton', 'jefferson', 'lewis', 'st-lawrence'],
    description: 'Rural northern NY with long sunny summers. Lower adoption but rapidly growing with NYSERDA Rural Solar program.',
    totalInstalls: 5400,
    avgSolarScore: 3.4,
  },
  {
    name: 'Southern Tier',
    slug: 'southern-tier',
    counties: ['allegany', 'broome', 'cattaraugus', 'chemung', 'chenango', 'delaware', 'schuyler', 'steuben', 'tioga', 'tompkins'],
    description: 'Rural and college-town market (Binghamton, Ithaca). Strong university-driven solar initiatives.',
    totalInstalls: 9800,
    avgSolarScore: 3.7,
  },
  {
    name: 'Western New York',
    slug: 'western-new-york',
    counties: ['chautauqua', 'erie', 'niagara'],
    description: 'Buffalo metro area with National Grid territory. Industrial solar and growing residential market.',
    totalInstalls: 16300,
    avgSolarScore: 3.9,
  },
]

// ── NY Counties (62) ──────────────────────────────────────────────────────────

export const NY_COUNTIES: GeoCounty[] = [
  { name: 'Albany',       slug: 'albany',       gea: 'capital-region',   population: 314848,  solarScore: 4.2, avgInstalls: 312, avgSystemKw: 9.2,  avgCostK: 26.1 },
  { name: 'Allegany',     slug: 'allegany',     gea: 'southern-tier',    population: 46456,   solarScore: 3.5, avgInstalls: 48,  avgSystemKw: 8.0,  avgCostK: 21.8 },
  { name: 'Bronx',        slug: 'bronx',        gea: 'new-york-city',    population: 1472654, solarScore: 3.8, avgInstalls: 220, avgSystemKw: 6.4,  avgCostK: 28.4 },
  { name: 'Broome',       slug: 'broome',       gea: 'southern-tier',    population: 190488,  solarScore: 3.7, avgInstalls: 185, avgSystemKw: 8.5,  avgCostK: 23.6 },
  { name: 'Cattaraugus',  slug: 'cattaraugus',  gea: 'southern-tier',    population: 76117,   solarScore: 3.4, avgInstalls: 72,  avgSystemKw: 8.2,  avgCostK: 22.0 },
  { name: 'Cayuga',       slug: 'cayuga',       gea: 'central-new-york', population: 76576,   solarScore: 3.8, avgInstalls: 88,  avgSystemKw: 8.8,  avgCostK: 23.9 },
  { name: 'Chautauqua',   slug: 'chautauqua',   gea: 'western-new-york', population: 126903,  solarScore: 3.7, avgInstalls: 132, avgSystemKw: 8.3,  avgCostK: 22.5 },
  { name: 'Chemung',      slug: 'chemung',      gea: 'southern-tier',    population: 83456,   solarScore: 3.8, avgInstalls: 96,  avgSystemKw: 8.6,  avgCostK: 23.2 },
  { name: 'Chenango',     slug: 'chenango',     gea: 'southern-tier',    population: 47207,   solarScore: 3.5, avgInstalls: 52,  avgSystemKw: 8.1,  avgCostK: 22.3 },
  { name: 'Clinton',      slug: 'clinton',      gea: 'north-country',    population: 80485,   solarScore: 3.3, avgInstalls: 65,  avgSystemKw: 8.0,  avgCostK: 22.8 },
  { name: 'Columbia',     slug: 'columbia',     gea: 'capital-region',   population: 60919,   solarScore: 4.3, avgInstalls: 148, avgSystemKw: 9.4,  avgCostK: 27.2 },
  { name: 'Cortland',     slug: 'cortland',     gea: 'central-new-york', population: 47304,   solarScore: 3.7, avgInstalls: 58,  avgSystemKw: 8.4,  avgCostK: 23.0 },
  { name: 'Delaware',     slug: 'delaware',     gea: 'southern-tier',    population: 44135,   solarScore: 3.6, avgInstalls: 44,  avgSystemKw: 8.3,  avgCostK: 22.6 },
  { name: 'Dutchess',     slug: 'dutchess',     gea: 'hudson-valley',    population: 295911,  solarScore: 4.5, avgInstalls: 402, avgSystemKw: 9.8,  avgCostK: 28.6 },
  { name: 'Erie',         slug: 'erie',         gea: 'western-new-york', population: 951047,  solarScore: 4.0, avgInstalls: 892, avgSystemKw: 9.0,  avgCostK: 24.8 },
  { name: 'Essex',        slug: 'essex',        gea: 'north-country',    population: 36885,   solarScore: 3.2, avgInstalls: 38,  avgSystemKw: 7.8,  avgCostK: 22.1 },
  { name: 'Franklin',     slug: 'franklin',     gea: 'north-country',    population: 50022,   solarScore: 3.1, avgInstalls: 42,  avgSystemKw: 7.9,  avgCostK: 22.4 },
  { name: 'Fulton',       slug: 'fulton',       gea: 'mohawk-valley',    population: 53383,   solarScore: 3.5, avgInstalls: 55,  avgSystemKw: 8.2,  avgCostK: 22.9 },
  { name: 'Genesee',      slug: 'genesee',      gea: 'finger-lakes',     population: 57280,   solarScore: 4.0, avgInstalls: 76,  avgSystemKw: 8.8,  avgCostK: 24.2 },
  { name: 'Greene',       slug: 'greene',       gea: 'capital-region',   population: 47988,   solarScore: 4.1, avgInstalls: 82,  avgSystemKw: 9.0,  avgCostK: 25.8 },
  { name: 'Hamilton',     slug: 'hamilton',     gea: 'north-country',    population: 4416,    solarScore: 3.0, avgInstalls: 8,   avgSystemKw: 7.5,  avgCostK: 21.0 },
  { name: 'Herkimer',     slug: 'herkimer',     gea: 'mohawk-valley',    population: 61319,   solarScore: 3.5, avgInstalls: 62,  avgSystemKw: 8.1,  avgCostK: 22.5 },
  { name: 'Jefferson',    slug: 'jefferson',    gea: 'north-country',    population: 111238,  solarScore: 3.4, avgInstalls: 95,  avgSystemKw: 8.2,  avgCostK: 23.1 },
  { name: 'Kings',        slug: 'kings',        gea: 'new-york-city',    population: 2736074, solarScore: 4.0, avgInstalls: 610, avgSystemKw: 6.2,  avgCostK: 29.0 },
  { name: 'Lewis',        slug: 'lewis',        gea: 'north-country',    population: 26296,   solarScore: 3.2, avgInstalls: 28,  avgSystemKw: 7.8,  avgCostK: 21.8 },
  { name: 'Livingston',   slug: 'livingston',   gea: 'finger-lakes',     population: 63907,   solarScore: 4.1, avgInstalls: 98,  avgSystemKw: 9.0,  avgCostK: 24.6 },
  { name: 'Madison',      slug: 'madison',      gea: 'central-new-york', population: 70941,   solarScore: 3.8, avgInstalls: 85,  avgSystemKw: 8.7,  avgCostK: 23.8 },
  { name: 'Monroe',       slug: 'monroe',       gea: 'finger-lakes',     population: 744248,  solarScore: 4.3, avgInstalls: 786, avgSystemKw: 9.2,  avgCostK: 25.4 },
  { name: 'Montgomery',   slug: 'montgomery',   gea: 'mohawk-valley',    population: 49221,   solarScore: 3.5, avgInstalls: 54,  avgSystemKw: 8.3,  avgCostK: 22.7 },
  { name: 'Nassau',       slug: 'nassau',       gea: 'long-island',      population: 1395774, solarScore: 4.9, avgInstalls: 3240, avgSystemKw: 10.2, avgCostK: 31.4 },
  { name: 'New York',     slug: 'new-york',     gea: 'new-york-city',    population: 1694251, solarScore: 3.6, avgInstalls: 180, avgSystemKw: 5.8,  avgCostK: 30.2 },
  { name: 'Niagara',      slug: 'niagara',      gea: 'western-new-york', population: 209699,  solarScore: 3.8, avgInstalls: 226, avgSystemKw: 8.9,  avgCostK: 24.0 },
  { name: 'Oneida',       slug: 'oneida',       gea: 'mohawk-valley',    population: 228671,  solarScore: 3.7, avgInstalls: 215, avgSystemKw: 8.6,  avgCostK: 23.4 },
  { name: 'Onondaga',     slug: 'onondaga',     gea: 'central-new-york', population: 476516,  solarScore: 3.9, avgInstalls: 462, avgSystemKw: 8.9,  avgCostK: 24.5 },
  { name: 'Ontario',      slug: 'ontario',      gea: 'finger-lakes',     population: 109777,  solarScore: 4.2, avgInstalls: 182, avgSystemKw: 9.1,  avgCostK: 24.9 },
  { name: 'Orange',       slug: 'orange',       gea: 'hudson-valley',    population: 384940,  solarScore: 4.4, avgInstalls: 498, avgSystemKw: 9.6,  avgCostK: 27.8 },
  { name: 'Orleans',      slug: 'orleans',      gea: 'finger-lakes',     population: 40352,   solarScore: 3.9, avgInstalls: 58,  avgSystemKw: 8.7,  avgCostK: 23.6 },
  { name: 'Oswego',       slug: 'oswego',       gea: 'central-new-york', population: 117124,  solarScore: 3.7, avgInstalls: 108, avgSystemKw: 8.5,  avgCostK: 23.2 },
  { name: 'Otsego',       slug: 'otsego',       gea: 'mohawk-valley',    population: 59493,   solarScore: 3.6, avgInstalls: 65,  avgSystemKw: 8.4,  avgCostK: 23.0 },
  { name: 'Putnam',       slug: 'putnam',       gea: 'hudson-valley',    population: 97000,   solarScore: 4.5, avgInstalls: 165, avgSystemKw: 9.7,  avgCostK: 28.4 },
  { name: 'Queens',       slug: 'queens',       gea: 'new-york-city',    population: 2405464, solarScore: 3.9, avgInstalls: 440, avgSystemKw: 6.5,  avgCostK: 28.8 },
  { name: 'Rensselaer',   slug: 'rensselaer',   gea: 'capital-region',   population: 159431,  solarScore: 4.0, avgInstalls: 188, avgSystemKw: 9.0,  avgCostK: 25.6 },
  { name: 'Richmond',     slug: 'richmond',     gea: 'new-york-city',    population: 495747,  solarScore: 4.2, avgInstalls: 395, avgSystemKw: 7.8,  avgCostK: 28.2 },
  { name: 'Rockland',     slug: 'rockland',     gea: 'hudson-valley',    population: 338329,  solarScore: 4.6, avgInstalls: 524, avgSystemKw: 9.8,  avgCostK: 29.6 },
  { name: 'St. Lawrence', slug: 'st-lawrence',  gea: 'north-country',    population: 107740,  solarScore: 3.2, avgInstalls: 88,  avgSystemKw: 8.0,  avgCostK: 22.4 },
  { name: 'Saratoga',     slug: 'saratoga',     gea: 'capital-region',   population: 245845,  solarScore: 4.3, avgInstalls: 348, avgSystemKw: 9.4,  avgCostK: 26.8 },
  { name: 'Schenectady',  slug: 'schenectady',  gea: 'capital-region',   population: 155299,  solarScore: 4.0, avgInstalls: 198, avgSystemKw: 8.9,  avgCostK: 25.2 },
  { name: 'Schoharie',    slug: 'schoharie',    gea: 'mohawk-valley',    population: 31364,   solarScore: 3.6, avgInstalls: 38,  avgSystemKw: 8.4,  avgCostK: 22.8 },
  { name: 'Schuyler',     slug: 'schuyler',     gea: 'southern-tier',    population: 17807,   solarScore: 3.7, avgInstalls: 22,  avgSystemKw: 8.5,  avgCostK: 23.0 },
  { name: 'Seneca',       slug: 'seneca',       gea: 'finger-lakes',     population: 34016,   solarScore: 4.0, avgInstalls: 52,  avgSystemKw: 8.9,  avgCostK: 24.0 },
  { name: 'Steuben',      slug: 'steuben',      gea: 'southern-tier',    population: 95379,   solarScore: 3.7, avgInstalls: 88,  avgSystemKw: 8.4,  avgCostK: 22.9 },
  { name: 'Suffolk',      slug: 'suffolk',      gea: 'long-island',      population: 1525920, solarScore: 4.8, avgInstalls: 3860, avgSystemKw: 10.4, avgCostK: 32.2 },
  { name: 'Sullivan',     slug: 'sullivan',     gea: 'hudson-valley',    population: 79641,   solarScore: 4.2, avgInstalls: 115, avgSystemKw: 9.2,  avgCostK: 26.4 },
  { name: 'Tioga',        slug: 'tioga',        gea: 'southern-tier',    population: 48203,   solarScore: 3.7, avgInstalls: 54,  avgSystemKw: 8.3,  avgCostK: 22.8 },
  { name: 'Tompkins',     slug: 'tompkins',     gea: 'southern-tier',    population: 101564,  solarScore: 4.0, avgInstalls: 138, avgSystemKw: 9.0,  avgCostK: 25.0 },
  { name: 'Ulster',       slug: 'ulster',       gea: 'hudson-valley',    population: 177573,  solarScore: 4.4, avgInstalls: 268, avgSystemKw: 9.5,  avgCostK: 27.6 },
  { name: 'Warren',       slug: 'warren',       gea: 'capital-region',   population: 65707,   solarScore: 3.9, avgInstalls: 88,  avgSystemKw: 8.8,  avgCostK: 24.8 },
  { name: 'Washington',   slug: 'washington',   gea: 'capital-region',   population: 60244,   solarScore: 3.8, avgInstalls: 76,  avgSystemKw: 8.6,  avgCostK: 24.2 },
  { name: 'Wayne',        slug: 'wayne',        gea: 'finger-lakes',     population: 91546,   solarScore: 4.1, avgInstalls: 128, avgSystemKw: 9.0,  avgCostK: 24.4 },
  { name: 'Westchester',  slug: 'westchester',  gea: 'hudson-valley',    population: 1004457, solarScore: 4.7, avgInstalls: 1840, avgSystemKw: 10.0, avgCostK: 30.8 },
  { name: 'Wyoming',      slug: 'wyoming',      gea: 'finger-lakes',     population: 39859,   solarScore: 3.9, avgInstalls: 58,  avgSystemKw: 8.8,  avgCostK: 23.8 },
  { name: 'Yates',        slug: 'yates',        gea: 'finger-lakes',     population: 24913,   solarScore: 4.0, avgInstalls: 38,  avgSystemKw: 8.9,  avgCostK: 24.2 },
]

// ── Cities per county (sample data) ──────────────────────────────────────────

export const CITIES_BY_COUNTY: Record<string, GeoCity[]> = {
  'albany': [
    { name: 'Albany',      slug: 'albany-city',   county: 'Albany', countySlug: 'albany', zips: ['12201','12202','12203','12204','12206','12207','12208','12209','12210'], population: 99224,  solarScore: 4.1 },
    { name: 'Cohoes',      slug: 'cohoes',        county: 'Albany', countySlug: 'albany', zips: ['12047'], population: 17066,  solarScore: 3.9 },
    { name: 'Watervliet',  slug: 'watervliet',    county: 'Albany', countySlug: 'albany', zips: ['12189'], population: 10167,  solarScore: 3.8 },
    { name: 'Colonie',     slug: 'colonie',       county: 'Albany', countySlug: 'albany', zips: ['12205','12212'], population: 84170,  solarScore: 4.2 },
    { name: 'Guilderland', slug: 'guilderland',   county: 'Albany', countySlug: 'albany', zips: ['12084'], population: 38168,  solarScore: 4.3 },
    { name: 'Bethlehem',   slug: 'bethlehem',     county: 'Albany', countySlug: 'albany', zips: ['12054'], population: 34860,  solarScore: 4.4 },
  ],
  'broome': [
    { name: 'Binghamton',  slug: 'binghamton',    county: 'Broome', countySlug: 'broome', zips: ['13901','13903','13904','13905'], population: 44452,  solarScore: 3.7 },
    { name: 'Johnson City',slug: 'johnson-city',  county: 'Broome', countySlug: 'broome', zips: ['13790'], population: 14195,  solarScore: 3.7 },
    { name: 'Endicott',    slug: 'endicott',      county: 'Broome', countySlug: 'broome', zips: ['13760'], population: 12956,  solarScore: 3.8 },
    { name: 'Vestal',      slug: 'vestal',        county: 'Broome', countySlug: 'broome', zips: ['13850'], population: 28336,  solarScore: 4.0 },
    { name: 'Union',       slug: 'union',         county: 'Broome', countySlug: 'broome', zips: ['13760'], population: 52590,  solarScore: 3.8 },
  ],
  'dutchess': [
    { name: 'Poughkeepsie', slug: 'poughkeepsie', county: 'Dutchess', countySlug: 'dutchess', zips: ['12601','12602','12603'], population: 31577,  solarScore: 4.4 },
    { name: 'Fishkill',    slug: 'fishkill',      county: 'Dutchess', countySlug: 'dutchess', zips: ['12524'], population: 22107,  solarScore: 4.5 },
    { name: 'Hyde Park',   slug: 'hyde-park',     county: 'Dutchess', countySlug: 'dutchess', zips: ['12538'], population: 21571,  solarScore: 4.5 },
    { name: 'Beacon',      slug: 'beacon',        county: 'Dutchess', countySlug: 'dutchess', zips: ['12508'], population: 14750,  solarScore: 4.4 },
    { name: 'Wappingers Falls', slug: 'wappingers-falls', county: 'Dutchess', countySlug: 'dutchess', zips: ['12590'], population: 6099,   solarScore: 4.6 },
    { name: 'Rhinebeck',   slug: 'rhinebeck',     county: 'Dutchess', countySlug: 'dutchess', zips: ['12572'], population: 2754,   solarScore: 4.7 },
  ],
  'erie': [
    { name: 'Buffalo',     slug: 'buffalo',       county: 'Erie', countySlug: 'erie', zips: ['14201','14202','14203','14204','14206','14207','14208','14209','14210','14211','14212','14213','14214','14215','14216','14217','14218','14219','14220','14222','14225','14226','14227'], population: 278349, solarScore: 4.0 },
    { name: 'Cheektowaga', slug: 'cheektowaga',   county: 'Erie', countySlug: 'erie', zips: ['14225','14206'], population: 87018,  solarScore: 4.0 },
    { name: 'Tonawanda',   slug: 'tonawanda',     county: 'Erie', countySlug: 'erie', zips: ['14150','14151'], population: 14140,  solarScore: 4.1 },
    { name: 'Amherst',     slug: 'amherst',       county: 'Erie', countySlug: 'erie', zips: ['14051','14068','14226','14228'], population: 126082, solarScore: 4.3 },
    { name: 'Hamburg',     slug: 'hamburg',       county: 'Erie', countySlug: 'erie', zips: ['14075'], population: 56936,  solarScore: 4.1 },
    { name: 'Orchard Park',slug: 'orchard-park',  county: 'Erie', countySlug: 'erie', zips: ['14127'], population: 29054,  solarScore: 4.2 },
  ],
  'monroe': [
    { name: 'Rochester',   slug: 'rochester',     county: 'Monroe', countySlug: 'monroe', zips: ['14604','14605','14606','14607','14608','14609','14610','14611','14612','14613','14614','14615','14616','14617','14618','14619','14620','14621','14622','14623','14624','14625','14626','14627'], population: 211328, solarScore: 4.2 },
    { name: 'Greece',      slug: 'greece',        county: 'Monroe', countySlug: 'monroe', zips: ['14612','14616','14626'], population: 96000,  solarScore: 4.3 },
    { name: 'Irondequoit', slug: 'irondequoit',   county: 'Monroe', countySlug: 'monroe', zips: ['14617','14622'], population: 52354,  solarScore: 4.2 },
    { name: 'Brighton',    slug: 'brighton',      county: 'Monroe', countySlug: 'monroe', zips: ['14610','14618'], population: 36609,  solarScore: 4.4 },
    { name: 'Webster',     slug: 'webster',       county: 'Monroe', countySlug: 'monroe', zips: ['14580'], population: 43650,  solarScore: 4.4 },
    { name: 'Henrietta',   slug: 'henrietta',     county: 'Monroe', countySlug: 'monroe', zips: ['14467','14623'], population: 43326,  solarScore: 4.3 },
  ],
  'nassau': [
    { name: 'Hempstead',   slug: 'hempstead',     county: 'Nassau', countySlug: 'nassau', zips: ['11550','11551'], population: 55361,  solarScore: 4.8 },
    { name: 'North Hempstead', slug: 'north-hempstead', county: 'Nassau', countySlug: 'nassau', zips: ['11021','11024','11030','11040','11042','11050','11051','11052','11053','11054'], population: 226322, solarScore: 4.9 },
    { name: 'Oyster Bay',  slug: 'oyster-bay',    county: 'Nassau', countySlug: 'nassau', zips: ['11762','11771','11791','11792'], population: 293214, solarScore: 4.9 },
    { name: 'Glen Cove',   slug: 'glen-cove',     county: 'Nassau', countySlug: 'nassau', zips: ['11542'], population: 27331,  solarScore: 4.8 },
    { name: 'Long Beach',  slug: 'long-beach',    county: 'Nassau', countySlug: 'nassau', zips: ['11561'], population: 33275,  solarScore: 4.7 },
    { name: 'Valley Stream', slug: 'valley-stream', county: 'Nassau', countySlug: 'nassau', zips: ['11580','11581','11582'], population: 37712, solarScore: 4.8 },
  ],
  'onondaga': [
    { name: 'Syracuse',    slug: 'syracuse',      county: 'Onondaga', countySlug: 'onondaga', zips: ['13201','13202','13203','13204','13205','13206','13207','13208','13209','13210','13211','13212','13214','13215','13219','13224'], population: 142553, solarScore: 3.9 },
    { name: 'Salina',      slug: 'salina',        county: 'Onondaga', countySlug: 'onondaga', zips: ['13088','13116','13211'], population: 33290,  solarScore: 4.0 },
    { name: 'Manlius',     slug: 'manlius',       county: 'Onondaga', countySlug: 'onondaga', zips: ['13104'], population: 32370,  solarScore: 4.1 },
    { name: 'Clay',        slug: 'clay',          county: 'Onondaga', countySlug: 'onondaga', zips: ['13041'], population: 58805,  solarScore: 4.0 },
    { name: 'Geddes',      slug: 'geddes',        county: 'Onondaga', countySlug: 'onondaga', zips: ['13088','13219'], population: 17286,  solarScore: 3.8 },
  ],
  'rockland': [
    { name: 'Clarkstown',  slug: 'clarkstown',    county: 'Rockland', countySlug: 'rockland', zips: ['10901','10956','10980','10994'], population: 88202,  solarScore: 4.6 },
    { name: 'Ramapo',      slug: 'ramapo',        county: 'Rockland', countySlug: 'rockland', zips: ['10901','10977','10952','10931','10974'], population: 136461, solarScore: 4.5 },
    { name: 'Orangetown',  slug: 'orangetown',    county: 'Rockland', countySlug: 'rockland', zips: ['10965','10962','10960','10970'], population: 47711,  solarScore: 4.7 },
    { name: 'Haverstraw',  slug: 'haverstraw',    county: 'Rockland', countySlug: 'rockland', zips: ['10927','10993'], population: 37630,  solarScore: 4.5 },
    { name: 'Spring Valley', slug: 'spring-valley', county: 'Rockland', countySlug: 'rockland', zips: ['10977'], population: 32764, solarScore: 4.6 },
  ],
  'saratoga': [
    { name: 'Saratoga Springs', slug: 'saratoga-springs', county: 'Saratoga', countySlug: 'saratoga', zips: ['12866'], population: 28491, solarScore: 4.4 },
    { name: 'Clifton Park', slug: 'clifton-park', county: 'Saratoga', countySlug: 'saratoga', zips: ['12065'], population: 37838, solarScore: 4.5 },
    { name: 'Ballston',    slug: 'ballston',      county: 'Saratoga', countySlug: 'saratoga', zips: ['12019','12020'], population: 17570, solarScore: 4.3 },
    { name: 'Malta',       slug: 'malta',         county: 'Saratoga', countySlug: 'saratoga', zips: ['12020'], population: 15141, solarScore: 4.5 },
    { name: 'Halfmoon',    slug: 'halfmoon',      county: 'Saratoga', countySlug: 'saratoga', zips: ['12065','12118'], population: 23018, solarScore: 4.4 },
  ],
  'schenectady': [
    { name: 'Schenectady', slug: 'schenectady-city', county: 'Schenectady', countySlug: 'schenectady', zips: ['12301','12302','12303','12304','12305','12306','12307','12308','12309'], population: 65552, solarScore: 3.9 },
    { name: 'Niskayuna',   slug: 'niskayuna',     county: 'Schenectady', countySlug: 'schenectady', zips: ['12309'], population: 22560, solarScore: 4.1 },
    { name: 'Rotterdam',   slug: 'rotterdam',     county: 'Schenectady', countySlug: 'schenectady', zips: ['12303','12306'], population: 29094, solarScore: 4.0 },
    { name: 'Glenville',   slug: 'glenville',     county: 'Schenectady', countySlug: 'schenectady', zips: ['12302','12308'], population: 29480, solarScore: 4.1 },
  ],
  'suffolk': [
    { name: 'Brookhaven',  slug: 'brookhaven',    county: 'Suffolk', countySlug: 'suffolk', zips: ['11719','11720','11733','11741','11742','11754','11755','11763','11772','11776','11778','11779','11782','11784','11789','11790','11794','11796','11961','11967','11971','11980'], population: 498840, solarScore: 4.8 },
    { name: 'Islip',       slug: 'islip',         county: 'Suffolk', countySlug: 'suffolk', zips: ['11706','11726','11730','11738','11751','11752','11757','11758','11764','11769','11772','11781','11795'], population: 335543, solarScore: 4.8 },
    { name: 'Babylon',     slug: 'babylon',       county: 'Suffolk', countySlug: 'suffolk', zips: ['11702','11703','11704','11705','11714','11716','11717','11718','11721','11723','11729','11735','11736','11737','11740','11743','11756','11757','11762','11767'], population: 221173, solarScore: 4.9 },
    { name: 'Huntington',  slug: 'huntington',    county: 'Suffolk', countySlug: 'suffolk', zips: ['11724','11725','11731','11732','11740','11743','11746','11747','11749','11753','11768','11770','11780','11787','11788','11797'], population: 204811, solarScore: 4.9 },
    { name: 'Smithtown',   slug: 'smithtown',     county: 'Suffolk', countySlug: 'suffolk', zips: ['11764','11766','11780','11787','11788'], population: 117801, solarScore: 4.8 },
    { name: 'Southampton', slug: 'southampton',   county: 'Suffolk', countySlug: 'suffolk', zips: ['11946','11968','11969','11970','11971','11978'], population: 60063, solarScore: 4.7 },
  ],
  'westchester': [
    { name: 'Yonkers',     slug: 'yonkers',       county: 'Westchester', countySlug: 'westchester', zips: ['10701','10702','10703','10704','10705','10706'], population: 211569, solarScore: 4.5 },
    { name: 'White Plains', slug: 'white-plains', county: 'Westchester', countySlug: 'westchester', zips: ['10601','10603','10604','10605','10606','10607'], population: 58109, solarScore: 4.7 },
    { name: 'Mount Vernon', slug: 'mount-vernon', county: 'Westchester', countySlug: 'westchester', zips: ['10550','10552','10553'], population: 73893, solarScore: 4.5 },
    { name: 'New Rochelle', slug: 'new-rochelle', county: 'Westchester', countySlug: 'westchester', zips: ['10801','10802','10804','10805'], population: 79726, solarScore: 4.6 },
    { name: 'Mount Pleasant', slug: 'mount-pleasant', county: 'Westchester', countySlug: 'westchester', zips: ['10530','10591','10595','10596','10597'], population: 43649, solarScore: 4.7 },
    { name: 'Greenburgh',  slug: 'greenburgh',    county: 'Westchester', countySlug: 'westchester', zips: ['10501','10502','10503','10504','10507','10508','10522','10523','10530','10533','10553','10559','10562','10570','10577','10591','10595','10597','10598'], population: 90000, solarScore: 4.8 },
  ],
  'tompkins': [
    { name: 'Ithaca',      slug: 'ithaca',        county: 'Tompkins', countySlug: 'tompkins', zips: ['14850','14851','14852','14853'], population: 32083, solarScore: 4.2 },
    { name: 'Dryden',      slug: 'dryden',        county: 'Tompkins', countySlug: 'tompkins', zips: ['13053'], population: 14435, solarScore: 4.0 },
    { name: 'Lansing',     slug: 'lansing',       county: 'Tompkins', countySlug: 'tompkins', zips: ['14882'], population: 11333, solarScore: 4.1 },
    { name: 'Caroline',    slug: 'caroline',      county: 'Tompkins', countySlug: 'tompkins', zips: ['14817','14881'], population: 3395,  solarScore: 3.9 },
  ],
  'ulster': [
    { name: 'Kingston',    slug: 'kingston',      county: 'Ulster', countySlug: 'ulster', zips: ['12401','12402'], population: 23116, solarScore: 4.3 },
    { name: 'Woodstock',   slug: 'woodstock',     county: 'Ulster', countySlug: 'ulster', zips: ['12498'], population: 5884,  solarScore: 4.6 },
    { name: 'Saugerties',  slug: 'saugerties',    county: 'Ulster', countySlug: 'ulster', zips: ['12477'], population: 19655, solarScore: 4.3 },
    { name: 'New Paltz',   slug: 'new-paltz',     county: 'Ulster', countySlug: 'ulster', zips: ['12561'], population: 14003, solarScore: 4.5 },
    { name: 'Ellenville',  slug: 'ellenville',    county: 'Ulster', countySlug: 'ulster', zips: ['12428'], population: 9990,  solarScore: 4.2 },
  ],
}

// Fill in all other counties with some placeholder cities
const DEFAULT_CITIES: Record<string, GeoCity[]> = {}
for (const county of NY_COUNTIES) {
  if (!CITIES_BY_COUNTY[county.slug]) {
    DEFAULT_CITIES[county.slug] = [
      { name: `${county.name} City`, slug: `${county.slug}-city`, county: county.name, countySlug: county.slug, zips: ['10000'], population: Math.round(county.population * 0.35), solarScore: county.solarScore },
      { name: `North ${county.name}`, slug: `north-${county.slug}`, county: county.name, countySlug: county.slug, zips: ['10001'], population: Math.round(county.population * 0.12), solarScore: Math.min(5, county.solarScore + 0.2) },
      { name: `${county.name} Center`, slug: `${county.slug}-center`, county: county.name, countySlug: county.slug, zips: ['10002'], population: Math.round(county.population * 0.08), solarScore: county.solarScore },
    ]
  }
}

export function getCitiesByCounty(countySlug: string): GeoCity[] {
  return CITIES_BY_COUNTY[countySlug] || DEFAULT_CITIES[countySlug] || []
}

// ── States (just NY + a few neighbors for demo) ───────────────────────────────

export const STATES: GeoState[] = [
  {
    name: 'New York',
    slug: 'new-york',
    counties: NY_COUNTIES.map(c => c.slug),
    population: 20201249,
    solarScore: 4.2,
    avgInstalls: 285000,
  },
  {
    name: 'New Jersey',
    slug: 'new-jersey',
    counties: ['bergen','essex','hudson','mercer','middlesex','monmouth','morris','ocean','passaic','union'],
    population: 9288994,
    solarScore: 4.5,
    avgInstalls: 168000,
  },
  {
    name: 'Connecticut',
    slug: 'connecticut',
    counties: ['fairfield','hartford','litchfield','middlesex','new-haven','new-london','tolland','windham'],
    population: 3605944,
    solarScore: 4.1,
    avgInstalls: 62000,
  },
  {
    name: 'Pennsylvania',
    slug: 'pennsylvania',
    counties: ['allegheny','bucks','chester','delaware','lancaster','montgomery','philadelphia','york'],
    population: 12801989,
    solarScore: 3.8,
    avgInstalls: 95000,
  },
  {
    name: 'Massachusetts',
    slug: 'massachusetts',
    counties: ['barnstable','bristol','dukes','essex','franklin','hampden','hampshire','middlesex','nantucket','norfolk','plymouth','suffolk','worcester'],
    population: 6981974,
    solarScore: 4.0,
    avgInstalls: 82000,
  },
]

// ── ZIP code helpers ──────────────────────────────────────────────────────────

export interface GeoZip {
  zip: string
  city: string
  county: string
  countySlug: string
  state: string
  solarScore: number
  avgInstalls: number
}

export const SAMPLE_ZIPS: GeoZip[] = [
  { zip: '10001', city: 'New York',        county: 'New York',   countySlug: 'new-york',   state: 'NY', solarScore: 3.5, avgInstalls: 12 },
  { zip: '10601', city: 'White Plains',    county: 'Westchester',countySlug: 'westchester',state: 'NY', solarScore: 4.7, avgInstalls: 142 },
  { zip: '11501', city: 'Mineola',         county: 'Nassau',     countySlug: 'nassau',     state: 'NY', solarScore: 4.8, avgInstalls: 186 },
  { zip: '11701', city: 'Amityville',      county: 'Suffolk',    countySlug: 'suffolk',    state: 'NY', solarScore: 4.8, avgInstalls: 224 },
  { zip: '12201', city: 'Albany',          county: 'Albany',     countySlug: 'albany',     state: 'NY', solarScore: 4.1, avgInstalls: 88 },
  { zip: '12866', city: 'Saratoga Springs',county: 'Saratoga',   countySlug: 'saratoga',   state: 'NY', solarScore: 4.4, avgInstalls: 112 },
  { zip: '13201', city: 'Syracuse',        county: 'Onondaga',   countySlug: 'onondaga',   state: 'NY', solarScore: 3.9, avgInstalls: 64 },
  { zip: '14201', city: 'Buffalo',         county: 'Erie',       countySlug: 'erie',       state: 'NY', solarScore: 4.0, avgInstalls: 95 },
  { zip: '14604', city: 'Rochester',       county: 'Monroe',     countySlug: 'monroe',     state: 'NY', solarScore: 4.2, avgInstalls: 108 },
  { zip: '12601', city: 'Poughkeepsie',    county: 'Dutchess',   countySlug: 'dutchess',   state: 'NY', solarScore: 4.5, avgInstalls: 134 },
  { zip: '10901', city: 'Suffern',         county: 'Rockland',   countySlug: 'rockland',   state: 'NY', solarScore: 4.6, avgInstalls: 158 },
  { zip: '12401', city: 'Kingston',        county: 'Ulster',     countySlug: 'ulster',     state: 'NY', solarScore: 4.4, avgInstalls: 96 },
  { zip: '13901', city: 'Binghamton',      county: 'Broome',     countySlug: 'broome',     state: 'NY', solarScore: 3.7, avgInstalls: 52 },
  { zip: '12901', city: 'Plattsburgh',     county: 'Clinton',    countySlug: 'clinton',    state: 'NY', solarScore: 3.3, avgInstalls: 38 },
  { zip: '13790', city: 'Johnson City',    county: 'Broome',     countySlug: 'broome',     state: 'NY', solarScore: 3.7, avgInstalls: 48 },
  { zip: '10550', city: 'Mount Vernon',    county: 'Westchester',countySlug: 'westchester',state: 'NY', solarScore: 4.5, avgInstalls: 128 },
  { zip: '14850', city: 'Ithaca',          county: 'Tompkins',   countySlug: 'tompkins',   state: 'NY', solarScore: 4.2, avgInstalls: 76 },
  { zip: '12065', city: 'Clifton Park',    county: 'Saratoga',   countySlug: 'saratoga',   state: 'NY', solarScore: 4.5, avgInstalls: 119 },
  { zip: '10701', city: 'Yonkers',         county: 'Westchester',countySlug: 'westchester',state: 'NY', solarScore: 4.5, avgInstalls: 130 },
  { zip: '11550', city: 'Hempstead',       county: 'Nassau',     countySlug: 'nassau',     state: 'NY', solarScore: 4.8, avgInstalls: 192 },
  { zip: '14075', city: 'Hamburg',         county: 'Erie',       countySlug: 'erie',       state: 'NY', solarScore: 4.2, avgInstalls: 104 },
  { zip: '12303', city: 'Schenectady',     county: 'Schenectady',countySlug: 'schenectady',state: 'NY', solarScore: 4.0, avgInstalls: 82 },
]
