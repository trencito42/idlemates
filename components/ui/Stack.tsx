import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StackProps {
  children: ReactNode
  className?: string
  direction?: 'row' | 'column'
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

const spacingClasses = {
  row: {
    xs: 'gap-x-2',
    sm: 'gap-x-3',
    md: 'gap-x-4',
    lg: 'gap-x-6',
    xl: 'gap-x-8',
  },
  column: {
    xs: 'gap-y-2',
    sm: 'gap-y-3',
    md: 'gap-y-4',
    lg: 'gap-y-6',
    xl: 'gap-y-8',
  },
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function Stack({ 
  children, 
  className, 
  direction = 'column', 
  spacing = 'md',
  align = 'stretch',
  justify = 'start'
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        spacingClasses[direction][spacing],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  )
}