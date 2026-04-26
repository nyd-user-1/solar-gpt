import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]',
        className
      )}
      {...props}
    />
  )
}

export { Badge }
