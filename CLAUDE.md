# SolarGPT — Claude Code Project Guide

## Platform Vision
SolarGPT has evolved from a solar lead generation tool into a **total energy analysis platform**. Long-term target: a Data Center Siting Atlas ranking every U.S. county on clean-power economics over a data center's lifetime — combining rooftop solar headroom with NREL Cambium projections through 2050, so hyperscalers and developers can see which sites stay cheap and clean as the grid evolves, and which become stranded assets.

Production: **solar.nysgpt.com** (Vercel). Repo: **nyd-user-1/solar-gpt**.

## Stack
- **Next.js 15** App Router · **TypeScript** · **Tailwind v4** · **Neon Postgres**
- **NextAuth v5 beta** (magic link via Resend, `@auth/pg-adapter`)
- **OpenAI GPT-4o-mini** (streaming chat)
- **Google Maps JS API** + **Solar API** + Places API
- **`@vis.gl/react-google-maps`** v1.8.x — `APIProvider`, `Map`, `useMap()`
- **`geotiff`** v3.0.5 — GeoTIFF decode in browser
- **Recharts** — all charts (BarChart, PieChart, ScatterChart, ComposedChart, AreaChart, LineChart)
- **EIA API** (`EIA_API_KEY` in env) — electricity retail sales, EIA-930 BA hourly, state-specific data, AEO projections 2014–2026, plant-level data
- Google Cloud project: **i-incentive-494503-q7**

## Deployment
- **Vercel** → production at solar.nysgpt.com. Push → Vercel preview; promote manually.
- After completing a working feature: `npm run build` → commit → push.

## Database (Neon Postgres — `solargpt.*` schema)
- Raw tables: `raw_sunroof_state/county/city/postal_code`, `raw_cambium_county_mapping`
- KPI views: `v_state_kpis`, `v_county_kpis`, `v_city_kpis`, `v_zip_kpis`, `v_gea_kpis`
- Lead/app tables: `solar_leads`, `solar_quotes`, `app_settings`, `gea_assets`
- User tables: `solargpt.users`, `solargpt.chats`, `solargpt.messages`
- Cambium: `raw_cambium_gea_metrics`, `raw_cambium_annual_costs`, `raw_cambium_annual_lrmer`
- NYISO queue: `solargpt.raw_nyiso_queue` (97,736 rows, 64 snapshots 2021–2026, ingested via `scripts/nyiso-data/`)
- **Gotcha:** Cambium DB columns return numeric values as **strings** — always wrap in `Number(v)` before `.toFixed()` or math.

## Pages
| Page | Description |
|---|---|
| `/new-chat` | AI chat → SolarAddressDrawer → /solar-report |
| `/solar-report` | Satellite map + SolarFluxOverlay heatmap + side panel |
| `/map` | GEA choropleth (county-level Cambium coloring) + GEADrawer — **was /grid** |
| `/grid` | EIA grid intelligence dashboard — BA monitoring, Retail Rates, Fuel Mix, Load, Renewables, Capacity |
| `/gea-regions/[slug]` | GEA detail with county map |
| `/states`, `/counties`, `/cities`, `/zips`, `/gea-regions` | Geographic browse (list/card + GeoDashboard chart view) |
| `/rooftops` | County-level stacked bar chart with state filter |
| `/interconnection-queue` | NYISO interconnection queue viewer + chart dashboard |
| `/dashboard` | Configurable KPI dashboards |
| `/leads`, `/leads/[id]` | Lead management |
| `/free-quote` | 10-step quote form → `/quote/[token]` |
| `/admin` | Background color picker (brendan@nysgpt.com only) |

## Key API Routes
| Route | Purpose |
|---|---|
| `GET /api/solar` | buildingInsights proxy |
| `GET /api/solar-layers` | dataLayers proxy (annualFluxUrl, monthlyFluxUrl, dsmUrl) |
| `GET /api/solar-geotiff` | GeoTIFF proxy |
| `GET /api/places`, `/api/places/geocode` | Google Places autocomplete + geocode |
| `GET /api/gea/[slug]` | GEA detail: kpis + cambiumMetrics + topCounties |
| `GET /api/county-detail` | County detail: kpis + cambiumMetrics + topZips |

## EIA API — Key Endpoints
Base: `https://api.eia.gov/v2/` (auth via `?api_key=${EIA_API_KEY}`)

| Route | What it gives you |
|---|---|
| `electricity/rto/region-data/data/` | EIA-930: hourly BA demand, net generation, fuel type (~1hr lag) |
| `electricity/retail-sales/data/` | Monthly $/kWh by state + sector (residential/commercial/industrial) |
| `electricity/electric-power-operational-data/data/` | Monthly utility-scale net generation by energy source, state, sector |
| `electricity/state-electricity-profiles/source-disposition/data/` | State-level supply/disposition, net metering, generating capacity |
| `aeo/[year]/data/` | Annual Energy Outlook projections by vintage year (2014–2026) |
| `electricity/facility-fuel/data/` | Plant-level generation by fuel, state, prime mover |

All EIA routes support `frequency`, `start`/`end`, `facets` filtering, and `data[]` field selection. Use `next: { revalidate: 3600 }` for hourly cache on live data, `revalidate: 86400` for daily on monthly data.

## UI Patterns
- **AccordionSection + KpiRow**: `rounded-xl border border-[var(--border)]` card, chevron toggle, `grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t`
- **Side panels** portal into `#chat-panel-root` — a `div.flex.shrink-0` OUTSIDE the main rounded card in AppLayout. Pushes the container, not an overlay.
- **GeoDashboard** — shared 4-chart view for all geo list pages: SolarTopChart + GradeDistPie + TopInstallsChart + AdoptionScatter + KwhPerRoofChart. Chart heights all 280px for consistent row heights.
- **SolarTopChart** — reusable top-15 horizontal bar with 5-metric switcher, scrollable, click-to-navigate.
- **SolarDataTable** — sortable table with ExtraCol support, Grade column, tooltip headers.
- `fmtUsdFull()` for large dollar amounts.
- CSS vars: `--border`, `--surface`, `--inp-bg`, `--txt`, `--muted`, `--muted2`
- Color palette: amber (`#f59e0b` = solar/`bg-solar`) for solar, indigo (`#6366f1`) for grid, emerald (`#10b981`) for renewables

## AppLayout PAGE_TITLES
All pages need an entry in `PAGE_TITLES` in `src/components/AppLayout.tsx` to show the `SolarGPT | PageName` header. Add new routes there when creating new pages.

## Build & Quality
- Always run `npm run build` (not `tsc --noEmit`) before pushing.
- Auth types: `next-auth@5.0.0-beta.31` providers require `src/types/next-auth.d.ts` ambient declaration.
- After build passes: `git add` specific files, commit with Co-Author line, push.

## Solar API Reference
See `docs/solar-api-reference.md` for full Solar API documentation including TypeScript types, financial formulas, GeoTIFF specs, and visualization helpers.
