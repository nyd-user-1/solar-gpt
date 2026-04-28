'use client'

import { useRouter } from 'next/navigation'
import { LayoutGrid } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
} from 'recharts'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { DASHBOARD_CONFIGS } from '@/lib/dashboard-config'

export function DashboardsDrawer() {
  const router = useRouter()

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboards</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Dashboards</DrawerTitle>
          <DrawerDescription>Explore solar opportunity data</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[62vh] overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DASHBOARD_CONFIGS.map((d) => (
              <DrawerClose asChild key={d.slug}>
                <button
                  onClick={() => router.push(`/dashboard/${d.slug}`)}
                  className="group text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-md hover:border-[var(--border2)] transition-all duration-200 overflow-hidden"
                >
                  <div className="h-24 px-2 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {d.chartType === 'area' ? (
                        <AreaChart data={d.previewData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                          <defs>
                            <linearGradient id={`dr-${d.slug}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={d.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={d.color} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="y" stroke={d.color} strokeWidth={1.5} fill={`url(#dr-${d.slug})`} dot={false} animationDuration={500} />
                          <XAxis dataKey="x" hide />
                        </AreaChart>
                      ) : (
                        <BarChart data={d.previewData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                          <Bar dataKey="y" fill={d.color} radius={[2, 2, 0, 0]} animationDuration={500} />
                          <XAxis dataKey="x" hide />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="px-3 pb-3 pt-1.5">
                    <p className="font-semibold text-sm text-[var(--txt)] group-hover:text-[var(--txt)] transition-colors">{d.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{d.desc}</p>
                  </div>
                </button>
              </DrawerClose>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
