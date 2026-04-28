'use client'

import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { DASHBOARD_CONFIGS } from '@/lib/dashboard-config'

export function DashboardHub() {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-16 sm:pb-10 w-full">

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {DASHBOARD_CONFIGS.map((d) => (
              <button
                key={d.slug}
                onClick={() => router.push(`/dashboard/${d.slug}`)}
                className="group text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)] hover:shadow-lg hover:border-[var(--border2)] transition-all duration-200 overflow-hidden"
              >
                <div className="h-32 px-2 pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    {d.chartType === 'area' ? (
                      <AreaChart data={d.previewData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                        <defs>
                          <linearGradient id={`hub-${d.slug}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={d.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={d.color} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="y"
                          stroke={d.color}
                          strokeWidth={1.5}
                          fill={`url(#hub-${d.slug})`}
                          dot={false}
                          animationDuration={500}
                        />
                        <XAxis dataKey="x" hide />
                      </AreaChart>
                    ) : d.chartType === 'pie' ? (
                      <PieChart>
                        <Pie data={d.previewData} dataKey="y" cx="50%" cy="50%" innerRadius="30%" outerRadius="65%" animationDuration={500}>
                          {d.previewData.map((_, i) => (
                            <Cell key={i} fill={d.color} opacity={Math.max(0.25, 1 - i * 0.14)} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : (
                      <BarChart data={d.previewData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                        <Bar dataKey="y" fill={d.color} radius={[2, 2, 0, 0]} animationDuration={500} />
                        <XAxis dataKey="x" hide />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="px-4 pb-4 pt-2">
                  <p className="font-semibold text-sm text-[var(--txt)] group-hover:text-[var(--txt)] transition-colors">
                    {d.title}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{d.desc}</p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
