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
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Columns</p>
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
