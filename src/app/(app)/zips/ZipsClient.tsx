'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { SolarDataTable, SortableKey, SolarRow } from '@/components/SolarDataTable'
import type { ZipKpi } from '@/lib/queries'

export default function ZipsClient({ zips }: { zips: ZipKpi[] }) {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortableKey | 'region'>('count_qualified')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let list = [...zips]
    if (query) list = list.filter(z =>
      z.zip_code.includes(query) || z.state_name.toLowerCase().includes(query.toLowerCase())
    )
    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === 'region') { av = a.zip_code; bv = b.zip_code }
      else { av = (a as Record<string, unknown>)[sortCol] as number ?? 0; bv = (b as Record<string, unknown>)[sortCol] as number ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [zips, query, sortCol, sortDir])

  const handleSort = (key: SortableKey | 'region') => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('desc') }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative animate-zoom-in">

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-2">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search ZIP or state…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <p className="text-xs text-[var(--muted)] px-1">{filtered.length.toLocaleString()} results</p>
      </div>

      <SolarDataTable
        rows={filtered as SolarRow[]}
        sortCol={sortCol === 'region' ? 'count_qualified' : sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        getRowHref={(row) => {
          const z = row as unknown as ZipKpi
          return `/zips/${z.zip_code}`
        }}
        renderRegion={(row) => {
          const z = row as unknown as ZipKpi
          return (
            <span className="flex items-center gap-2 min-w-0 hover:text-solar transition-colors">
              <span>{z.zip_code}</span>
              <span className="text-xs text-[var(--muted)] shrink-0">{z.state_name}</span>
            </span>
          )
        }}
      />
    </div>
  )
}
