'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { NY_COUNTIES, GEA_REGIONS } from '@/data/geo'
import { Search, Sun, MapPin, ChevronDown, ChevronUp, Check, List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CountiesPage() {
  const [query, setQuery] = useState('')
  const [selectedGea, setSelectedGea] = useState('')
  const [sortCol, setSortCol] = useState<'name' | 'solar' | 'installs' | 'cost'>('solar')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [geaOpen, setGeaOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...NY_COUNTIES]
    if (query) list = list.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    if (selectedGea) list = list.filter(c => c.gea === selectedGea)
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'name')     { av = a.name; bv = b.name }
      if (sortCol === 'solar')    { av = a.solarScore; bv = b.solarScore }
      if (sortCol === 'installs') { av = a.avgInstalls; bv = b.avgInstalls }
      if (sortCol === 'cost')     { av = a.avgCostK; bv = b.avgCostK }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [query, selectedGea, sortCol, sortDir])

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const geaName = GEA_REGIONS.find(g => g.slug === selectedGea)?.name

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Counties</h1>
        <p className="hidden sm:block text-sm text-[var(--muted)] mt-1">Browse solar data for all 62 NY counties</p>
      </div>

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search counties..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* GEA filter */}
          <div className="relative">
            <button
              onClick={() => setGeaOpen(o => !o)}
              className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedGea ? 'border-solar text-solar bg-solar/5' : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)]'
              )}
            >
              {geaName ?? 'GEA Region'}
              <ChevronDown className="h-3 w-3" />
            </button>
            {geaOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
                <button
                  onClick={() => { setSelectedGea(''); setGeaOpen(false) }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
                >
                  All GEA Regions
                  {!selectedGea && <Check className="h-3.5 w-3.5 text-solar" />}
                </button>
                {GEA_REGIONS.map(g => (
                  <button
                    key={g.slug}
                    onClick={() => { setSelectedGea(g.slug); setGeaOpen(false) }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
                  >
                    {g.name}
                    {selectedGea === g.slug && <Check className="h-3.5 w-3.5 text-solar" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setViewMode('list')} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <List className="h-5 w-5" />
          </button>
          <button onClick={() => setViewMode('cards')} className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <span className="text-xs text-[var(--muted)]">{filtered.length} results</span>
          </div>
        </div>
      </div>

      {viewMode === 'cards' && (
        <div className="px-6 pb-8 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(county => (
            <Link
              key={county.slug}
              href={`/counties/${county.slug}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--txt)]">{county.name} County</p>
                  <p className="text-xs text-[var(--muted)]">{GEA_REGIONS.find(g => g.slug === county.gea)?.name ?? county.gea}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Installs/yr</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{county.avgInstalls}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Solar Score</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Sun className="h-4 w-4 text-solar" />
                    <span className="text-lg font-bold text-solar">{county.solarScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="overflow-x-auto no-scrollbar mx-6 mb-8 rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr>
                {[
                  { key: 'name', label: 'County' },
                  { key: 'installs', label: 'Installs/yr' },
                  { key: 'solar', label: 'Solar Score' },
                  { key: 'cost', label: 'Avg Cost' },
                ] .map(col => {
                  const active = sortCol === col.key as typeof sortCol
                  return (
                    <th key={col.key} className="px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]">
                      <button
                        onClick={() => toggleSort(col.key as typeof sortCol)}
                        className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                          active ? 'text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]'
                        )}
                      >
                        {col.label}
                        {active ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronUp className="h-3 w-3 opacity-0" />}
                      </button>
                    </th>
                  )
                })}
                <th className="hidden sm:table-cell px-4 py-3 sticky top-0 z-10 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">GEA Region</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(county => (
                <tr key={county.slug} className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">
                    <Link href={`/counties/${county.slug}`} className="flex items-center gap-2 hover:text-solar transition-colors">
                      <MapPin className="h-4 w-4 text-solar shrink-0" />
                      {county.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--txt)]">{county.avgInstalls}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-solar">{county.solarScore.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">${county.avgCostK}k</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)] text-xs">
                    {GEA_REGIONS.find(g => g.slug === county.gea)?.name ?? county.gea}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
