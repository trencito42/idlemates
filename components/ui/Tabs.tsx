'use client'

import { ReactNode, useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs')
  }
  return context
}

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-xl bg-surface-2 p-1 text-text-muted', className)} role="tablist">
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value: triggerValue, children, className }: TabsTriggerProps) {
  const { value, onValueChange } = useTabsContext()
  const isActive = value === triggerValue

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-base',
        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text',
        className
      )}
      onClick={() => onValueChange(triggerValue)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value: contentValue, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const { value } = useTabsContext()
  const isActive = value === contentValue

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-2 animate-fade-in', className)}
    >
      {children}
    </div>
  )
}