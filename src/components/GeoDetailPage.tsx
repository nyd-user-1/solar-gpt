'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Sun, Search, MapPin } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

export interface InfoRow {
  label: string
  value: string
  highlight?: boolean
}

export interface CarouselCard {
  title: string
  subtitle: string
  href: string
  metric?: string
  metricLabel?: string
}

export interface DetailPageProps {
  /** Page title */
  title: string
  /** Breadcrumbs: [{label, href}] */
  breadcrumbs?: { label: string; href: string }[]
  /** Prev/next navigation items */
  prev?: { label: string; href: string } | null
  next?: { label: string; href: string } | null
  /** Back link for the list button */
  listHref: string
  listLabel: string
  /** Info table rows */
  infoRows: InfoRow[]
  /** Main carousel title and items */
  carouselTitle: string
  carouselItems: CarouselCard[]
  /** Optional second carousel */
  carousel2Title?: string
  carousel2Items?: CarouselCard[]
  /** Optional search for carousel items */
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  /** Optional CTA prompt */
  ctaHref?: string
  ctaLabel?: string
}

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded bg-[var(--border)] ${className}`} />
}

function SolarScoreDots({ score }: { score: number }) {
  const full = Math.floor(score)
  const half = score % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Sun
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? 'text-solar fill-solar' : i === full && half ? 'text-solar opacity-50' : 'text-[var(--border)]'}`}
        />
      ))}
    </div>
  )
}

export function GeoDetailPage({
  title, breadcrumbs, prev, next, listHref, listLabel,
  infoRows, carouselTitle, carouselItems,
  carousel2Title, carousel2Items,
  searchPlaceholder, onSearch,
  ctaHref, ctaLabel,
}: DetailPageProps) {
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [transitioning, setTransitioning] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 380)
    return () => clearTimeout(t)
  }, [title])

  const handleSearch = (q: string) => {
    setQuery(q)
    onSearch?.(q)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-4">

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <Link href={crumb.href} className="hover:text-solar transition-colors">{crumb.label}</Link>
              </span>
            ))}
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--txt)]">{title}</span>
          </nav>
        )}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-[var(--txt)]">{title}</h1>

          {/* Button group */}
          <div className="hidden sm:flex items-center shrink-0">
            <div className="inline-flex -space-x-px">
              <div className="relative group">
                <Link
                  href={prev?.href ?? '#'}
                  aria-disabled={!prev}
                  className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-l-full text-[var(--muted)] transition-colors ${prev ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Prev</span>
              </div>
              <div className="relative group">
                <Link
                  href={ctaHref ?? '/leads/new'}
                  className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
                >
                  <Sun className="h-4 w-4" />
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{ctaLabel ?? 'Get Quote'}</span>
              </div>
              <div className="relative group">
                <Link
                  href={listHref}
                  className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] hover:text-solar hover:bg-[var(--inp-bg)] transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{listLabel}</span>
              </div>
              <div className="relative group">
                <Link
                  href={next?.href ?? '#'}
                  aria-disabled={!next}
                  className={`inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-white dark:bg-[var(--surface)] rounded-r-full text-[var(--muted)] transition-colors ${next ? 'hover:text-solar hover:bg-[var(--inp-bg)]' : 'opacity-30 pointer-events-none'}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Next</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info table */}
        <div className="mb-8">
          <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <button onClick={() => setInfoExpanded(!infoExpanded)} className="flex w-full items-center justify-between px-4 py-3 bg-[var(--inp-bg)]">
              <span className="text-sm font-semibold text-[var(--txt)]">Solar Profile</span>
              <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${infoExpanded ? 'rotate-180' : ''}`} />
            </button>
            <table className="w-full text-sm">
              <tbody>
                {transitioning ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3"><SkeletonBar className="h-5 w-28" /></td>
                      <td className="px-4 py-3"><div className="flex justify-end"><SkeletonBar className="h-5 w-16" /></div></td>
                    </tr>
                  ))
                ) : (
                  <>
                    {infoRows.slice(0, infoExpanded ? infoRows.length : 4).map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 text-[var(--muted)]">{row.label}</td>
                        <td className={`px-4 py-3 text-right font-medium ${row.highlight ? 'text-solar' : 'text-[var(--txt)]'}`}>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search */}
        {searchPlaceholder && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--txt)]">Search</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--inp-bg)] pl-10 pr-4 text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none focus:border-solar transition-colors"
              />
            </div>
          </div>
        )}

        {/* Main carousel */}
        <div className="mb-8">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--txt)]">{carouselTitle}</h2>
              <div className="flex items-center gap-2">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </div>
            <CarouselContent>
              {transitioning ? (
                [...Array(3)].map((_, i) => (
                  <CarouselItem key={i} className="basis-full sm:basis-1/2 md:basis-1/3">
                    <div className="w-full min-h-[90px] rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <SkeletonBar className="h-3 w-20" />
                        <SkeletonBar className="h-3 w-28" />
                      </div>
                      <SkeletonBar className="h-4 w-14 shrink-0" />
                    </div>
                  </CarouselItem>
                ))
              ) : carouselItems.length === 0 ? (
                <CarouselItem className="basis-full">
                  <p className="text-sm text-[var(--muted)] px-1">No items found.</p>
                </CarouselItem>
              ) : carouselItems.map((item) => (
                <CarouselItem key={item.href} className="basis-full sm:basis-1/2 md:basis-1/3">
                  <Link
                    href={item.href}
                    className="block w-full min-h-[90px] rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 transition-all hover:bg-[var(--inp-bg)] hover:border-transparent cursor-pointer"
                  >
                    <div className="flex items-center gap-3 h-full">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--txt)] truncate">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">{item.subtitle}</p>
                      </div>
                      {item.metric && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-solar">{item.metric}</p>
                          {item.metricLabel && <p className="text-xs text-[var(--muted)]">{item.metricLabel}</p>}
                        </div>
                      )}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Second carousel */}
        {carousel2Title && carousel2Items && (
          <div className="mb-8">
            <Carousel opts={{ align: 'start' }} className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">{carousel2Title}</h2>
                <div className="flex items-center gap-2">
                  <CarouselPrevious />
                  <CarouselNext />
                </div>
              </div>
              <CarouselContent>
                {transitioning ? (
                  [...Array(3)].map((_, i) => (
                    <CarouselItem key={i} className="basis-full sm:basis-1/2 md:basis-1/3">
                      <div className="w-full rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 space-y-2 min-h-[90px]">
                        <SkeletonBar className="h-3 w-32" />
                        <SkeletonBar className="h-3 w-full" />
                        <SkeletonBar className="h-3 w-4/5" />
                      </div>
                    </CarouselItem>
                  ))
                ) : carousel2Items.map((item) => (
                  <CarouselItem key={item.href} className="basis-full sm:basis-1/2 md:basis-1/3">
                    <Link
                      href={item.href}
                      className="block w-full rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--surface)] p-4 text-left transition-all hover:bg-[var(--inp-bg)] hover:border-transparent cursor-pointer overflow-hidden"
                    >
                      <p className="mb-1 text-sm font-medium text-[var(--txt)] truncate">{item.title}</p>
                      <p className="text-xs text-[var(--muted)] line-clamp-2">{item.subtitle}</p>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-solar/20 bg-solar/5 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--txt)]">Get a solar quote for this area</p>
            <p className="text-sm text-[var(--muted)] mt-0.5">Free, no-obligation estimate based on your roof and usage</p>
          </div>
          <Link
            href={ctaHref ?? '/leads/new'}
            className="shrink-0 rounded-full bg-solar px-5 py-2.5 text-sm font-semibold text-white hover:bg-solar-dark transition-colors"
          >
            {ctaLabel ?? 'Get Quote'}
          </Link>
        </div>

      </div>
    </div>
  )
}
