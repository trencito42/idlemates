import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning'

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: BadgeVariant }) {
  const variants = {
    default: 'bg-primary/20 text-primary border-primary/30',
    success: 'bg-success/20 text-success border-success/30',
    danger: 'bg-danger/20 text-danger border-danger/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  )
}
