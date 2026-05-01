'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { nameToSlug } from '@/lib/queries'
import { fmtUsd } from '@/lib/utils'
import type { StateKpi } from '@/lib/queries'

const CARD_GRADIENTS = [
  'from-amber-400 to-orange-500',
  'from-yellow-400 to-amber-500',
  'from-orange-400 to-red-400',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
]

export function StateCardClient({ state, index }: { state: StateKpi; index: number }) {
  const gradient = CARD_GRADIENTS[(index + 5) % CARD_GRADIENTS.length]
  const href = `/states/${nameToSlug(state.state_name)}`
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string | null }>).detail
      setPressed(detail?.name === state.state_name)
    }
    window.addEventListener('solargpt:state-zoom', handler)
    return () => window.removeEventListener('solargpt:state-zoom', handler)
  }, [state.state_name])

  const zoomToState = () => {
    window.dispatchEvent(new CustomEvent('solargpt:state-zoom', {
      detail: {
        name: state.state_name,
        bounds: { north: state.lat_max, south: state.lat_min, east: state.lng_max, west: state.lng_min },
        value: state.untapped_annual_value_usd,
        buildings: state.count_qualified,
      },
    }))
  }

  const highlight = () =>
    window.dispatchEvent(new CustomEvent('solargpt:state-highlight', { detail: { name: state.state_name } }))
  const unhighlight = () =>
    window.dispatchEvent(new CustomEvent('solargpt:state-highlight', { detail: { name: null } }))

  return (
    <div
      className={`group relative shrink-0 w-[calc(58vw-18px)] sm:w-[300px] aspect-[16/9] sm:aspect-[4/3] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden cursor-pointer transition-shadow ${pressed ? 'ring-2 ring-solar ring-offset-2 ring-offset-[var(--surface)]' : ''}`}
      onMouseEnter={highlight}
      onMouseLeave={unhighlight}
      onClick={zoomToState}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
      {state.flag_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${state.flag_url}?width=600`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      {/* State name — top left */}
      <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">
        <p className="text-sm font-bold text-white leading-snug">{state.state_name}</p>
      </div>

      {/* Value — top right */}
      <div className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm px-2 py-1">
        <span className="text-xs font-bold text-white">{fmtUsd(state.untapped_annual_value_usd)}</span>
      </div>

      {/* Detail button — bottom right */}
      <div className="absolute bottom-3 right-3">
        <Link
          href={href}
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#f59e0b] hover:bg-[#d97706] px-2.5 py-1.5 rounded-full transition-colors shadow-sm"
        >
          Detail →
        </Link>
      </div>
    </div>
  )
}
