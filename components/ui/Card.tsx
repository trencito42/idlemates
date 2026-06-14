import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl bg-surface border border shadow-lg p-6',
      hover && 'transition-all duration-base hover:shadow-xl hover:border-border-hover',
      className
    )}>
      {children}
    </div>
  )
}
