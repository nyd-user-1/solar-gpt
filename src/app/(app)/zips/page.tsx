'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SAMPLE_ZIPS } from '@/data/geo'
import { Search, Sun, Hash } from 'lucide-react'

export default function ZipsPage() {
  const [query, setQuery] = useState('')

  const filtered = SAMPLE_ZIPS.filter(z =>
    z.zip.includes(query) || z.city.toLowerCase().includes(query.toLowerCase()) || z.county.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">ZIP Codes</h1>
        <p className="hidden sm:block text-sm text-[var(--muted)] mt-1">Solar data by ZIP code</p>
      </div>

      <div className="sticky top-0 z-20 px-6 pt-4 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search ZIP, city, or county..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar mx-6 mb-8 mt-3 rounded-lg border border-[var(--border)]">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">ZIP</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">City</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">County</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Solar Score</th>
              <th className="hidden sm:table-cell px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Installs/yr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(z => (
              <tr key={z.zip} className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--txt)]">
                  <Link href={`/zips/${z.zip}`} className="flex items-center gap-2 hover:text-solar transition-colors">
                    <Hash className="h-4 w-4 text-solar shrink-0" />
                    {z.zip}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{z.city}</td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  <Link href={`/counties/${z.countySlug}`} className="hover:text-solar transition-colors">{z.county}</Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5 text-solar shrink-0" />
                    <span className="font-bold text-solar">{z.solarScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)]">{z.avgInstalls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
