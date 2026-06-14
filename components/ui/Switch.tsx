'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  label?: string
}

export function Switch({ checked: controlledChecked, onCheckedChange, disabled, className, label }: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = controlledChecked !== undefined
  const checked = isControlled ? controlledChecked : internalChecked
  
  const handleToggle = () => {
    if (disabled) return
    const newValue = !checked
    if (!isControlled) {
      setInternalChecked(newValue)
    }
    onCheckedChange?.(newValue)
  }
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-accent' : 'bg-surface-2',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-base',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}