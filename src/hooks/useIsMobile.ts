'use client'

import { useEffect, useState } from 'react'

// Matches Tailwind's `sm:` breakpoint at 640px
export function useIsMobile(query = '(max-width: 639px)'): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
