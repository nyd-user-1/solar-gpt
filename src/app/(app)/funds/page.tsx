'use client'

import { Sun, DollarSign, TrendingUp, Award } from 'lucide-react'

const INCENTIVES = [
  { name: 'Federal ITC (30%)', description: 'Federal Investment Tax Credit covers 30% of installed cost. Applies to system + battery storage.', value: '30%', type: 'Tax Credit', expires: '2032' },
  { name: 'NY State Credit', description: 'NY offers a 25% state income tax credit, up to $5,000. Stackable with the federal ITC.', value: 'Up to $5,000', type: 'Tax Credit', expires: 'Ongoing' },
  { name: 'NY-Sun Incentive', description: 'NYSERDA upfront rebate per Watt of installed solar. Rate varies by region and utility.', value: '$0.20–$0.40/W', type: 'Rebate', expires: 'Program active' },
  { name: 'NYSERDA Green Bank', description: 'Low-interest financing through the NY Green Bank for qualified homeowners.', value: 'As low as 2.99%', type: 'Financing', expires: 'Ongoing' },
  { name: 'Property Tax Exemption', description: 'NY excludes solar equipment value from property tax assessment for 15 years.', value: '100% exempt', type: 'Tax Exemption', expires: '15 years' },
  { name: 'Sales Tax Exemption', description: 'Solar equipment sales are exempt from NY state sales tax (4% savings).', value: '4% savings', type: 'Tax Exemption', expires: 'Ongoing' },
]

const SAMPLE_COMMISSION = [
  { lead: 'Michael Torres — White Plains', status: 'Quoted', system: '9.8 kW', comm: '$680' },
  { lead: 'Sarah Kim — Long Beach', status: 'Installed', system: '11.2 kW', comm: '$840' },
  { lead: 'Jennifer Walsh — Buffalo', status: 'Quoted - Scheduled', system: '7.5 kW', comm: '$560' },
  { lead: 'Lisa Patel — Bay Shore', status: 'Installed', system: '13.0 kW', comm: '$975' },
]

export default function FundsPage() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Funds & Incentives</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Available solar incentive programs and commissions</p>
      </div>

      {/* Summary cards */}
      <div className="px-6 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Incentive Value', value: '~40%+', icon: DollarSign, color: 'text-solar' },
          { label: 'Avg System Savings', value: '$12,400', icon: TrendingUp, color: 'text-green-500' },
          { label: 'Installs This Month', value: '2', icon: Sun, color: 'text-solar' },
          { label: 'Earned (MTD)', value: '$1,815', icon: Award, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Commission table */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">Recent Commissions</h2>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--inp-bg)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">System</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {SAMPLE_COMMISSION.map(row => (
                <tr key={row.lead} className="hover:bg-[var(--inp-bg)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">{row.lead}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{row.status}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{row.system}</td>
                  <td className="px-4 py-3 text-right font-bold text-solar">{row.comm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incentive programs */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">NY Solar Incentive Programs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INCENTIVES.map(inc => (
            <div key={inc.name} className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-[var(--txt)]">{inc.name}</h3>
                <span className="shrink-0 rounded border border-solar/30 bg-solar/5 px-2 py-0.5 text-xs font-medium text-solar">{inc.type}</span>
              </div>
              <p className="text-sm text-[var(--muted)] mb-3">{inc.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--txt)]">{inc.value}</span>
                <span className="text-[var(--muted)] text-xs">Expires: {inc.expires}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
