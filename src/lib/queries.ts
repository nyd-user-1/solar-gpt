import { sql } from './db'

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
    SELECT id, region_name, state_name, cambium_gea,
           untapped_annual_value_usd, adoption_rate_pct, sunlight_grade, sunlight_stars,
           seal_url
    FROM solargpt.v_county_kpis ORDER BY untapped_annual_value_usd DESC
  `
  return rows as CountyKpi[]
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

// ── City ──────────────────────────────────────────────────────────────────────
export async function getAllCities(): Promise<CityKpi[]> {
  const rows = await sql`SELECT id, region_name, state_name FROM solargpt.v_city_kpis ORDER BY region_name`
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
  const rows = await sql`SELECT id, zip_code, state_name FROM solargpt.v_zip_kpis ORDER BY zip_code`
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
    SELECT id, state_name, lat_avg, lng_avg, lat_min, lat_max, lng_min, lng_max,
      count_qualified, existing_installs_count, untapped_annual_value_usd,
      untapped_lifetime_value_usd, adoption_rate_pct, median_payback_years,
      median_annual_savings_usd, median_install_cost_usd, cars_off_road_equivalent,
      homes_powered_equivalent, sunlight_grade, sunlight_stars,
      untapped_buildings, untapped_pct, kw_total, kw_median,
      yearly_sunlight_kwh_total, carbon_offset_metric_tons,
      total_energy_value_usd_yr, untapped_energy_value_usd_yr,
      carbon_offset_value_usd_yr, untapped_carbon_value_usd_yr,
      untapped_install_cost_usd, median_annual_kwh_per_roof,
      median_lifetime_savings_usd, percent_covered, percent_qualified,
      yearly_sunlight_kwh_kw_threshold_avg, region_name
    FROM solargpt.v_state_kpis
    ORDER BY untapped_annual_value_usd DESC
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
    SELECT id, region_name, state_name, cambium_gea,
      lat_avg, lng_avg, lat_min, lat_max, lng_min, lng_max,
      count_qualified, existing_installs_count, untapped_annual_value_usd,
      untapped_lifetime_value_usd, adoption_rate_pct, sunlight_grade, sunlight_stars,
      untapped_buildings, untapped_pct, kw_total, kw_median,
      yearly_sunlight_kwh_total, carbon_offset_metric_tons,
      total_energy_value_usd_yr, untapped_energy_value_usd_yr,
      carbon_offset_value_usd_yr, untapped_carbon_value_usd_yr,
      untapped_install_cost_usd, median_annual_kwh_per_roof,
      median_annual_savings_usd, median_lifetime_savings_usd,
      median_install_cost_usd, median_payback_years,
      cars_off_road_equivalent, homes_powered_equivalent,
      percent_covered, percent_qualified, yearly_sunlight_kwh_kw_threshold_avg,
      seal_url
    FROM solargpt.v_county_kpis
    ORDER BY untapped_annual_value_usd DESC
    LIMIT ${limit}
  `
  return rows as CountyKpi[]
}
