'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SAMPLE_LEADS, STATUS_STYLES } from '@/data/leads'
import { Search, Plus, List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DbLead {
  id: number; first_name: string; last_name: string; email: string; phone: string
  address: string; monthly_bill: string; roof_shade: string; created_at: string
  token: string | null; system_kw: number | null; net_cost: number | null
  monthly_savings: number | null
}

export default function LeadsPage() {
  const [query, setQuery] = useState('')
  const [dbLeads, setDbLeads] = useState<DbLead[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'list'
    return (localStorage.getItem('solargpt.viewPreference.leads') as 'list' | 'cards') ?? 'list'
  })

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(setDbLeads).catch(() => {})
  }, [])

  const filtered = SAMPLE_LEADS.filter(l => {
    const name = `${l.first_name} ${l.last_name} ${l.city} ${l.county} ${l.zip}`.toLowerCase()
    return name.includes(query.toLowerCase())
  })

  const filteredDb = dbLeads.filter(l => {
    const name = `${l.first_name} ${l.last_name} ${l.address}`.toLowerCase()
    return name.includes(query.toLowerCase())
  })

  const totalCount = filteredDb.length + filtered.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Search + toolbar — always visible */}
      <div className="bg-[var(--surface)] px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 mb-3">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search leads..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--txt)] placeholder:text-[var(--muted2)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setViewMode('list'); localStorage.setItem('solargpt.viewPreference.leads', 'list') }}
            className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'list' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setViewMode('cards'); localStorage.setItem('solargpt.viewPreference.leads', 'cards') }}
            className={cn('rounded-lg p-1.5 transition-colors', viewMode === 'cards' ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]')}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <span className="text-xs text-[var(--muted)] ml-1">{totalCount} results</span>
          <Link
            href="/leads/new"
            className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">

        {/* Card view */}
        {viewMode === 'cards' && (
          <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredDb.map(lead => {
              const initials = `${lead.first_name[0]}${lead.last_name[0]}`
              return (
                <Link key={`db-${lead.id}`} href={`/leads/${lead.id}`}
                  className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 hover:shadow-lg hover:border-solar transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solar/10 text-solar text-sm font-bold shrink-0">{initials}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--txt)] truncate">{lead.first_name} {lead.last_name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{lead.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] truncate mb-3">{lead.address.split(',').slice(0, 2).join(',')}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted2)]">System</p>
                      <p className="font-bold text-[var(--txt)]">{lead.system_kw ? `${lead.system_kw} kW` : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted2)]">Est. Cost</p>
                      <p className="font-bold text-solar">{lead.net_cost ? `$${Number(lead.net_cost).toLocaleString()}` : '—'}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
            {filtered.map(lead => {
              const style = STATUS_STYLES[lead.contact_status] ?? STATUS_STYLES['New']
              return (
                <Link key={lead.id} href={`/leads/${lead.id}`}
                  className="flex flex-col rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5 hover:shadow-lg hover:border-solar transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solar/10 text-solar text-sm font-bold shrink-0">{lead.first_name[0]}{lead.last_name[0]}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--txt)] truncate">{lead.first_name} {lead.last_name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{lead.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-3">{lead.city}, {lead.state} · {lead.county} County</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted2)]">System</p>
                      <p className="font-bold text-[var(--txt)]">{lead.system_size_kw} kW</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', style.bg, style.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                      {lead.contact_status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* List / table view */}
        {viewMode === 'list' && (
          <div className="mx-6 mb-8 mt-3 rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Name</th>
                  <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Location</th>
                  <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">System</th>
                  <th className="hidden sm:table-cell px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Monthly Bill</th>
                  <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Est. Cost</th>
                  <th className="px-4 py-3 bg-[#f5f5f4] dark:bg-[#1a1a26] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDb.map(lead => (
                  <tr key={`db-${lead.id}`} className="cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
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
                      <p className="truncate max-w-[180px]">{lead.address.split(',').slice(0, 2).join(',')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--txt)]">{lead.system_kw ? `${lead.system_kw} kW` : '—'}</p>
                      <p className="text-xs text-[var(--muted)]">{lead.roof_shade}</p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-[var(--muted)]">{lead.monthly_bill}/mo</td>
                    <td className="px-4 py-3 font-medium text-solar">
                      {lead.net_cost ? `$${Number(lead.net_cost).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES['New'].bg, STATUS_STYLES['New'].text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_STYLES['New'].dot)} />
                        New
                      </span>
                    </td>
                  </tr>
                ))}
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
        )}

      </div>{/* end scroll area */}
    </div>
  )
}
