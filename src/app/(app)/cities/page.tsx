'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { NY_COUNTIES, getCitiesByCounty, type GeoCity } from '@/data/geo'
import { Search, Sun, Building2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CitiesPage() {
  const [query, setQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [countyOpen, setCountyOpen] = useState(false)

  const allCities = useMemo(() => {
    const list: GeoCity[] = []
    for (const county of NY_COUNTIES) {
      list.push(...getCitiesByCounty(county.slug))
    }
    return list
  }, [])

  const filtered = useMemo(() => {
    let list = allCities
    if (query) list = list.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.county.toLowerCase().includes(query.toLowerCase()))
    if (selectedCounty) list = list.filter(c => c.countySlug === selectedCounty)
    return list.slice(0, 120)
  }, [allCities, query, selectedCounty])

  const countyName = NY_COUNTIES.find(c => c.slug === selectedCounty)?.name

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Cities & Towns</h1>
        <p className="hidden sm:block text-sm text-[var(--muted)] mt-1">Browse solar data for NY cities and towns</p>
      </div>

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search cities..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setCountyOpen(o => !o)}
              className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedCounty ? 'border-solar text-solar bg-solar/5' : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)]'
              )}
            >
              {countyName ? `${countyName} County` : 'Filter by County'}
              <ChevronDown className="h-3 w-3" />
            </button>
            {countyOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
                <button
                  onClick={() => { setSelectedCounty(''); setCountyOpen(false) }}
                  className="flex w-full px-4 py-2.5 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
                >
                  All Counties
                </button>
                {NY_COUNTIES.map(c => (
                  <button
                    key={c.slug}
                    onClick={() => { setSelectedCounty(c.slug); setCountyOpen(false) }}
                    className="flex w-full px-4 py-2.5 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar mx-6 mb-8 rounded-lg border border-[var(--border)]">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">City / Town</th>
              <th className="px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">County</th>
              <th className="px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Solar Score</th>
              <th className="hidden sm:table-cell px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Population</th>
              <th className="hidden sm:table-cell px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">ZIP Codes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(city => (
              <tr key={city.slug} className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--txt)]">
                  <Link href={`/cities/${city.slug}`} className="flex items-center gap-2 hover:text-solar transition-colors">
                    <Building2 className="h-4 w-4 text-solar shrink-0" />
                    {city.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  <Link href={`/counties/${city.countySlug}`} className="hover:text-solar transition-colors">{city.county}</Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5 text-solar shrink-0" />
                    <span className="font-bold text-solar">{city.solarScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)]">{city.population.toLocaleString()}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)] text-xs">{city.zips.slice(0, 3).join(', ')}{city.zips.length > 3 ? '…' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
