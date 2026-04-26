export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Map } from 'lucide-react'
import { getAllStates, nameToSlug } from '@/lib/queries'
import { fmtUsd } from '@/lib/utils'

export default async function StatesPage() {
  const states = await getAllStates()

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">States</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{states.length} states with solar data</p>
      </div>

      <div className="px-6 pb-8 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {states.map(state => (
            <Link
              key={state.id}
              href={`/states/${nameToSlug(state.state_name)}`}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 transition-all hover:shadow-xl hover:border-solar cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solar/10 text-solar">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--txt)]">{state.state_name}</p>
                  <p className="text-xs text-[var(--muted)]">Grade {state.sunlight_grade}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Untapped/yr</p>
                  <p className="text-lg font-bold text-[var(--txt)]">{fmtUsd(state.untapped_annual_value_usd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted2)] uppercase tracking-wide font-semibold">Grade</p>
                  <p className="text-lg font-bold text-solar">{state.sunlight_grade}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
