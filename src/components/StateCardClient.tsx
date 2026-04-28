'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const gradient = CARD_GRADIENTS[(index + 5) % CARD_GRADIENTS.length]
  const href = `/states/${nameToSlug(state.state_name)}`

  const highlight = () =>
    window.dispatchEvent(new CustomEvent('solargpt:state-highlight', { detail: { name: state.state_name } }))
  const unhighlight = () =>
    window.dispatchEvent(new CustomEvent('solargpt:state-highlight', { detail: { name: null } }))

  return (
    <div
      className="group relative shrink-0 w-[calc(72vw-22px)] sm:w-[300px] aspect-[4/3] rounded-2xl snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden cursor-pointer"
      onMouseEnter={highlight}
      onMouseLeave={unhighlight}
      onClick={() => router.push(href)}
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
      <div className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm px-2 py-1">
        <span className="text-xs font-bold text-white">{fmtUsd(state.untapped_annual_value_usd)}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
        <p className="text-sm font-bold text-white leading-snug">{state.state_name}</p>
        <Link
          href={href}
          onClick={e => e.stopPropagation()}
          className="relative z-10 text-[10px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full hover:bg-white/40 transition-colors shrink-0 ml-2"
        >
          Detail →
        </Link>
      </div>
    </div>
  )
}
