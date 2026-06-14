import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Stat({ label, value, trend, className }: { label: string; value: string | number; trend?: string; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-surface border border shadow-lg p-6', className)}>
      <div className="text-sm text-text-muted mb-1">{label}</div>
      <div className="text-3xl font-bold text-text">{value}</div>
      {trend && <div className="text-xs text-success mt-2">{trend}</div>}
    </div>
  )
}

export function EmptyState({ title, description, action, icon, className }: { 
  title: string
  description: string
  action?: ReactNode
  icon?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl bg-surface border border shadow-lg p-12 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
        {icon ? (
          <i className={cn(icon, 'text-2xl text-accent')} />
        ) : (
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-2 rounded', className)}></div>
}
