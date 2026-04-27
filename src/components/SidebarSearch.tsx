'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Map, MapPin, Zap, Plus, MessageCircle } from 'lucide-react'
import {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

type SearchResult = {
  states: { name: string; slug: string; grade: string; flag_url?: string | null }[]
  counties: { name: string; state: string; slug: string; grade: string; seal_url?: string | null }[]
  geas: { name: string; slug: string }[]
}

export function SidebarSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ states: [], counties: [], geas: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const openHandler = () => setOpen(true)
    window.addEventListener('keydown', handler)
    window.addEventListener('solargpt:open-search', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('solargpt:open-search', openHandler)
    }
  }, [])

  const fetchResults = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  // Load top states when opened without a query
  useEffect(() => {
    if (open && !query) fetchResults('')
  }, [open, query, fetchResults])

  // Debounced search when typing
  useEffect(() => {
    if (!query) return
    const t = setTimeout(() => fetchResults(query), 200)
    return () => clearTimeout(t)
  }, [query, fetchResults])

  const go = (to: string) => {
    router.push(to)
    setOpen(false)
    setQuery('')
  }

  const hasTypedResults = results.counties.length > 0 || results.geas.length > 0 || (query.length >= 2 && results.states.length > 0)
  const showingTopStates = !query && results.states.length > 0

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
      >
        <Search className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 text-left">Search…</span>
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] bg-black/30 backdrop-blur-sm"
      onClick={() => { setOpen(false); setQuery('') }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden flex flex-col max-h-[min(80vh,560px)]"
        onClick={e => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex flex-col min-h-0">
          <CommandInput
            placeholder="Search states, counties, GEA regions…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList className="flex-1 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-xs text-[var(--muted)]">Searching…</div>
            )}
            {!loading && query.length >= 2 && !hasTypedResults && (
              <CommandEmpty>No results for "{query}"</CommandEmpty>
            )}

            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => go('/new-chat')} value="new-chat">
                <MessageCircle className="h-4 w-4 text-[var(--muted)]" />
                <span>New Chat</span>
              </CommandItem>
              <CommandItem onSelect={() => go('/leads/new')} value="new-lead">
                <Plus className="h-4 w-4 text-[var(--muted)]" />
                <span>New Lead</span>
              </CommandItem>
            </CommandGroup>

            {results.states.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={showingTopStates ? 'Top States' : 'States'}>
                  {results.states.map(s => (
                    <CommandItem
                      key={s.slug}
                      onSelect={() => go(`/states/${s.slug}`)}
                      value={s.name}
                    >
                      {s.flag_url
                        ? <img src={s.flag_url} alt="" className="h-4 w-4 object-contain shrink-0" />
                        : <Map className="h-4 w-4 text-[var(--muted)]" />}
                      <span>{s.name}</span>
                      <span className={cn('ml-auto text-xs font-semibold', s.grade === 'A+' || s.grade === 'A' ? 'text-solar' : 'text-[var(--muted)]')}>
                        {s.grade}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.geas.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="GEA Regions">
                  {results.geas.map(g => (
                    <CommandItem
                      key={g.slug}
                      onSelect={() => go(`/gea-regions/${g.slug}`)}
                      value={g.name}
                    >
                      <Zap className="h-4 w-4 text-[var(--muted)]" />
                      <span>{g.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.counties.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Counties">
                  {results.counties.map(c => (
                    <CommandItem
                      key={`${c.slug}-${c.state}`}
                      onSelect={() => go(`/counties/${c.slug}`)}
                      value={`${c.name} ${c.state}`}
                    >
                      {c.seal_url
                        ? <img src={c.seal_url} alt="" className="h-4 w-4 object-contain shrink-0" />
                        : <MapPin className="h-4 w-4 text-[var(--muted)]" />}
                      <span>{c.name}</span>
                      <span className="ml-1 text-xs text-[var(--muted)]">{c.state}</span>
                      <span className="ml-auto text-xs font-semibold text-[var(--muted)]">{c.grade}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
