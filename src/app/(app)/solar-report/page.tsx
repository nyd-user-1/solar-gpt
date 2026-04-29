import { Suspense } from 'react'
import SolarReportClient from './SolarReportClient'

export default function SolarReportPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><span className="text-sm text-[var(--muted)]">Loading…</span></div>}>
      <SolarReportClient />
    </Suspense>
  )
}
