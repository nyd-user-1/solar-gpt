import Link from 'next/link'

const ENTRIES = [
  {
    anchor: 'suitable-bldgs',
    title: 'Suitable Buildings',
    definition: 'The number of buildings in a region whose rooftops are geometrically and physically suitable for solar panel installation. Sunroof evaluates shade patterns, roof orientation, roof area, and local sun angle to determine suitability.',
    source: 'Project Sunroof (Google)',
    caveats: 'Coverage varies by region — Sunroof has analyzed most U.S. rooftops but not all. Regions with lower % Covered will have underrepresented counts.',
  },
  {
    anchor: 'pct-covered',
    title: '% Covered',
    definition: 'The share of buildings in a region for which Project Sunroof has collected satellite imagery and completed a rooftop analysis. A high % Covered means the Suitable Buildings count is comprehensive; a lower value means some buildings were not analyzed.',
    source: 'Project Sunroof (Google)',
    caveats: 'Dense urban areas and some rural counties may have lower coverage. If coverage is below 50%, treat the other metrics with caution.',
  },
  {
    anchor: 'pct-qualified',
    title: '% Qualified',
    definition: 'Of the buildings that Sunroof has analyzed (% Covered), the share whose rooftops are classified as viable for solar installation. A building is "qualified" if it has enough unshaded area in a favorable orientation to host at least one panel.',
    source: 'Project Sunroof (Google)',
    caveats: 'Dense urban environments with shading from tall buildings tend to have lower qualification rates.',
  },
  {
    anchor: 'kwh-total',
    title: 'kWh Total',
    definition: 'The total annual electricity generation potential across all qualified rooftops in the region, measured in kilowatt-hours per year. This represents the maximum theoretical output if every viable rooftop were fully outfitted with solar panels.',
    source: 'Project Sunroof (Google)',
    caveats: 'This is a theoretical maximum and does not account for financial constraints, property ownership, or permitting barriers.',
  },
  {
    anchor: 'total-panels',
    title: 'Total Panels',
    definition: 'The total number of standard solar panels that could physically fit across all qualified rooftops in the region, given typical panel dimensions and spacing requirements.',
    source: 'Project Sunroof (Google)',
    caveats: 'Based on a standard panel size assumption. Actual installations may use different panel sizes or layouts.',
  },
  {
    anchor: 'co2-offset',
    title: 'CO₂ Offset',
    definition: 'The metric tons of carbon dioxide emissions that would be avoided per year if every qualified rooftop in the region were converted to solar. Calculated using regional grid emission intensity factors.',
    source: 'Derived from Project Sunroof + NREL Cambium grid data',
    caveats: 'The offset depends on the local grid mix. Regions with cleaner grids (more hydro, wind, or nuclear) will show lower per-kWh offsets because the baseline emissions are already lower.',
  },
  {
    anchor: 'avg-panels',
    title: 'Avg. Panels',
    definition: 'The median number of solar panels that would fit on a qualified rooftop in this region. The median is used rather than the mean to avoid distortion from unusually large commercial rooftops.',
    source: 'Project Sunroof (Google)',
    caveats: 'Residential rooftops are typically 20–30 panels. Values much higher than that suggest a mix of commercial properties in the analysis.',
  },
  {
    anchor: 'kw-total',
    title: 'kW Total',
    definition: 'The combined nameplate generating capacity, in kilowatts (kW), of all the solar systems that could be installed across every qualified rooftop in the region. Also expressed as MW or GW for large regions.',
    source: 'Project Sunroof (Google)',
    caveats: 'Nameplate capacity is the rated peak output under ideal conditions (STC). Real-world generation will be lower depending on weather, shading, and inverter losses.',
  },
  {
    anchor: 'kw-median',
    title: 'kW Median',
    definition: 'The median system size, in kilowatts, for a single qualified building in this region. This is a useful proxy for the "typical" solar installation size a homeowner or small business in the region could install.',
    source: 'Project Sunroof (Google)',
    caveats: 'Larger homes, older construction, and sunnier climates tend to support larger systems. Compare this value across regions to understand relative system sizing.',
  },
  {
    anchor: 'existing-installs',
    title: 'Existing Installs',
    definition: 'The number of solar systems that are already installed and operating in the region, based on permit data, utility interconnection records, and other administrative sources aggregated by Project Sunroof.',
    source: 'Project Sunroof (Google)',
    caveats: 'May lag real-world installations by 6–18 months depending on data refresh cycles. Some jurisdictions have incomplete permitting records.',
  },
  {
    anchor: 'solar-irradiance',
    title: 'Solar Irradiance',
    definition: 'Solar irradiance is the amount of light (electromagnetic energy) that falls on a given surface area at a given moment. It is measured in kilowatts (kW) — a unit of power, or the rate of energy delivery. A surface exposed to peak sunlight receives roughly 1 kW of irradiance per square meter. Irradiance varies continuously with cloud cover, time of day, season, and geographic latitude.',
    source: 'Google Solar API · National Renewable Energy Laboratory (NREL)',
    caveats: 'Irradiance is an instantaneous measurement. What matters for solar energy generation is how much irradiance accumulates over time — that is solar insolation. The two terms are often confused but describe different quantities.',
  },
  {
    anchor: 'solar-insolation',
    title: 'Solar Insolation',
    definition: 'Solar insolation is the average solar irradiance an area receives over a period of time, expressed in kilowatt-hours per kilowatt (kWh/kW) — or equivalently, in "sun hours." While irradiance tells you how intense the sunlight is right now, insolation tells you the total usable sunlight over a year. A roof with 1,614 kWh/kW/year of insolation will produce 1,614 kWh of electricity per year for every 1 kW of solar panels installed on it. A 10 kW system at the same location would produce roughly 16,140 kWh/year.',
    source: 'Google Solar API · NREL PVWatts',
    caveats: 'Insolation figures account for cloud cover and weather patterns but assume optimal conditions otherwise. Real-world output is further reduced by inverter efficiency (~96%), wiring losses, soiling, and temperature. A commonly applied de-rating factor is 80–85% of the nameplate DC rating.',
  },
  {
    anchor: 'sun-hour',
    title: 'Sun Hour',
    definition: 'A sun hour (also written as a "peak sun hour") is defined as one hour in which the intensity of sunlight averages 1,000 Watts (1 kilowatt) of energy per square meter. 1 kWh/kW of insolation equals exactly 1 sun hour. Sun hours are the most intuitive way to communicate a location\'s solar productivity: a city with 5 sun hours per day will produce 5 kWh per day from a 1 kW panel array, or 50 kWh per day from a 10 kW system, before system losses.',
    source: 'Google Solar API · NREL Solar Resource Data',
    caveats: 'Sun hours are a daily or annual average — actual hourly output swings dramatically with weather. The SolarGPT "Sunshine hours/year" figure is the Google Solar API\'s calculated annual sun hours for the specific roof analyzed, accounting for its orientation, pitch, and local shading.',
  },
  {
    anchor: 'solar-flux',
    title: 'Solar Flux',
    definition: 'In the Google Solar API, flux is defined as the annual amount of sunlight falling on a roof surface, measured in kWh/kW/year (equivalent to sun hours per year). The API calculates flux for every point on a roof by combining: (1) hourly solar irradiance data from weather datasets on a 4–10 km grid; (2) the computed position of the sun at every hour of the year for that location; (3) shading from nearby trees, buildings, and other roof sections; and (4) the pitch and compass orientation (azimuth) of each roof facet. The result is a spatially detailed map of how much productive sunlight each square foot of a roof receives.',
    source: 'Google Solar API dataLayers endpoint',
    caveats: 'Flux values are independent of panel efficiency — they represent the raw solar energy available, not the electrical output. To estimate electrical production, multiply the flux by the system\'s kilowattage and apply a system efficiency factor (typically 80–85%) to account for inverter losses and other real-world de-ratings. Soiling (dust, pollen) and snow accumulation are not factored into Solar API flux calculations.',
  },
  {
    anchor: 'sunniness',
    title: 'Sunniness & Sunshine Quantiles',
    definition: 'The Google Solar API defines "sunniness" as the relative level of sunlight received by a particular section of a roof compared to the rest of the same roof, averaged annually. Different parts of the same roof can have dramatically different sunniness due to chimneys, dormers, shading from nearby trees, or adjacent buildings. The API reports sunniness as 11 quantile buckets (deciles) — from the darkest 10% to the sunniest 10% of a roof\'s surface area. This lets installers identify which roof facets are worth covering with panels and which are shaded enough to drag down system performance.',
    source: 'Google Solar API buildingInsights endpoint (sunshineQuantiles field)',
    caveats: 'Sunniness is a relative metric within a single building — it does not directly compare roofs across buildings or regions. For cross-property comparison, use the absolute flux or sunshine hours values. A "low sunniness" section on a Phoenix roof may still receive more absolute sunlight than a "high sunniness" section on a Seattle roof.',
  },
  {
    anchor: 'federal-itc',
    title: 'Federal Solar Tax Credit (ITC)',
    definition: 'The Investment Tax Credit (ITC) lets homeowners and businesses deduct 30% of the total cost of a solar energy system directly from their federal income taxes. Enacted as part of the Inflation Reduction Act of 2022, the 30% rate is locked in through 2032, stepping down to 26% in 2033 and 22% in 2034 before expiring for residential installations. On a $33,500 gross system cost, for example, the credit is worth $10,050 — reducing your net cost to $23,450.',
    source: 'U.S. Department of Energy / IRS Form 5695',
    caveats: 'The ITC is non-refundable: if your federal tax liability is less than the credit amount in a given year, you can carry the unused portion forward to future tax years. It applies to the full installed system cost, including equipment, labor, permitting, and battery storage. Consult a tax professional to confirm eligibility for your specific situation.',
  },
  {
    anchor: 'net-metering',
    title: 'Net Metering Credit',
    definition: 'Net metering is a utility billing arrangement that credits solar system owners for excess electricity they export to the grid. When your panels produce more power than your home uses — typically on sunny midday hours — the surplus flows back to the grid and your utility credits your bill, usually at or near the retail electricity rate. At night or on cloudy days, you draw from the grid and those credits offset what you owe, effectively using the grid as a free battery.',
    source: 'State utility commissions / DSIRE (Database of State Incentives for Renewables & Efficiency)',
    caveats: 'Net metering policies differ significantly by state and utility. Some states have shifted to "net billing" or "value of solar" tariffs that compensate exported energy at a wholesale rate lower than retail — reducing the financial benefit. A handful of states have eliminated full retail net metering entirely. Always confirm your utility\'s current compensation rate before sizing your system.',
  },
  {
    anchor: 'state-solar-incentive',
    title: 'State Solar Incentive',
    definition: 'In addition to the federal ITC, most U.S. states offer their own financial incentives to encourage solar adoption. Common programs include: state income tax credits (e.g., New York\'s 25% credit up to $5,000); upfront cash rebates from state energy offices or utilities; sales tax exemptions on solar equipment purchases; and property tax exemptions that prevent the added home value from solar from raising your annual property tax bill. The combination of available programs — and their dollar value — varies widely by state.',
    source: 'DSIRE (dsireusa.org) · State energy offices · Local utility companies',
    caveats: 'State incentive programs are frequently updated, expanded, or discontinued based on legislative budgets. Many programs have annual funding caps and close early when oversubscribed. Verify current availability and eligibility requirements with your state energy office or a licensed solar installer before relying on a specific incentive in your financial calculations.',
  },
]

export default function GlossaryPage() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[var(--txt)] mb-2">Data Glossary</h1>
        <p className="text-[var(--muted)] mb-10">
          Definitions for every metric shown in the solar opportunity tables. All data sourced from{' '}
          <a href="https://sunroof.withgoogle.com" target="_blank" rel="noopener noreferrer" className="text-[var(--solar)] hover:underline">
            Google Project Sunroof
          </a>{' '}
          and NREL Cambium grid emissions data.
        </p>

        <div className="flex gap-10">
          {/* Sidebar */}
          <nav className="hidden lg:block w-48 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Terms</p>
            <ul className="space-y-1 sticky top-6">
              {ENTRIES.map(e => (
                <li key={e.anchor}>
                  <a
                    href={`#${e.anchor}`}
                    className="block text-sm text-[var(--muted)] hover:text-[var(--txt)] hover:translate-x-0.5 transition-all py-0.5"
                  >
                    {e.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main content */}
          <div className="flex-1 space-y-12">
            {ENTRIES.map(e => (
              <section key={e.anchor} id={e.anchor} className="scroll-mt-6">
                <h2 className="text-xl font-bold text-[var(--txt)] mb-3 flex items-center gap-2">
                  {e.title}
                  <a href={`#${e.anchor}`} className="text-[var(--muted)] hover:text-[var(--txt)] text-base font-normal">#</a>
                </h2>
                <p className="text-[var(--muted)] leading-relaxed mb-4">{e.definition}</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-[var(--txt)]">Source: </span>
                    <span className="text-[var(--muted)]">{e.source}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--txt)]">Caveats: </span>
                    <span className="text-[var(--muted)]">{e.caveats}</span>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
