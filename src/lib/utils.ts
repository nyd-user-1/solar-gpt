import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value).toLocaleString()}`
}

export function fmtGea(name: string): string {
  return name.replace(/_/g, ' ')
}

export function fmtNum(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return Math.round(value).toLocaleString()
}

// Abbreviated number formatting per project spec
export function formatNumber(value: number | null | undefined, opts?: { decimals?: number; suffix?: string }): string {
  if (value == null || isNaN(value as number)) return '—'
  const v = value as number
  const s = opts?.suffix ?? ''
  const dec = opts?.decimals ?? 0
  if (v >= 1_000_000_000) { const n = v / 1_000_000_000; return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}B${s}` }
  if (v >= 1_000_000)     { const n = v / 1_000_000;     return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M${s}` }
  if (v >= 100_000)       { const n = v / 1_000;         return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K${s}` }
  if (v >= 1_000)         { return `${Math.round(v).toLocaleString()}${s}` }
  if (dec > 0)            { return `${parseFloat(v.toFixed(dec)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: dec })}${s}` }
  return `${Math.round(v)}${s}`
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return '—'
  return `${Math.min(Math.round(value as number), 99)}%`
}

export function fmtKwMedian(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return '—'
  return (value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
