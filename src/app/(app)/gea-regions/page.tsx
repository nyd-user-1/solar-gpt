'use client'

import Link from 'next/link'
import { GEA_REGIONS } from '@/data/geo'
import { Sun, Zap } from 'lucide-react'

export default function GeaRegionsPage() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">GEA Regions</h1>
        <p className="text-sm text-[var(--muted)] mt-1">NY Regional Economic Development Councils</p>
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GEA_REGIONS.map(region => (
            <Link
              key={region.slug}
              href={`/gea-regions/${region.slug}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--txt)] truncate">{region.name}</p>
                  <p className="text-xs text-[var(--muted)]">{region.counties.length} counties</p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">{region.description}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Total Installs</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{region.totalInstalls.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Avg Solar Score</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Sun className="h-4 w-4 text-solar" />
                    <span className="text-lg font-bold text-solar">{region.avgSolarScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
