export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { getCitiesByState, nameToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function CitiesPage() {
  const cities = await getCitiesByState('New York', 200)

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Cities & Towns</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Top {cities.length} New York cities by solar opportunity</p>
      </div>

      <div className="px-6 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map(city => (
          <Link
            key={city.id}
            href={`/cities/${nameToSlug(city.region_name)}`}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-[var(--txt)]">{city.region_name}</p>
                <p className="text-xs text-[var(--muted)]">{city.state_name} · Grade {city.sunlight_grade}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
              <div>
                <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Untapped/yr</p>
                <p className="text-lg font-bold text-[var(--txt)]">{fmtUsd(city.untapped_annual_value_usd)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Buildings</p>
                <p className="text-lg font-bold text-solar">{fmtNum(city.count_qualified)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
