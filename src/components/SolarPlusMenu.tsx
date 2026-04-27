'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, ChevronRight, ArrowLeft, X, Lightbulb, Map, MapPin } from 'lucide-react'
import { STATE_ABBRS } from '@/lib/us-states'

/* ------------------------------------------------------------------ */
/*  Sample prompts                                                     */
/* ------------------------------------------------------------------ */

const SAMPLE_PROMPTS = [
  { title: 'Most Untapped Potential', description: 'Best US states by solar opportunity', prompt: 'Which US states have the most untapped solar potential right now?' },
  { title: 'Payback Period', description: 'When does solar pay for itself?', prompt: "What's the typical payback period for rooftop solar in Texas?" },
  { title: 'California vs Florida', description: 'Compare two major solar markets', prompt: 'Compare solar adoption rates and opportunity between California and Florida' },
  { title: 'Electricity Rate Impact', description: 'How rates affect solar ROI', prompt: 'How does the local electricity rate affect solar ROI in different US regions?' },
  { title: 'Top Solar Counties', description: 'Best counties by sunlight grade', prompt: 'Which counties have the highest solar grade ratings and what drives that?' },
  { title: 'Installer Targeting', description: 'Where should solar installers focus?', prompt: 'What are the best states for solar installers to target right now and why?' },
  { title: 'Carbon Offset Potential', description: 'Environmental impact of full solar adoption', prompt: 'How much carbon offset could New York achieve with full rooftop solar adoption?' },
  { title: 'Average Annual Savings', description: 'Typical homeowner solar savings', prompt: 'What is the average annual savings from residential solar across the US?' },
]

const COUNTY_STOP_WORDS = new Set(['county', 'parish', 'borough', 'city', 'town'])

function tokenizeQuery(q: string): string[] {
  const tokens = q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2)
  const meaningful = tokens.filter(t => !COUNTY_STOP_WORDS.has(t))
  return meaningful.length > 0 ? meaningful : tokens
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DrillStep = 'categories' | 'prompts' | 'pick-state' | 'pick-county'

type StateChip = {
  name: string
  slug: string
  flag_url: string | null
  untapped: string
  grade: string
}

type CountyChip = {
  name: string
  state: string
  slug: string
  seal_url: string | null
}

interface Props {
  stateChips: StateChip[]
  countyChips: CountyChip[]
  onSelect: (text: string) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SolarPlusMenu({ stateChips, countyChips, onSelect }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [step, setStep] = useState<DrillStep>('categories')
  const [search, setSearch] = useState('')

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    if (menuOpen) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const closeMenu = () => { setMenuOpen(false); setStep('categories'); setSearch('') }
  const goBack = () => { setStep('categories'); setSearch('') }

  const handleCategoryClick = (cat: 'prompts' | 'pick-state' | 'pick-county') => {
    setSearch('')
    setStep(cat)
  }

  const filteredStates = stateChips.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPrompts = SAMPLE_PROMPTS.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCounties = useMemo(() => {
    if (!search) return countyChips
    const tokens = tokenizeQuery(search)
    if (tokens.length === 0) return countyChips
    return countyChips.filter(c => {
      const haystack = `${c.name} ${c.state}`.toLowerCase()
      return tokens.every(t => haystack.includes(t))
    })
  }, [countyChips, search])

  const getStepLabel = () => {
    if (step === 'prompts') return 'Sample Questions'
    if (step === 'pick-state') return 'States'
    if (step === 'pick-county') return 'Counties'
    return ''
  }

  const isDrawer = step !== 'categories'

  const CATEGORIES = [
    { key: 'prompts' as const, label: 'Sample Questions', icon: <Lightbulb className="h-5 w-5" /> },
    { key: 'pick-state' as const, label: 'States', icon: <Map className="h-5 w-5" /> },
    { key: 'pick-county' as const, label: 'Counties', icon: <MapPin className="h-5 w-5" /> },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (menuOpen) {
            closeMenu()
          } else {
            setMenuOpen(true)
            setStep('categories')
            setSearch('')
          }
        }}
        className={`order-1 sm:order-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          menuOpen
            ? 'bg-[rgba(0,0,0,0.07)] text-[var(--txt)]'
            : 'text-[var(--muted)] hover:bg-[rgba(0,0,0,0.07)] hover:text-[var(--txt)]'
        }`}
      >
        {menuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>

      {/* ---- Category screen ---- */}
      {menuOpen && !isDrawer && (
        <div className="absolute left-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          <div className="py-1">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--inp-bg)] transition-colors ${
                  i > 0 ? 'border-t border-[var(--border)]' : ''
                }`}
              >
                <span className="text-[var(--muted)]">{cat.icon}</span>
                <span className="text-[var(--txt)]">{cat.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[var(--muted)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Drill-down drawer ---- */}
      {menuOpen && isDrawer && (
        <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
            <button onClick={goBack} className="text-[var(--muted)] hover:text-[var(--txt)] shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${getStepLabel()}…`}
              autoFocus
              className="flex-1 bg-transparent text-base text-[var(--txt)] outline-none placeholder:text-[var(--muted2)]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--muted)] hover:text-[var(--txt)] shrink-0">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto no-scrollbar">

            {/* Sample Questions */}
            {step === 'prompts' && (
              <>
                {filteredPrompts.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => { onSelect(p.prompt); closeMenu() }}
                    className={`flex w-full flex-col items-start px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${
                      i > 0 ? 'border-t border-[var(--border)]' : ''
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--txt)]">{p.title}</span>
                    <span className="text-xs text-[var(--muted)] text-left">{p.description}</span>
                  </button>
                ))}
                {filteredPrompts.length === 0 && (
                  <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>
                )}
              </>
            )}

            {/* States */}
            {step === 'pick-state' && (
              <>
                {filteredStates.map((s, i) => (
                  <button
                    key={s.slug}
                    onClick={() => { onSelect(`What is the solar energy potential in ${s.name}?`); closeMenu() }}
                    className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${
                      i > 0 ? 'border-t border-[var(--border)]' : ''
                    }`}
                  >
                    {s.flag_url
                      ? <img src={`${s.flag_url}?width=80`} alt="" className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]" />
                      : <Map className="h-5 w-5 text-solar shrink-0" />}
                    <span className="text-sm font-semibold text-[var(--txt)]">{s.name}</span>
                  </button>
                ))}
                {filteredStates.length === 0 && (
                  <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>
                )}
              </>
            )}

            {/* Counties */}
            {step === 'pick-county' && (
              filteredCounties.length === 0
                ? <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>
                : filteredCounties.map((c, i) => {
                  const abbr = STATE_ABBRS[c.state] ?? c.state
                  return (
                    <button
                      key={`${c.slug}-${c.state}`}
                      onClick={() => { onSelect(`Analyze the solar opportunity in ${c.name}, ${abbr}`); closeMenu() }}
                      className={`flex w-full items-center px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${
                        i > 0 ? 'border-t border-[var(--border)]' : ''
                      }`}
                    >
                      <span className="text-sm font-semibold text-[var(--txt)]">{c.name}, {abbr}</span>
                    </button>
                  )
                })
            )}

          </div>
        </div>
      )}
    </div>
  )
}
