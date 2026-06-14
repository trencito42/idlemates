import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full border-collapse', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn('bg-surface-2', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <tr className={cn('border-b border-border', hover && 'hover:bg-overlay-hover transition-colors', className)}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider', className)}>
      {children}
    </th>
  )
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-sm text-text', className)}>
      {children}
    </td>
  )
}