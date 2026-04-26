'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SAMPLE_LEADS, STATUS_STYLES } from '@/data/leads'
import { Search, Sun, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeadsPage() {
  const [query, setQuery] = useState('')

  const filtered = SAMPLE_LEADS.filter(l => {
    const name = `${l.first_name} ${l.last_name} ${l.city} ${l.county} ${l.zip}`.toLowerCase()
    return name.includes(query.toLowerCase())
  })

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--txt)]">Leads</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Solar installation quote requests</p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 rounded-full bg-[#111118] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Lead
        </Link>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-20 px-6 pb-3 bg-[var(--surface)]">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search leads..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar mx-6 mb-8 mt-3 rounded-lg border border-[var(--border)]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Name</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Location</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">System</th>
              <th className="hidden sm:table-cell px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Monthly Bill</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Est. Cost</th>
              <th className="px-4 py-3 sticky top-0 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(lead => {
              const style = STATUS_STYLES[lead.contact_status] ?? STATUS_STYLES['New']
              return (
                <tr key={lead.id} className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 hover:text-solar transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar/10 text-solar text-xs font-bold shrink-0">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <div>
                        <p>{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-[var(--muted)]">{lead.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    <p>{lead.city}, {lead.state}</p>
                    <p className="text-xs">{lead.county} County</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--txt)]">{lead.system_size_kw} kW</p>
                    <p className="text-xs text-[var(--muted)]">{lead.roof_type}</p>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)]">${lead.monthly_electric_bill}/mo</td>
                  <td className="px-4 py-3 font-medium text-solar">${lead.estimated_cost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', style.bg, style.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                      {lead.contact_status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
