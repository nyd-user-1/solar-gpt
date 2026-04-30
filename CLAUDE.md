# SolarGPT — Claude Code Project Guide

## Project Overview
SolarGPT is a solar lead generation and market intelligence platform. It uses Google Solar API + NREL Cambium data to provide property-level solar analysis, a GEA choropleth market map, and an AI chat assistant. Production: **solar.nysgpt.com** (Vercel). Repo: **nyd-user-1/solar-gpt**.

## Stack
- **Next.js 15** App Router · **TypeScript** · **Tailwind v4** · **Neon Postgres**
- **NextAuth v5 beta** (magic link via Resend, `@auth/pg-adapter`)
- **OpenAI GPT-4o-mini** (streaming chat)
- **Google Maps JS API** + **Solar API** + Places API
- **`@vis.gl/react-google-maps`** v1.8.x — `APIProvider`, `Map`, `useMap()`
- **`geotiff`** v3.0.5 — GeoTIFF decode in browser
- Google Cloud project: **i-incentive-494503-q7**

## Deployment
- **Netlify** → sandbox/preview (auto-deploys on push to main — QuoteTorch only)
- **Vercel** → production at solar.nysgpt.com (SolarGPT). Push branch → Vercel preview; promote manually.
- After completing a working feature: commit → push → Vercel preview → promote to main.

## Database (Neon Postgres — `solargpt.*` schema)
- Raw tables: `raw_sunroof_state/county/city/postal_code`, `raw_cambium_county_mapping`
- KPI views: `v_state_kpis`, `v_county_kpis`, `v_city_kpis`, `v_zip_kpis`, `v_gea_kpis`
- Lead/app tables: `solar_leads`, `solar_quotes`, `app_settings`, `gea_assets`
- User tables: `solargpt.users`, `solargpt.chats`, `solargpt.messages`
- Cambium: `raw_cambium_gea_metrics`, `raw_cambium_annual_costs`, `raw_cambium_annual_lrmer`
- **Gotcha:** Cambium DB columns return numeric values as **strings** — always wrap in `Number(v)` before `.toFixed()` or math.

## Key API Routes
| Route | Purpose |
|---|---|
| `GET /api/solar` | buildingInsights proxy → returns `SolarInsight` (sunshine, roof area, panels, kW, savings, payback, yearlyEnergyKwh) |
| `GET /api/solar-layers` | dataLayers proxy → returns annualFluxUrl, monthlyFluxUrl, dsmUrl, imageryQuality. Uses `pixelSizeMeters=0.5` for fast download (~400×400 px) |
| `GET /api/solar-geotiff` | Legacy GeoTIFF proxy (kept but Solar API GeoTIFFs now fetched direct from browser — CORS supported) |
| `GET /api/places`, `/api/places/geocode` | Google Places autocomplete + geocode |
| `GET /api/gea/[slug]` | GEA detail: kpis + cambiumMetrics + topCounties |
| `GET /api/county-detail` | County detail: kpis + cambiumMetrics + topZips |

## Solar API — Critical Implementation Notes

### GeoTIFF Bounds
Solar API GeoTIFFs may NOT be in WGS84. The reference app uses `geotiff-geokeys-to-proj4` + `proj4` to reproject `image.getBoundingBox()` to lat/lon. Current implementation uses `image.getBoundingBox()` directly — verify correctness per address. See `docs/solar-api-reference.md` for the canonical TypeScript reprojection approach.

### GeoTIFF URLs expire after 1 hour
Re-fetch `/api/solar-layers` if GeoTIFF URLs have aged out. Never cache layer URLs across sessions.

### boundingBox comes from buildingInsights, not dataLayers
`dataLayers:get` response does NOT include `boundingBox`. Use `buildingInsightsResponse.boundingBox` for building footprint bounds.

### Financial analysis
`financialAnalyses` is indexed by `monthlyBill`. Find the entry closest to the user's actual bill. Each entry has `cashPurchaseSavings`, `leasingSavings`, `financedPurchaseSavings`, and `financialDetails` (solarPercentage, percentageExportedToGrid, costOfElectricityWithoutSolar). See `docs/solar-api-reference.md` for full calculation methodology.

### Imagery quality
- `HIGH`: 0.1 m/pixel aerial
- `MEDIUM`: 0.25 m/pixel enhanced aerial
- `BASE`: 0.25 m/pixel satellite (use `requiredQuality=LOW` or `BASE` in requests to avoid 404s)
- For expanded coverage (Colombia, Brazil, Peru, Puerto Rico): add `experiments=EXPANDED_COVERAGE`

## UI Patterns
- **AccordionSection + KpiRow**: `rounded-xl border border-[var(--border)]` card, chevron toggle, `grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t`
- **Side panels portal** into `#chat-panel-root` — a `div.flex.shrink-0` OUTSIDE the main rounded card in AppLayout. This pushes the main container (not overlay).
- GEA/County drawer uses `sm:ml-[18px]` on the panel div.
- `fmtUsdFull()` for large dollar amounts.
- CSS vars: `--border`, `--surface`, `--inp-bg`, `--txt`, `--muted`, `--muted2`

## Pages
| Page | Description |
|---|---|
| `/new-chat` | AI chat with Google Places address mode → SolarAddressDrawer → /solar-report |
| `/solar-report` | Full-screen satellite map + SolarFluxOverlay heatmap + side panel |
| `/grid` | GEA choropleth (county-level Cambium coloring) + GEADrawer |
| `/gea-regions/[slug]` | GEA detail page with county map |
| `/states`, `/counties`, `/cities`, `/zips`, `/gea-regions` | Geographic browse |
| `/free-quote` | 10-step quote form → `/quote/[token]` |
| `/leads`, `/leads/[id]` | Lead management |
| `/admin` | Background color picker (brendan@nysgpt.com only) |

## Build & Quality
- Always run `npm run build` (not `tsc --noEmit`) before pushing.
- Auth types: `next-auth@5.0.0-beta.31` providers require `src/types/next-auth.d.ts` ambient declaration (exports map doesn't expose providers).
- After build passes: `git add` specific files, commit with Co-Author line, push.

## Solar API Reference
See `docs/solar-api-reference.md` for the full API documentation including:
- Complete TypeScript type definitions
- Financial calculation formulas
- GeoTIFF layer specifications
- Visualization helper functions (renderRGB, renderPalette, createPalette)
