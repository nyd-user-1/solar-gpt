export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getAllGeas, getGeaKpi, geaToSlug } from '@/lib/queries'
import { fmtUsd, fmtNum } from '@/lib/utils'

export default async function GeaRegionsPage() {
  const geas = await getAllGeas()
  const kpis = await Promise.all(geas.map(g => getGeaKpi(g)))

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">GEA Regions</h1>
        <p className="text-sm text-[var(--muted)] mt-1">NREL Cambium grid energy areas — {geas.length} regions with solar data</p>
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {geas.map((gea, i) => {
            const kpi = kpis[i]
            return (
              <Link
                key={gea}
                href={`/gea-regions/${geaToSlug(gea)}`}
                className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--txt)] truncate">{gea}</p>
                    <p className="text-xs text-[var(--muted)]">{kpi ? `${kpi.county_count} counties` : '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Untapped / yr</p>
                    <p className="text-lg font-bold text-[var(--txt)]">{kpi ? fmtUsd(kpi.untapped_annual_value_usd) : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Sunlight Grade</p>
                    <p className="text-lg font-bold text-solar">{kpi?.sunlight_grade ?? '—'}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
