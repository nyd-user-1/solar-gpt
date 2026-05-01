'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, ChevronRight, ArrowLeft, X, Lightbulb, Map, MapPin, Cpu } from 'lucide-react'
import { STATE_ABBRS } from '@/lib/us-states'

/* ------------------------------------------------------------------ */
/*  Sample prompts                                                     */
/* ------------------------------------------------------------------ */

const SAMPLE_PROMPTS = [
  { description: 'Which US states have the most untapped solar potential right now?', prompt: 'Which US states have the most untapped solar potential right now?' },
  { description: 'What\'s the typical payback period for rooftop solar in Texas?', prompt: "What's the typical payback period for rooftop solar in Texas?" },
  { description: 'Compare solar adoption rates and opportunity between California and Florida', prompt: 'Compare solar adoption rates and opportunity between California and Florida' },
  { description: 'How does the local electricity rate affect solar ROI in different US regions?', prompt: 'How does the local electricity rate affect solar ROI in different US regions?' },
  { description: 'Which counties have the highest solar grade ratings and what drives that?', prompt: 'Which counties have the highest solar grade ratings and what drives that?' },
  { description: 'What are the best states for solar installers to target right now and why?', prompt: 'What are the best states for solar installers to target right now and why?' },
  { description: 'How much carbon offset could New York achieve with full rooftop solar adoption?', prompt: 'How much carbon offset could New York achieve with full rooftop solar adoption?' },
  { description: 'What is the average annual savings from residential solar across the US?', prompt: 'What is the average annual savings from residential solar across the US?' },
]

const COUNTY_STOP_WORDS = new Set(['county', 'parish', 'borough', 'city', 'town'])

function tokenizeQuery(q: string): string[] {
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2)
  const meaningful = tokens.filter(t => !COUNTY_STOP_WORDS.has(t))
  return meaningful.length > 0 ? meaningful : tokens
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DrillStep = 'categories' | 'prompts' | 'pick-state' | 'pick-county' | 'pick-model'

type StateChip = { name: string; slug: string; flag_url: string | null; untapped: string; grade: string }
type CountyChip = { name: string; state: string; slug: string; seal_url: string | null }
export type ModelOption = { id: string; label: string; icon: React.ReactNode }

interface Props {
  stateChips: StateChip[]
  countyChips: CountyChip[]
  onSelect: (text: string) => void
  modelOptions: ModelOption[]
  selectedModelId: string
  onModelChange: (id: string) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SolarPlusMenu({ stateChips, countyChips, onSelect, modelOptions, selectedModelId, onModelChange }: Props) {
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
  const handleCategoryClick = (cat: Exclude<DrillStep, 'categories'>) => { setSearch(''); setStep(cat) }

  const filteredStates = stateChips.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredPrompts = SAMPLE_PROMPTS.filter(p => !search || p.description.toLowerCase().includes(search.toLowerCase()))
  const filteredCounties = useMemo(() => {
    if (!search) return countyChips
    const tokens = tokenizeQuery(search)
    if (tokens.length === 0) return countyChips
    return countyChips.filter(c => tokens.every(t => `${c.name} ${c.state}`.toLowerCase().includes(t)))
  }, [countyChips, search])
  const filteredModels = modelOptions.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase()))

  const getStepLabel = () => {
    if (step === 'prompts') return 'Sample Questions'
    if (step === 'pick-state') return 'States'
    if (step === 'pick-county') return 'Counties'
    if (step === 'pick-model') return 'Models'
    return ''
  }

  const isDrawer = step !== 'categories'

  const CATEGORIES: { key: Exclude<DrillStep, 'categories'>; label: string; icon: React.ReactNode }[] = [
    { key: 'pick-model', label: 'Models', icon: <Cpu className="h-5 w-5" /> },
    { key: 'prompts', label: 'Sample Questions', icon: <Lightbulb className="h-5 w-5" /> },
    { key: 'pick-state', label: 'States', icon: <Map className="h-5 w-5" /> },
    { key: 'pick-county', label: 'Counties', icon: <MapPin className="h-5 w-5" /> },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => { if (menuOpen) { closeMenu() } else { setMenuOpen(true); setStep('categories'); setSearch('') } }}
        className={`order-1 sm:order-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          menuOpen ? 'bg-[rgba(0,0,0,0.07)] text-[var(--txt)]' : 'text-[var(--muted)] hover:bg-[rgba(0,0,0,0.07)] hover:text-[var(--txt)]'
        }`}
      >
        {menuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>

      {/* Category screen */}
      {menuOpen && !isDrawer && (
        <div className="absolute left-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          <div className="py-1">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
              >
                <span className="text-[var(--muted)]">{cat.icon}</span>
                <span className="text-[var(--txt)]">{cat.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[var(--muted)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drill-down drawer */}
      {menuOpen && isDrawer && (
        <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
            <button onClick={goBack} className="text-[var(--muted)] hover:text-[var(--txt)] shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${getStepLabel()}…`} autoFocus
              className="flex-1 bg-transparent text-base text-[var(--txt)] outline-none placeholder:text-[var(--muted2)]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--muted)] hover:text-[var(--txt)] shrink-0">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto no-scrollbar">

            {/* Models */}
            {step === 'pick-model' && (
              <>
                {filteredModels.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => { onModelChange(m.id); closeMenu() }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    <span className="shrink-0 text-[var(--muted)]">{m.icon}</span>
                    <span className="flex-1 text-left font-medium text-[var(--txt)]">{m.label}</span>
                    {m.id === selectedModelId && (
                      <svg className="h-4 w-4 shrink-0 text-[var(--txt)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
                {filteredModels.length === 0 && <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>}
              </>
            )}

            {/* Sample Questions — description only */}
            {step === 'prompts' && (
              <>
                {filteredPrompts.map((p, i) => (
                  <button
                    key={p.description}
                    onClick={() => { onSelect(p.prompt); closeMenu() }}
                    className={`flex w-full items-start px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    <span className="text-sm text-[var(--txt)] text-left">{p.description}</span>
                  </button>
                ))}
                {filteredPrompts.length === 0 && <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>}
              </>
            )}

            {/* States */}
            {step === 'pick-state' && (
              <>
                {filteredStates.map((s, i) => (
                  <button
                    key={s.slug}
                    onClick={() => { onSelect(`What is the solar energy potential in ${s.name}?`); closeMenu() }}
                    className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    {s.flag_url
                      ? <img src={`${s.flag_url}?width=80`} alt="" className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]" />
                      : <Map className="h-5 w-5 text-solar shrink-0" />}
                    <span className="text-sm font-semibold text-[var(--txt)]">{s.name}</span>
                  </button>
                ))}
                {filteredStates.length === 0 && <p className="px-4 py-3 text-xs text-[var(--muted)]">No matches</p>}
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
                      className={`flex w-full items-center px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
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
