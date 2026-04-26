# SolarGPT — Project Handoff

**Repo:** https://github.com/nyd-user-1/solar-gpt  
**Production (Vercel):** https://solar-gpt.vercel.app  
**DB:** Neon Postgres — schema `solargpt` (Neon project ID in Vercel env)  
**Stack:** Next.js 15 App Router · React 19 · Tailwind v4 · TypeScript · Neon Postgres

---

## What this app is

SolarGPT is a US rooftop solar analytics dashboard. Data comes from **Google Sunroof** (per-building solar potential) and **NREL Cambium** (grid energy areas / GEA regions). The app lets users browse solar opportunity by state, county, city, ZIP code, and GEA region, manage solar leads, and chat with a solar AI assistant (chat UI shell exists; AI is not wired yet).

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx                    Root layout (metadata, ThemeProvider)
│   ├── globals.css                   CSS variables, Tailwind, dark mode
│   ├── (app)/                        App shell (wrapped by AppLayout)
│   │   ├── layout.tsx                → renders <AppLayout>
│   │   ├── page.tsx                  Dashboard (KPI cards, top states/counties)
│   │   ├── explore/page.tsx          County + GEA cards carousel
│   │   ├── states/page.tsx           States list (client: search, filter, sort)
│   │   ├── states/[slug]/page.tsx    State detail + Google Maps
│   │   ├── counties/page.tsx         Counties list
│   │   ├── counties/[slug]/page.tsx  County detail + map
│   │   ├── cities/page.tsx           Cities list
│   │   ├── cities/[slug]/page.tsx    City detail + map
│   │   ├── zips/page.tsx             ZIP list
│   │   ├── zips/[zip]/page.tsx       ZIP detail + map
│   │   ├── gea-regions/page.tsx      GEA list
│   │   ├── gea-regions/[slug]/page.tsx  GEA detail + map
│   │   ├── leads/page.tsx            Leads list
│   │   ├── leads/new/page.tsx        Create lead form
│   │   ├── leads/[id]/page.tsx       Lead detail
│   │   ├── funds/page.tsx            Funds placeholder
│   │   ├── login/page.tsx            Login/register (not wired to auth)
│   │   ├── new-chat/page.tsx         Chat UI (empty state + chat shell, no AI)
│   │   └── chat-drawer-test/page.tsx Demo page for ChatDrawer portal
│   └── api/
│       └── search/route.ts           GET /api/search?q= → states/counties/GEAs
├── components/
│   ├── AppLayout.tsx                 Main shell: sidebar toggle, top bar, chat portal
│   ├── Sidebar.tsx                   Nav sidebar: search, nav items, account popover
│   ├── SidebarSearch.tsx             Cmd+K search (in sidebar): top states + live search
│   ├── GlobalSearch.tsx              (Unused — replaced by SidebarSearch)
│   ├── ChatDrawer.tsx                Portal-based right-side chat drawer
│   ├── GeoDetailPage.tsx             Shared detail page template (map, info table, nav)
│   ├── RegionMap.tsx                 Google Maps wrapper (fitBounds, AdvancedMarker)
│   └── ui/
│       ├── command.tsx               shadcn Command palette (backed by cmdk)
│       ├── carousel.tsx              Embla carousel
│       ├── button.tsx                Button primitive
│       └── badge.tsx                 Badge primitive
├── hooks/
│   └── useTheme.tsx                  Dark/light mode toggle
└── lib/
    ├── db.ts                         Neon SQL singleton (lazy init)
    ├── utils.ts                      cn(), fmtUsd(), fmtNum()
    └── queries.ts                    All DB queries + TypeScript types
```

---

## Database

**Schema:** `solargpt` in Neon Postgres.

### Views (each has full KPI fields + lat/lng bounds)
| View | Description |
|------|-------------|
| `v_state_kpis` | One row per state — untapped value, installs, adoption %, grade |
| `v_county_kpis` | One row per county — same KPI set |
| `v_city_kpis` | One row per city |
| `v_zip_kpis` | One row per ZIP code |
| `v_gea_kpis` | One row per NREL Cambium GEA region |

All views expose: `lat_avg, lng_avg, lat_min, lat_max, lng_min, lng_max` (for map bounds), `sunlight_grade` (A+ → D), `sunlight_stars` (1–5), `untapped_annual_value_usd`, `untapped_lifetime_value_usd`, `median_payback_years`, etc.

### Raw tables
| Table | Description |
|-------|-------------|
| `raw_sunroof_state` | State metadata (flags etc.) |
| `raw_sunroof_county` | County raw Google Sunroof data |
| `raw_cambium_county_mapping` | GEA → county mapping |

### Query functions in `queries.ts`
- `getStateKpi(slug)`, `getAllStates()`, `getTopStates(limit)`
- `getCountyKpi(slug)`, `getCountiesByState(state)`, `getTopCounties(limit)`, `getExploreCounties()`
- `getCityKpi(slug)`, `getZipKpi(zip)`
- `getGeaKpi(gea)`, `getAllGeas()`, `getCountiesByGea(gea)`
- `getDashboardStats()` — aggregate totals for dashboard KPI cards
- Slug helpers: `nameToSlug(name)`, `slugToName(slug)`, `geaToSlug(gea)`, `geaFromSlug(slug)`

---

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Server-side (Vercel + `.env.local`) | Neon Postgres connection |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side (Vercel + `.env.local`) | Google Maps API |

`.env.local` exists locally (not committed). Both vars are set in Vercel.

---

## Key components

### AppLayout (`src/components/AppLayout.tsx`)
- Sidebar starts **closed** on all screen sizes
- **Sun icon** in main content top-left → opens sidebar → icon hides
- **SolarGPT header button** inside sidebar → closes sidebar
- Chat panel portal: `<div id="chat-panel-root">` sits at the outer flex level (after main content) for ChatDrawer

### Sidebar (`src/components/Sidebar.tsx`)
- Header: Sun+SolarGPT brand button calls `onClose()`
- `SidebarSearch` directly below header
- Nav items: Explore, New Chat, States, Counties, Cities, Leads, Funds, GEA Regions
- Bottom: account popover (desktop), Get Quote button (mobile)
- ProfileDrawer: settings sheet

### SidebarSearch (`src/components/SidebarSearch.tsx`)
- "Search…" button row → opens full-screen Command palette
- Default (empty query): fetches `/api/search?q=` → shows **Top 8 States** by untapped value
- Typed query (≥2 chars): debounced → shows states, counties, GEA regions
- Also triggered by `Cmd+K`

### GeoDetailPage (`src/components/GeoDetailPage.tsx`)
- Shared template for all 5 region types
- Props: `mapCenter`, `mapBounds`, `mapMarkers` (optional) → renders RegionMap at top
- Info table: all KPI fields in a scannable grid
- Breadcrumb, prev/next nav

### RegionMap (`src/components/RegionMap.tsx`)
- `@vis.gl/react-google-maps` — needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `mapTypeId="hybrid"` (satellite) by default
- `fitBounds` called imperatively via `useMap()` hook

### ChatDrawer (`src/components/ChatDrawer.tsx`)
- `createPortal` into `#chat-panel-root`
- Props: `open`, `onClose`, `title?`, `context?`
- Slides in from right on desktop (`sm:w-[380px]`), full-screen on mobile
- Chat UI shell with stub response — **AI not wired**

### `/new-chat` page
- Empty state: Sun icon + suggestion chips
- Chat UI: scrollable messages + sticky textarea input
- **AI not wired** — stub 800ms delay response

---

## Styling system

- **Tailwind v4** — config via `@theme` block in `globals.css`
- **`text-solar`** = `#f97316` (amber orange brand color)
- **CSS variables** (light/dark):
  - `--bg`, `--surface`, `--inp-bg` — backgrounds
  - `--txt`, `--muted`, `--muted2` — text
  - `--border`, `--border2` — borders
- Dark mode: class-based, `ThemeProvider` toggles `.dark` on `<html>`
- All pages use `export const dynamic = 'force-dynamic'` (DB-backed pages)

---

## What's NOT done / next steps

### High priority
- **AI wiring**: `/new-chat` and `ChatDrawer` need real AI. Vercel env vars `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` need to be added. Pattern is in QuoteTorch's `api/chat.ts` (streaming Anthropic).
- **Auth**: Login/register UI exists but no real auth. Sidebar shows "SolarGPT User" placeholder. No session management.
- **`GlobalSearch.tsx`**: Still exists but unused — can be deleted.

### Medium priority
- **Dashboard refinement**: KPI cards + carousels work but could use trend indicators, "vs last period" comparisons
- **Chat history**: `new-chat` page has no persistence — messages lost on navigate
- **ChatDrawer triggers**: No page actually opens `ChatDrawer` yet (only the test page at `/chat-drawer-test`)
- **Leads**: Lead detail, creation form, and list are stubbed/basic

### Lower priority
- **Cities/ZIPs**: Data exists but city/ZIP list pages need search + filter (like StatesClient)
- **Funds page**: Placeholder only
- **Mobile nav**: The mobile category icon row in the sidebar could be tightened

---

## Development

```bash
npm run dev      # start dev server
npm run build    # production build (use as correctness gate — TypeScript strict)
git push         # auto-deploys to Netlify (sandbox)
                 # Vercel (production) is manual deploy
```

Reference projects for patterns:
- **QuoteTorch** (`~/quote-torch`) — SidebarSearch, ChatDrawer portal, AppLayout toggle, streaming AI chat
- **bnlgpt** (`~/bnlgpt`) — similar architecture
