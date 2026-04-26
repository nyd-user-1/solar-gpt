'use client'

import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]

interface CarouselProps {
  opts?: CarouselOptions
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

const CarouselContext = React.createContext<CarouselProps & {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('useCarousel must be used within a <Carousel />')
  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(({ orientation = 'horizontal', opts, setApi, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === 'horizontal' ? 'x' : 'y',
  })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)
    return () => { api.off('reInit', onSelect); api.off('select', onSelect) }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider value={{ carouselRef, api, opts, orientation, scrollPrev: () => api?.scrollPrev(), scrollNext: () => api?.scrollNext(), canScrollPrev, canScrollNext }}>
      <div ref={ref} className={cn('relative', className)} aria-roledescription="carousel" {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = 'Carousel'

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel()
    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div ref={ref} className={cn('flex', orientation === 'horizontal' ? '-ml-2' : '-mt-2 flex-col', className)} {...props} />
      </div>
    )
  }
)
CarouselContent.displayName = 'CarouselContent'

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel()
    return (
      <div ref={ref} role="group" aria-roledescription="slide"
        className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-2' : 'pt-2', className)}
        {...props}
      />
    )
  }
)
CarouselItem.displayName = 'CarouselItem'

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { scrollPrev, canScrollPrev } = useCarousel()
    return (
      <button
        ref={ref}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] transition-colors disabled:opacity-30 hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]',
          className
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    )
  }
)
CarouselPrevious.displayName = 'CarouselPrevious'

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { scrollNext, canScrollNext } = useCarousel()
    return (
      <button
        ref={ref}
        onClick={scrollNext}
        disabled={!canScrollNext}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--muted)] transition-colors disabled:opacity-30 hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]',
          className
        )}
        {...props}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    )
  }
)
CarouselNext.displayName = 'CarouselNext'

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
