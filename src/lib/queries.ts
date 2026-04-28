import { sql } from './db'
import { fmtGea } from './utils'

export type CountyKpi = {
  id: number
  region_name: string
  state_name: string
  cambium_gea: string | null
  lat_avg: number
  lng_avg: number
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  count_qualified: number
  existing_installs_count: number
  untapped_buildings: number
  adoption_rate_pct: number
  untapped_pct: number
  kw_total: number
  kw_median: number
  yearly_sunlight_kwh_total: number
  untapped_kwh_yr: number
  carbon_offset_metric_tons: number
  total_energy_value_usd_yr: number
  untapped_energy_value_usd_yr: number
  carbon_offset_value_usd_yr: number
  untapped_carbon_value_usd_yr: number
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  untapped_install_cost_usd: number
  median_annual_kwh_per_roof: number
  median_annual_savings_usd: number
  median_lifetime_savings_usd: number
  median_install_cost_usd: number
  median_payback_years: number | null
  cars_off_road_equivalent: number
  homes_powered_equivalent: number
  percent_covered: number
  percent_qualified: number
  yearly_sunlight_kwh_kw_threshold_avg: number
  sunlight_grade: string
  sunlight_stars: number
  seal_url: string | null
  number_of_panels_total?: number | null
  number_of_panels_median?: number | null
}

export type StateKpi = {
  id: number
  region_name: string
  state_name: string
  flag_url: string | null
  lat_avg: number
  lng_avg: number
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  count_qualified: number
  existing_installs_count: number
  untapped_buildings: number
  adoption_rate_pct: number
  untapped_pct: number
  kw_total: number
  kw_median: number
  yearly_sunlight_kwh_total: number
  untapped_kwh_yr: number
  carbon_offset_metric_tons: number
  total_energy_value_usd_yr: number
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  median_annual_savings_usd: number
  median_lifetime_savings_usd: number
  median_install_cost_usd: number
  median_payback_years: number | null
  cars_off_road_equivalent: number
  homes_powered_equivalent: number
  sunlight_grade: string
  sunlight_stars: number
  percent_covered?: number | null
  percent_qualified?: number | null
  number_of_panels_total?: number | null
  number_of_panels_median?: number | null
}

export type CityKpi = {
  id: number
  region_name: string
  state_name: string
  county_name: string | null
  county_fips: string | null
  lat_avg: number
  lng_avg: number
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  count_qualified: number
  existing_installs_count: number
  untapped_buildings: number
  adoption_rate_pct: number
  untapped_pct: number
  kw_total: number
  kw_median: number
  yearly_sunlight_kwh_total: number
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  median_annual_savings_usd: number
  median_lifetime_savings_usd: number
  median_install_cost_usd: number
  median_payback_years: number | null
  cars_off_road_equivalent: number
  homes_powered_equivalent: number
  sunlight_grade: string
  sunlight_stars: number
  percent_covered?: number | null
  percent_qualified?: number | null
  number_of_panels_total?: number | null
  number_of_panels_median?: number | null
}

export type ZipKpi = {
  id: number
  zip_code: string
  state_name: string
  cambium_gea: string | null
  lat_avg: number
  lng_avg: number
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  count_qualified: number
  existing_installs_count: number
  untapped_buildings: number
  adoption_rate_pct: number
  untapped_pct: number
  kw_total: number
  kw_median: number
  yearly_sunlight_kwh_total: number
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  median_annual_savings_usd: number
  median_lifetime_savings_usd: number
  median_install_cost_usd: number
  median_payback_years: number | null
  sunlight_grade: string
  sunlight_stars: number
  percent_covered?: number | null
  percent_qualified?: number | null
  number_of_panels_total?: number | null
  number_of_panels_median?: number | null
}

export type GeaKpi = {
  cambium_gea: string
  county_count: number
  lat_avg: number
  lng_avg: number
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  count_qualified: number
  existing_installs_count: number
  untapped_buildings: number
  adoption_rate_pct: number
  untapped_pct: number
  kw_total: number
  kw_median: number
  yearly_sunlight_kwh_total: number
  untapped_annual_value_usd: number
  untapped_lifetime_value_usd: number
  cars_off_road_equivalent: number
  homes_powered_equivalent: number
  sunlight_grade: string
  sunlight_stars: number
}

// Slug helpers — GEA names use underscores and mixed case (e.g. "MISO_Central")
export function geaToSlug(gea: string) {
  return gea.toLowerCase().replace(/_/g, '-')
}
export function slugToGea(slug: string, geas: string[]) {
  return geas.find(g => geaToSlug(g) === slug) ?? null
}

// General slug helpers for region names
export function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
export function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Slug-based lookups use Postgres regex to normalise special chars (e.g. "St. Lawrence" → "st-lawrence")
function slugExpr(col: string) {
  return `REGEXP_REPLACE(lower(${col}), '[^a-z0-9]+', '-', 'g')`
}

// ── Explore ──────────────────────────────────────────────────────────────────
export async function getExploreCounties(): Promise<CountyKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_county_kpis
    WHERE state_name = 'New York'
    ORDER BY untapped_annual_value_usd DESC
  `
  return rows as CountyKpi[]
}

// ── State ─────────────────────────────────────────────────────────────────────
export async function getStateByName(stateName: string): Promise<StateKpi | null> {
  const rows = await sql`
    SELECT v.*, s.flag_url
    FROM solargpt.v_state_kpis v
    LEFT JOIN solargpt.raw_sunroof_state s USING (id)
    WHERE v.state_name = ${stateName}
    LIMIT 1
  `
  return (rows[0] as StateKpi) ?? null
}

export async function getAllStates(): Promise<StateKpi[]> {
  const rows = await sql`
    SELECT v.*, s.flag_url
    FROM solargpt.v_state_kpis v
    LEFT JOIN solargpt.raw_sunroof_state s USING (id)
    ORDER BY v.state_name
  `
  return rows as StateKpi[]
}

export async function getCountiesByState(stateName: string): Promise<CountyKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_county_kpis
    WHERE state_name = ${stateName}
    ORDER BY untapped_annual_value_usd DESC
  `
  return rows as CountyKpi[]
}

// ── County ────────────────────────────────────────────────────────────────────
export async function getAllCounties(): Promise<CountyKpi[]> {
  const rows = await sql`
    SELECT sub.id, sub.region_name, sub.state_name, sub.cambium_gea,
           sub.count_qualified, sub.existing_installs_count,
           sub.percent_covered, sub.percent_qualified,
           sub.yearly_sunlight_kwh_total, sub.carbon_offset_metric_tons,
           sub.kw_total, sub.kw_median,
           sub.untapped_annual_value_usd, sub.adoption_rate_pct,
           sub.sunlight_grade, sub.sunlight_stars,
           sub.seal_url, sub.number_of_panels_median, sub.number_of_panels_total
    FROM (
      SELECT DISTINCT ON (v.id)
             v.id, v.region_name, v.state_name, v.cambium_gea,
             v.count_qualified, v.existing_installs_count,
             v.percent_covered, v.percent_qualified,
             v.yearly_sunlight_kwh_total, v.carbon_offset_metric_tons,
             v.kw_total, v.kw_median,
             v.untapped_annual_value_usd, v.adoption_rate_pct,
             v.sunlight_grade, v.sunlight_stars,
             c.seal_url, c.number_of_panels_median, c.number_of_panels_total
      FROM solargpt.v_county_kpis v
      LEFT JOIN LATERAL (
        SELECT seal_url, number_of_panels_median, number_of_panels_total
        FROM solargpt.raw_sunroof_county
        WHERE id = v.id
        LIMIT 1
      ) c ON true
      ORDER BY v.id
    ) sub
    ORDER BY sub.region_name ASC
  `
  return rows as CountyKpi[]
}

export type CountyMapEntry = {
  fips: string
  region_name: string
  state_name: string
  untapped_annual_value_usd: number
}

export async function getCountiesForMap(): Promise<CountyMapEntry[]> {
  const rows = await sql`
    SELECT DISTINCT ON (v.id)
      LPAD(m.state_fips::text, 2, '0') || LPAD(m.county_fips::text, 3, '0') AS fips,
      v.region_name,
      v.state_name,
      v.untapped_annual_value_usd
    FROM solargpt.v_county_kpis v
    JOIN LATERAL (
      SELECT state_fips, county_fips
      FROM solargpt.raw_cambium_county_mapping
      WHERE LOWER(state_name) = LOWER(v.state_name)
        AND (
          LOWER(county_name || ' County')      = LOWER(v.region_name) OR
          LOWER(county_name || ' Parish')      = LOWER(v.region_name) OR
          LOWER(county_name || ' Borough')     = LOWER(v.region_name) OR
          LOWER(county_name || ' Municipality')= LOWER(v.region_name) OR
          LOWER(county_name || ' Census Area') = LOWER(v.region_name) OR
          LOWER(county_name || ' city')        = LOWER(v.region_name) OR
          LOWER(county_name)                   = LOWER(v.region_name)
        )
      LIMIT 1
    ) m ON true
    ORDER BY v.id
  `
  return rows as CountyMapEntry[]
}

export type CountyCatalogEntry = {
  id: number
  region_name: string
  state_name: string
  seal_url: string | null
}

export async function getCountyCatalog(): Promise<CountyCatalogEntry[]> {
  const rows = await sql`
    SELECT id, region_name, state_name, seal_url
    FROM solargpt.raw_sunroof_county
    ORDER BY region_name ASC, state_name ASC
  `
  return rows as CountyCatalogEntry[]
}

export async function getCountyById(id: number): Promise<CountyKpi | null> {
  const rows = await sql`SELECT * FROM solargpt.v_county_kpis WHERE id = ${id} LIMIT 1`
  return (rows[0] as CountyKpi) ?? null
}

export async function getCountyByName(regionName: string, stateName: string): Promise<CountyKpi | null> {
  const rows = await sql`
    SELECT * FROM solargpt.v_county_kpis
    WHERE region_name = ${regionName} AND state_name = ${stateName}
    LIMIT 1
  `
  return (rows[0] as CountyKpi) ?? null
}

export async function getCountyBySlug(slug: string, stateName = 'New York'): Promise<CountyKpi | null> {
  const rows = await sql`
    SELECT * FROM solargpt.v_county_kpis
    WHERE REGEXP_REPLACE(lower(region_name), '[^a-z0-9]+', '-', 'g') = ${slug}
    AND state_name = ${stateName}
    LIMIT 1
  `
  return (rows[0] as CountyKpi) ?? null
}

export async function getAdjacentCounties(id: number, stateName: string): Promise<{ prev: CountyKpi | null; next: CountyKpi | null }> {
  const rows = await sql`
    WITH ordered AS (
      SELECT id, region_name,
        LAG(id)          OVER (ORDER BY region_name) AS prev_id,
        LEAD(id)         OVER (ORDER BY region_name) AS next_id,
        LAG(region_name) OVER (ORDER BY region_name) AS prev_name,
        LEAD(region_name)OVER (ORDER BY region_name) AS next_name
      FROM solargpt.v_county_kpis WHERE state_name = ${stateName}
    )
    SELECT prev_id, next_id, prev_name, next_name FROM ordered WHERE id = ${id}
  `
  if (!rows[0]) return { prev: null, next: null }
  const r = rows[0] as { prev_id: number | null; next_id: number | null; prev_name: string | null; next_name: string | null }
  return {
    prev: r.prev_id ? { id: r.prev_id, region_name: r.prev_name } as CountyKpi : null,
    next: r.next_id ? { id: r.next_id, region_name: r.next_name } as CountyKpi : null,
  }
}

export async function getCitiesByState(stateName: string, limit = 20): Promise<CityKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_city_kpis
    WHERE state_name = ${stateName}
    ORDER BY untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as CityKpi[]
}

export type StateMapEntry = {
  name: string
  untapped_annual_value_usd: number
}

export async function getStatesForMap(): Promise<StateMapEntry[]> {
  const rows = await sql`
    SELECT state_name AS name, untapped_annual_value_usd
    FROM solargpt.v_state_kpis
    ORDER BY state_name
  `
  return rows as StateMapEntry[]
}

export async function getCountiesForState(stateName: string): Promise<CountyMapEntry[]> {
  const rows = await sql`
    SELECT DISTINCT ON (v.id)
      LPAD(m.state_fips::text, 2, '0') || LPAD(m.county_fips::text, 3, '0') AS fips,
      v.region_name,
      v.state_name,
      v.untapped_annual_value_usd
    FROM solargpt.v_county_kpis v
    JOIN LATERAL (
      SELECT state_fips, county_fips
      FROM solargpt.raw_cambium_county_mapping
      WHERE LOWER(state_name) = LOWER(v.state_name)
        AND (
          LOWER(county_name || ' County')      = LOWER(v.region_name) OR
          LOWER(county_name || ' Parish')      = LOWER(v.region_name) OR
          LOWER(county_name || ' Borough')     = LOWER(v.region_name) OR
          LOWER(county_name || ' Municipality')= LOWER(v.region_name) OR
          LOWER(county_name || ' Census Area') = LOWER(v.region_name) OR
          LOWER(county_name || ' city')        = LOWER(v.region_name) OR
          LOWER(county_name)                   = LOWER(v.region_name)
        )
      LIMIT 1
    ) m ON true
    WHERE v.state_name = ${stateName}
    ORDER BY v.id
  `
  return rows as CountyMapEntry[]
}

export type CityMarker = {
  id: number
  region_name: string
  lat_avg: number
  lng_avg: number
  untapped_annual_value_usd: number
  count_qualified: number
}

export type ZipMapEntry = {
  zip_code: string
  region_name: string
  untapped_annual_value_usd: number
  count_qualified: number
}

export async function getZipsForCounty(
  stateName: string,
  latMin: number, latMax: number,
  lngMin: number, lngMax: number,
): Promise<ZipMapEntry[]> {
  const rows = await sql`
    SELECT zip_code, region_name, untapped_annual_value_usd, count_qualified
    FROM solargpt.v_zip_kpis
    WHERE state_name = ${stateName}
      AND lat_avg BETWEEN ${latMin} AND ${latMax}
      AND lng_avg BETWEEN ${lngMin} AND ${lngMax}
    ORDER BY untapped_annual_value_usd DESC NULLS LAST
  `
  return rows as ZipMapEntry[]
}

export async function getCountyFips(stateName: string, countyName: string): Promise<string | null> {
  const rows = await sql`
    SELECT LPAD(m.state_fips::text, 2, '0') || LPAD(m.county_fips::text, 3, '0') AS fips
    FROM solargpt.raw_cambium_county_mapping m
    WHERE LOWER(m.state_name) = LOWER(${stateName})
      AND (
        LOWER(m.county_name || ' County')       = LOWER(${countyName}) OR
        LOWER(m.county_name || ' Parish')       = LOWER(${countyName}) OR
        LOWER(m.county_name || ' Borough')      = LOWER(${countyName}) OR
        LOWER(m.county_name || ' Municipality') = LOWER(${countyName}) OR
        LOWER(m.county_name || ' Census Area')  = LOWER(${countyName}) OR
        LOWER(m.county_name || ' city')         = LOWER(${countyName}) OR
        LOWER(m.county_name)                    = LOWER(${countyName})
      )
    LIMIT 1
  `
  return (rows[0] as { fips: string } | undefined)?.fips ?? null
}

export async function getCitiesForCountyMap(
  stateName: string,
  latMin: number, latMax: number,
  lngMin: number, lngMax: number,
): Promise<CityMarker[]> {
  const rows = await sql`
    SELECT id, region_name, lat_avg, lng_avg, untapped_annual_value_usd, count_qualified
    FROM solargpt.v_city_kpis
    WHERE state_name = ${stateName}
      AND lat_avg BETWEEN ${latMin} AND ${latMax}
      AND lng_avg BETWEEN ${lngMin} AND ${lngMax}
    ORDER BY untapped_annual_value_usd DESC NULLS LAST
  `
  return rows as CityMarker[]
}

// ── City ──────────────────────────────────────────────────────────────────────
export async function getAllCities(): Promise<CityKpi[]> {
  const rows = await sql`
    SELECT sub.id, sub.region_name, sub.state_name,
           sub.count_qualified, sub.existing_installs_count,
           sub.yearly_sunlight_kwh_total, sub.carbon_offset_metric_tons,
           sub.kw_total, sub.kw_median,
           sub.untapped_annual_value_usd, sub.adoption_rate_pct,
           sub.sunlight_grade, sub.sunlight_stars,
           sub.percent_covered, sub.percent_qualified,
           sub.number_of_panels_total, sub.number_of_panels_median
    FROM (
      SELECT DISTINCT ON (v.id)
             v.id, v.region_name, v.state_name,
             v.count_qualified, v.existing_installs_count,
             v.yearly_sunlight_kwh_total, v.carbon_offset_metric_tons,
             v.kw_total, v.kw_median,
             v.untapped_annual_value_usd, v.adoption_rate_pct,
             v.sunlight_grade, v.sunlight_stars,
             v.percent_covered, v.percent_qualified,
             c.number_of_panels_total, c.number_of_panels_median
      FROM solargpt.v_city_kpis v
      LEFT JOIN LATERAL (
        SELECT number_of_panels_total, number_of_panels_median
        FROM solargpt.raw_sunroof_city
        WHERE id = v.id
        LIMIT 1
      ) c ON true
      ORDER BY v.id
    ) sub
    ORDER BY sub.region_name ASC
  `
  return rows as CityKpi[]
}

export async function getCityById(id: number): Promise<CityKpi | null> {
  const rows = await sql`SELECT * FROM solargpt.v_city_kpis WHERE id = ${id} LIMIT 1`
  return (rows[0] as CityKpi) ?? null
}

export async function getCityBySlug(slug: string, stateName = 'New York'): Promise<CityKpi | null> {
  const rows = await sql`
    SELECT * FROM solargpt.v_city_kpis
    WHERE REGEXP_REPLACE(lower(region_name), '[^a-z0-9]+', '-', 'g') = ${slug}
    AND state_name = ${stateName}
    LIMIT 1
  `
  return (rows[0] as CityKpi) ?? null
}

export async function getAdjacentCities(id: number, stateName: string): Promise<{ prev: CityKpi | null; next: CityKpi | null }> {
  const rows = await sql`
    WITH ordered AS (
      SELECT id, region_name,
        LAG(id)          OVER (ORDER BY untapped_annual_value_usd DESC) AS prev_id,
        LEAD(id)         OVER (ORDER BY untapped_annual_value_usd DESC) AS next_id,
        LAG(region_name) OVER (ORDER BY untapped_annual_value_usd DESC) AS prev_name,
        LEAD(region_name)OVER (ORDER BY untapped_annual_value_usd DESC) AS next_name
      FROM solargpt.v_city_kpis WHERE state_name = ${stateName}
    )
    SELECT prev_id, next_id, prev_name, next_name FROM ordered WHERE id = ${id}
  `
  if (!rows[0]) return { prev: null, next: null }
  const r = rows[0] as { prev_id: number | null; next_id: number | null; prev_name: string | null; next_name: string | null }
  return {
    prev: r.prev_id ? { id: r.prev_id, region_name: r.prev_name } as CityKpi : null,
    next: r.next_id ? { id: r.next_id, region_name: r.next_name } as CityKpi : null,
  }
}

export async function getSiblingCities(stateName: string, excludeId: number, limit = 12): Promise<CityKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_city_kpis
    WHERE state_name = ${stateName} AND id != ${excludeId}
    ORDER BY untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as CityKpi[]
}

// ── ZIP ───────────────────────────────────────────────────────────────────────
export async function getAllZips(): Promise<ZipKpi[]> {
  const rows = await sql`
    SELECT id, zip_code, state_name, count_qualified, existing_installs_count,
           yearly_sunlight_kwh_total, carbon_offset_metric_tons,
           kw_total, kw_median,
           untapped_annual_value_usd, adoption_rate_pct,
           sunlight_grade, sunlight_stars
    FROM solargpt.v_zip_kpis
    ORDER BY count_qualified DESC NULLS LAST
    LIMIT 2000
  `
  return rows as ZipKpi[]
}

export async function getZipByCode(zipCode: string): Promise<ZipKpi | null> {
  const rows = await sql`SELECT * FROM solargpt.v_zip_kpis WHERE zip_code = ${zipCode} LIMIT 1`
  return (rows[0] as ZipKpi) ?? null
}

export async function getSiblingZips(stateName: string, excludeZip: string, limit = 12): Promise<ZipKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_zip_kpis
    WHERE state_name = ${stateName} AND zip_code != ${excludeZip}
    ORDER BY untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as ZipKpi[]
}

// ── State ─────────────────────────────────────────────────────────────────────
export async function getStateBySlug(slug: string): Promise<StateKpi | null> {
  const rows = await sql`
    SELECT v.*, s.flag_url
    FROM solargpt.v_state_kpis v
    LEFT JOIN solargpt.raw_sunroof_state s USING (id)
    WHERE REGEXP_REPLACE(lower(v.state_name), '[^a-z0-9]+', '-', 'g') = ${slug}
    LIMIT 1
  `
  return (rows[0] as StateKpi) ?? null
}

// ── GEA ───────────────────────────────────────────────────────────────────────
export async function getAllGeas(): Promise<string[]> {
  const rows = await sql`
    SELECT cambium_gea
    FROM solargpt.raw_cambium_county_mapping
    WHERE state_name IN (SELECT DISTINCT state_name FROM solargpt.raw_sunroof_county)
    GROUP BY cambium_gea
    ORDER BY cambium_gea
  `
  return rows.map(r => (r as { cambium_gea: string }).cambium_gea)
}

export async function getGeaKpi(gea: string): Promise<GeaKpi | null> {
  const rows = await sql`SELECT * FROM solargpt.v_gea_kpis WHERE cambium_gea = ${gea} LIMIT 1`
  return (rows[0] as GeaKpi) ?? null
}

const SPP_LOGO   = 'https://www.spp.org/logo.png'
const ISONE_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/ISO_New_England.svg/3840px-ISO_New_England.svg.png'
const NG_LOGO    = 'https://www.northerngrid.net/static/images/LOGO_NorthernGrid_FINAL_v04.png'
const PJM_LOGO   = 'https://cigre-usnc.org/wp-content/uploads/2016/02/PJM-1-color-and-2-color-logo.png'

const GEA_LOGO_SEEDS: Record<string, string> = {
  'CAISO':             'https://evcvaluation.com/wp-content/uploads/CAISO_Logo_Custom.png',
  'NYISO':             'https://www.nyiso.com/documents/20142/10339375/nyiso-logo-opengraph.png/44f65e34-e632-8f8a-e594-013f2d3ef46b?t=1690894417356',
  'ERCOT':             'https://bkvenergy.com/wp-content/uploads/2023/08/ERCOT-logo-1.webp',
  'SPP':               SPP_LOGO,
  'SPP_N':             SPP_LOGO,
  'SPP_S':             SPP_LOGO,
  'SPP North':         SPP_LOGO,
  'SPP South':         SPP_LOGO,
  'ISO New England':   ISONE_LOGO,
  'ISO_NE':            ISONE_LOGO,
  'ISONE':             ISONE_LOGO,
  'NorthernGrid':      NG_LOGO,
  'Northern Grid':     NG_LOGO,
  'NORTHERNGRID':      NG_LOGO,
  'MRO':               NG_LOGO,
  'PJM':               PJM_LOGO,
  'PJM RTO':           PJM_LOGO,
}

export async function getGeaLogos(): Promise<Record<string, string>> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS gea_assets (
        gea_name  TEXT PRIMARY KEY,
        logo_url  TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    // Upsert seeds so new logos can be added here without manual SQL
    for (const [name, url] of Object.entries(GEA_LOGO_SEEDS)) {
      await sql`
        INSERT INTO gea_assets (gea_name, logo_url)
        VALUES (${name}, ${url})
        ON CONFLICT (gea_name) DO UPDATE SET logo_url = EXCLUDED.logo_url
      `
    }
    const rows = await sql`SELECT gea_name, logo_url FROM gea_assets`
    const map: Record<string, string> = {}
    for (const r of rows) map[r.gea_name as string] = r.logo_url as string
    return map
  } catch {
    return GEA_LOGO_SEEDS
  }
}

export async function getCountiesByGea(gea: string): Promise<CountyKpi[]> {
  const rows = await sql`
    SELECT * FROM solargpt.v_county_kpis
    WHERE cambium_gea = ${gea}
    ORDER BY untapped_annual_value_usd DESC
  `
  return rows as CountyKpi[]
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export type DashboardStats = {
  total_states: number
  total_qualified: number
  total_installs: number
  total_untapped_annual: number
  total_untapped_lifetime: number
  avg_adoption_pct: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await sql`
    SELECT
      COUNT(*) AS total_states,
      SUM(count_qualified) AS total_qualified,
      SUM(existing_installs_count) AS total_installs,
      SUM(untapped_annual_value_usd) AS total_untapped_annual,
      SUM(untapped_lifetime_value_usd) AS total_untapped_lifetime,
      AVG(adoption_rate_pct) AS avg_adoption_pct
    FROM solargpt.v_state_kpis
  `
  return rows[0] as DashboardStats
}

export async function getTopStates(limit = 8): Promise<StateKpi[]> {
  const rows = await sql`
    SELECT v.id, v.state_name, v.lat_avg, v.lng_avg, v.lat_min, v.lat_max, v.lng_min, v.lng_max,
      v.count_qualified, v.existing_installs_count, v.untapped_annual_value_usd,
      v.untapped_lifetime_value_usd, v.adoption_rate_pct, v.median_payback_years,
      v.median_annual_savings_usd, v.median_install_cost_usd, v.cars_off_road_equivalent,
      v.homes_powered_equivalent, v.sunlight_grade, v.sunlight_stars,
      v.untapped_buildings, v.untapped_pct, v.kw_total, v.kw_median,
      v.yearly_sunlight_kwh_total, v.carbon_offset_metric_tons,
      v.total_energy_value_usd_yr, v.untapped_energy_value_usd_yr,
      v.carbon_offset_value_usd_yr, v.untapped_carbon_value_usd_yr,
      v.untapped_install_cost_usd, v.median_annual_kwh_per_roof,
      v.median_lifetime_savings_usd, v.percent_covered, v.percent_qualified,
      v.yearly_sunlight_kwh_kw_threshold_avg, v.region_name, s.flag_url
    FROM solargpt.v_state_kpis v
    LEFT JOIN solargpt.raw_sunroof_state s USING (id)
    ORDER BY v.untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as StateKpi[]
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
export type HeatmapPoint = { lat: number; lng: number; weight: number }

export async function getHeatmapPoints(
  latMin: number, latMax: number, lngMin: number, lngMax: number
): Promise<HeatmapPoint[]> {
  const rows = await sql`
    SELECT lat_avg, lng_avg, count_qualified,
      count_qualified::float / NULLIF(MAX(count_qualified) OVER (), 0) AS weight_normalized
    FROM solargpt.v_zip_kpis
    WHERE lat_avg BETWEEN ${latMin} AND ${latMax}
      AND lng_avg BETWEEN ${lngMin} AND ${lngMax}
      AND lat_avg IS NOT NULL AND lng_avg IS NOT NULL
    LIMIT 5000
  `
  return rows.map(r => ({
    lat: Number((r as { lat_avg: number }).lat_avg),
    lng: Number((r as { lng_avg: number }).lng_avg),
    // TODO: tune weight formula after visual review — may want LOG(count_qualified) to compress dense outliers like NYC
    weight: Number((r as { weight_normalized: number }).weight_normalized),
  }))
}

export async function getTopCounties(limit = 8): Promise<CountyKpi[]> {
  const rows = await sql`
    SELECT v.id, v.region_name, v.state_name, v.cambium_gea,
      v.lat_avg, v.lng_avg, v.lat_min, v.lat_max, v.lng_min, v.lng_max,
      v.count_qualified, v.existing_installs_count, v.untapped_annual_value_usd,
      v.untapped_lifetime_value_usd, v.adoption_rate_pct, v.sunlight_grade, v.sunlight_stars,
      v.untapped_buildings, v.untapped_pct, v.kw_total, v.kw_median,
      v.yearly_sunlight_kwh_total, v.carbon_offset_metric_tons,
      v.total_energy_value_usd_yr, v.untapped_energy_value_usd_yr,
      v.carbon_offset_value_usd_yr, v.untapped_carbon_value_usd_yr,
      v.untapped_install_cost_usd, v.median_annual_kwh_per_roof,
      v.median_annual_savings_usd, v.median_lifetime_savings_usd,
      v.median_install_cost_usd, v.median_payback_years,
      v.cars_off_road_equivalent, v.homes_powered_equivalent,
      v.percent_covered, v.percent_qualified, v.yearly_sunlight_kwh_kw_threshold_avg,
      c.seal_url
    FROM solargpt.v_county_kpis v
    LEFT JOIN solargpt.raw_sunroof_county c USING (id)
    ORDER BY v.untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as CountyKpi[]
}

// ── Dashboard Detail ───────────────────────────────────────────────────────────

export type DashboardTableRow = {
  id: string
  name: string
  value: number
  changePct: number | null
  sharePct: number
  hasChildren: boolean
}

function toRows(
  raw: unknown[],
  hasChildren: boolean,
): DashboardTableRow[] {
  return (raw as { name: string; value: unknown; share_pct: unknown }[]).map(r => ({
    id: r.name,
    name: r.name,
    value: Number(r.value ?? 0),
    changePct: null,
    sharePct: Math.min(Number(r.share_pct ?? 0), 100),
    hasChildren,
  }))
}

function toGeaRows(
  raw: unknown[],
  hasChildren: boolean,
): DashboardTableRow[] {
  return (raw as { name: string; value: unknown; share_pct: unknown }[]).map(r => ({
    id: r.name,
    name: fmtGea(r.name),
    value: Number(r.value ?? 0),
    changePct: null,
    sharePct: Math.min(Number(r.share_pct ?? 0), 100),
    hasChildren,
  }))
}

// ── State rows ──────────────────────────────────────────────────────────────

export async function getDashboardStateRows(metric: string): Promise<DashboardTableRow[]> {
  switch (metric) {
    case 'untapped_annual_value_usd': {
      const r = await sql`SELECT state_name AS name, untapped_annual_value_usd AS value, untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE untapped_annual_value_usd IS NOT NULL ORDER BY untapped_annual_value_usd DESC`
      return toRows(r as unknown[], true)
    }
    case 'adoption_rate_pct': {
      const r = await sql`SELECT state_name AS name, adoption_rate_pct AS value, adoption_rate_pct*100.0/NULLIF(SUM(adoption_rate_pct)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE adoption_rate_pct IS NOT NULL ORDER BY adoption_rate_pct DESC`
      return toRows(r as unknown[], true)
    }
    case 'count_qualified': {
      const r = await sql`SELECT state_name AS name, count_qualified AS value, count_qualified*100.0/NULLIF(SUM(count_qualified)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE count_qualified IS NOT NULL ORDER BY count_qualified DESC`
      return toRows(r as unknown[], true)
    }
    case 'existing_installs_count': {
      const r = await sql`SELECT state_name AS name, existing_installs_count AS value, existing_installs_count*100.0/NULLIF(SUM(existing_installs_count)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE existing_installs_count IS NOT NULL ORDER BY existing_installs_count DESC`
      return toRows(r as unknown[], true)
    }
    case 'carbon_offset_metric_tons': {
      const r = await sql`SELECT state_name AS name, carbon_offset_metric_tons AS value, carbon_offset_metric_tons*100.0/NULLIF(SUM(carbon_offset_metric_tons)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE carbon_offset_metric_tons IS NOT NULL ORDER BY carbon_offset_metric_tons DESC`
      return toRows(r as unknown[], true)
    }
    case 'untapped_lifetime_value_usd': {
      const r = await sql`SELECT state_name AS name, untapped_lifetime_value_usd AS value, untapped_lifetime_value_usd*100.0/NULLIF(SUM(untapped_lifetime_value_usd)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE untapped_lifetime_value_usd IS NOT NULL ORDER BY untapped_lifetime_value_usd DESC`
      return toRows(r as unknown[], true)
    }
    default: return []
  }
}

// ── GEA rows ────────────────────────────────────────────────────────────────

export async function getDashboardGeaRows(metric: string): Promise<DashboardTableRow[]> {
  switch (metric) {
    case 'untapped_annual_value_usd': {
      const r = await sql`SELECT cambium_gea AS name, untapped_annual_value_usd AS value, untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE untapped_annual_value_usd IS NOT NULL ORDER BY untapped_annual_value_usd DESC`
      return toGeaRows(r as unknown[], true)
    }
    case 'adoption_rate_pct': {
      const r = await sql`SELECT cambium_gea AS name, adoption_rate_pct AS value, adoption_rate_pct*100.0/NULLIF(SUM(adoption_rate_pct)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE adoption_rate_pct IS NOT NULL ORDER BY adoption_rate_pct DESC`
      return toGeaRows(r as unknown[], true)
    }
    case 'count_qualified': {
      const r = await sql`SELECT cambium_gea AS name, count_qualified AS value, count_qualified*100.0/NULLIF(SUM(count_qualified)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE count_qualified IS NOT NULL ORDER BY count_qualified DESC`
      return toGeaRows(r as unknown[], true)
    }
    case 'existing_installs_count': {
      const r = await sql`SELECT cambium_gea AS name, existing_installs_count AS value, existing_installs_count*100.0/NULLIF(SUM(existing_installs_count)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE existing_installs_count IS NOT NULL ORDER BY existing_installs_count DESC`
      return toGeaRows(r as unknown[], true)
    }
    case 'untapped_lifetime_value_usd': {
      const r = await sql`SELECT cambium_gea AS name, untapped_lifetime_value_usd AS value, untapped_lifetime_value_usd*100.0/NULLIF(SUM(untapped_lifetime_value_usd)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE untapped_lifetime_value_usd IS NOT NULL ORDER BY untapped_lifetime_value_usd DESC`
      return toGeaRows(r as unknown[], true)
    }
    case 'cost_per_mwh': {
      const r = await sql`SELECT cambium_gea AS name, cost_per_mwh AS value, cost_per_mwh*100.0/NULLIF(SUM(cost_per_mwh)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE cost_per_mwh IS NOT NULL ORDER BY cost_per_mwh DESC`
      return toGeaRows(r as unknown[], false)
    }
    case 'lrmer_co2_per_mwh': {
      const r = await sql`SELECT cambium_gea AS name, lrmer_co2_per_mwh AS value, lrmer_co2_per_mwh*100.0/NULLIF(SUM(lrmer_co2_per_mwh)OVER(),0) AS share_pct FROM solargpt.v_gea_kpis WHERE lrmer_co2_per_mwh IS NOT NULL ORDER BY lrmer_co2_per_mwh DESC`
      return toGeaRows(r as unknown[], false)
    }
    default: return []
  }
}

// ── Grade rows (grouped by grade from v_state_kpis) ─────────────────────────

export async function getDashboardGradeRows(metric: string, agg: 'sum' | 'avg' = 'sum'): Promise<DashboardTableRow[]> {
  switch (`${agg}:${metric}`) {
    case 'sum:untapped_annual_value_usd': {
      const r = await sql`SELECT sunlight_grade AS name, SUM(untapped_annual_value_usd) AS value, SUM(untapped_annual_value_usd)*100.0/NULLIF(SUM(SUM(untapped_annual_value_usd))OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE untapped_annual_value_usd IS NOT NULL GROUP BY sunlight_grade ORDER BY value DESC`
      return toRows(r as unknown[], true)
    }
    case 'avg:adoption_rate_pct': {
      const r = await sql`SELECT sunlight_grade AS name, AVG(adoption_rate_pct) AS value, AVG(adoption_rate_pct)*100.0/NULLIF(SUM(AVG(adoption_rate_pct))OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE adoption_rate_pct IS NOT NULL GROUP BY sunlight_grade ORDER BY value DESC`
      return toRows(r as unknown[], true)
    }
    case 'sum:count_qualified': {
      const r = await sql`SELECT sunlight_grade AS name, SUM(count_qualified) AS value, SUM(count_qualified)*100.0/NULLIF(SUM(SUM(count_qualified))OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE count_qualified IS NOT NULL GROUP BY sunlight_grade ORDER BY value DESC`
      return toRows(r as unknown[], true)
    }
    case 'sum:carbon_offset_metric_tons': {
      const r = await sql`SELECT sunlight_grade AS name, SUM(carbon_offset_metric_tons) AS value, SUM(carbon_offset_metric_tons)*100.0/NULLIF(SUM(SUM(carbon_offset_metric_tons))OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE carbon_offset_metric_tons IS NOT NULL GROUP BY sunlight_grade ORDER BY value DESC`
      return toRows(r as unknown[], true)
    }
    case 'sum:untapped_lifetime_value_usd': {
      const r = await sql`SELECT sunlight_grade AS name, SUM(untapped_lifetime_value_usd) AS value, SUM(untapped_lifetime_value_usd)*100.0/NULLIF(SUM(SUM(untapped_lifetime_value_usd))OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE untapped_lifetime_value_usd IS NOT NULL GROUP BY sunlight_grade ORDER BY value DESC`
      return toRows(r as unknown[], true)
    }
    default: return []
  }
}

// ── Top N rows ───────────────────────────────────────────────────────────────

export async function getDashboardCountyRows(limit = 20): Promise<DashboardTableRow[]> {
  const r = await sql`
    SELECT (region_name||', '||state_name) AS name, untapped_annual_value_usd AS value,
      untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct
    FROM solargpt.v_county_kpis ORDER BY untapped_annual_value_usd DESC LIMIT ${limit}`
  return toRows(r as unknown[], false)
}

export async function getDashboardCityRows(limit = 20): Promise<DashboardTableRow[]> {
  const r = await sql`
    SELECT (region_name||', '||state_name) AS name, untapped_annual_value_usd AS value,
      untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct
    FROM solargpt.v_city_kpis ORDER BY untapped_annual_value_usd DESC LIMIT ${limit}`
  return toRows(r as unknown[], false)
}

// ── Drill-down child rows ────────────────────────────────────────────────────

export async function getDashboardCountyChildRows(stateName: string, metric: string): Promise<DashboardTableRow[]> {
  switch (metric) {
    case 'untapped_annual_value_usd': {
      const r = await sql`SELECT region_name AS name, untapped_annual_value_usd AS value, untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND untapped_annual_value_usd IS NOT NULL ORDER BY untapped_annual_value_usd DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    case 'adoption_rate_pct': {
      const r = await sql`SELECT region_name AS name, adoption_rate_pct AS value, adoption_rate_pct*100.0/NULLIF(SUM(adoption_rate_pct)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND adoption_rate_pct IS NOT NULL ORDER BY adoption_rate_pct DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    case 'count_qualified': {
      const r = await sql`SELECT region_name AS name, count_qualified AS value, count_qualified*100.0/NULLIF(SUM(count_qualified)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND count_qualified IS NOT NULL ORDER BY count_qualified DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    case 'existing_installs_count': {
      const r = await sql`SELECT region_name AS name, existing_installs_count AS value, existing_installs_count*100.0/NULLIF(SUM(existing_installs_count)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND existing_installs_count IS NOT NULL ORDER BY existing_installs_count DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    case 'carbon_offset_metric_tons': {
      const r = await sql`SELECT region_name AS name, carbon_offset_metric_tons AS value, carbon_offset_metric_tons*100.0/NULLIF(SUM(carbon_offset_metric_tons)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND carbon_offset_metric_tons IS NOT NULL ORDER BY carbon_offset_metric_tons DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    case 'untapped_lifetime_value_usd': {
      const r = await sql`SELECT region_name AS name, untapped_lifetime_value_usd AS value, untapped_lifetime_value_usd*100.0/NULLIF(SUM(untapped_lifetime_value_usd)OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE state_name=${stateName} AND untapped_lifetime_value_usd IS NOT NULL ORDER BY untapped_lifetime_value_usd DESC LIMIT 20`
      return toRows(r as unknown[], false)
    }
    default: return []
  }
}

export async function getDashboardCityChildRows(stateName: string): Promise<DashboardTableRow[]> {
  const r = await sql`SELECT region_name AS name, untapped_annual_value_usd AS value, untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct FROM solargpt.v_city_kpis WHERE state_name=${stateName} ORDER BY untapped_annual_value_usd DESC LIMIT 20`
  return toRows(r as unknown[], false)
}

export async function getDashboardStateInGeaRows(gea: string, metric: string): Promise<DashboardTableRow[]> {
  switch (metric) {
    case 'untapped_annual_value_usd': {
      const r = await sql`SELECT state_name AS name, SUM(untapped_annual_value_usd) AS value, SUM(untapped_annual_value_usd)*100.0/NULLIF(SUM(SUM(untapped_annual_value_usd))OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE cambium_gea=${gea} AND untapped_annual_value_usd IS NOT NULL GROUP BY state_name ORDER BY value DESC`
      return toRows(r as unknown[], false)
    }
    case 'adoption_rate_pct': {
      const r = await sql`SELECT state_name AS name, AVG(adoption_rate_pct) AS value, AVG(adoption_rate_pct)*100.0/NULLIF(SUM(AVG(adoption_rate_pct))OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE cambium_gea=${gea} AND adoption_rate_pct IS NOT NULL GROUP BY state_name ORDER BY value DESC`
      return toRows(r as unknown[], false)
    }
    case 'count_qualified': {
      const r = await sql`SELECT state_name AS name, SUM(count_qualified) AS value, SUM(count_qualified)*100.0/NULLIF(SUM(SUM(count_qualified))OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE cambium_gea=${gea} AND count_qualified IS NOT NULL GROUP BY state_name ORDER BY value DESC`
      return toRows(r as unknown[], false)
    }
    case 'existing_installs_count': {
      const r = await sql`SELECT state_name AS name, SUM(existing_installs_count) AS value, SUM(existing_installs_count)*100.0/NULLIF(SUM(SUM(existing_installs_count))OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE cambium_gea=${gea} AND existing_installs_count IS NOT NULL GROUP BY state_name ORDER BY value DESC`
      return toRows(r as unknown[], false)
    }
    case 'untapped_lifetime_value_usd': {
      const r = await sql`SELECT state_name AS name, SUM(untapped_lifetime_value_usd) AS value, SUM(untapped_lifetime_value_usd)*100.0/NULLIF(SUM(SUM(untapped_lifetime_value_usd))OVER(),0) AS share_pct FROM solargpt.v_county_kpis WHERE cambium_gea=${gea} AND untapped_lifetime_value_usd IS NOT NULL GROUP BY state_name ORDER BY value DESC`
      return toRows(r as unknown[], false)
    }
    default: return []
  }
}

export async function getDashboardStateInGradeRows(grade: string, metric: string): Promise<DashboardTableRow[]> {
  switch (metric) {
    case 'untapped_annual_value_usd': {
      const r = await sql`SELECT state_name AS name, untapped_annual_value_usd AS value, untapped_annual_value_usd*100.0/NULLIF(SUM(untapped_annual_value_usd)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE sunlight_grade=${grade} AND untapped_annual_value_usd IS NOT NULL ORDER BY untapped_annual_value_usd DESC`
      return toRows(r as unknown[], false)
    }
    case 'adoption_rate_pct': {
      const r = await sql`SELECT state_name AS name, adoption_rate_pct AS value, adoption_rate_pct*100.0/NULLIF(SUM(adoption_rate_pct)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE sunlight_grade=${grade} AND adoption_rate_pct IS NOT NULL ORDER BY adoption_rate_pct DESC`
      return toRows(r as unknown[], false)
    }
    case 'count_qualified': {
      const r = await sql`SELECT state_name AS name, count_qualified AS value, count_qualified*100.0/NULLIF(SUM(count_qualified)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE sunlight_grade=${grade} AND count_qualified IS NOT NULL ORDER BY count_qualified DESC`
      return toRows(r as unknown[], false)
    }
    case 'carbon_offset_metric_tons': {
      const r = await sql`SELECT state_name AS name, carbon_offset_metric_tons AS value, carbon_offset_metric_tons*100.0/NULLIF(SUM(carbon_offset_metric_tons)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE sunlight_grade=${grade} AND carbon_offset_metric_tons IS NOT NULL ORDER BY carbon_offset_metric_tons DESC`
      return toRows(r as unknown[], false)
    }
    case 'untapped_lifetime_value_usd': {
      const r = await sql`SELECT state_name AS name, untapped_lifetime_value_usd AS value, untapped_lifetime_value_usd*100.0/NULLIF(SUM(untapped_lifetime_value_usd)OVER(),0) AS share_pct FROM solargpt.v_state_kpis WHERE sunlight_grade=${grade} AND untapped_lifetime_value_usd IS NOT NULL ORDER BY untapped_lifetime_value_usd DESC`
      return toRows(r as unknown[], false)
    }
    default: return []
  }
}

// ── Header totals ────────────────────────────────────────────────────────────

export async function getDashboardHeaderTotal(slug: string): Promise<number> {
  try {
    switch (slug) {
      case 'untapped-value': {
        const r = await sql`SELECT SUM(untapped_annual_value_usd) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'adoption-rate': {
        const r = await sql`SELECT AVG(adoption_rate_pct) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'sunlight-grade': {
        const r = await sql`SELECT COUNT(*) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'existing-installs': {
        const r = await sql`SELECT SUM(existing_installs_count) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'top-counties': {
        const r = await sql`SELECT SUM(untapped_annual_value_usd) AS v FROM (SELECT untapped_annual_value_usd FROM solargpt.v_county_kpis ORDER BY untapped_annual_value_usd DESC LIMIT 20) t`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'top-cities': {
        const r = await sql`SELECT SUM(untapped_annual_value_usd) AS v FROM (SELECT untapped_annual_value_usd FROM solargpt.v_city_kpis ORDER BY untapped_annual_value_usd DESC LIMIT 20) t`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'marginal-cost': {
        const r = await sql`SELECT AVG(cost_per_mwh) AS v FROM solargpt.v_gea_kpis WHERE cost_per_mwh IS NOT NULL`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'emissions-intensity': {
        const r = await sql`SELECT AVG(lrmer_co2_per_mwh) AS v FROM solargpt.v_gea_kpis WHERE lrmer_co2_per_mwh IS NOT NULL`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'carbon-offset': {
        const r = await sql`SELECT SUM(carbon_offset_metric_tons) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'qualified-buildings': {
        const r = await sql`SELECT SUM(count_qualified) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      case 'lifetime-value': {
        const r = await sql`SELECT SUM(untapped_lifetime_value_usd) AS v FROM solargpt.v_state_kpis`
        return Number((r[0] as { v: unknown }).v ?? 0)
      }
      default: return 0
    }
  } catch { return 0 }
}
