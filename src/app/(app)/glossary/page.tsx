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
