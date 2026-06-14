import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'accent'

export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  const variants = {
    default: 'bg-surface-2 text-text border-border',
    success: 'bg-success-subtle text-success border-success',
    danger: 'bg-danger-subtle text-danger border-danger',
    warning: 'bg-warning-subtle text-warning border-warning',
    accent: 'bg-accent/10 text-accent border-accent/30',
  }
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border', variants[variant], className)}>
      {children}
    </span>
  )
}
