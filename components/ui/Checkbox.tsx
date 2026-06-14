'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            'h-4 w-4 rounded border border-border text-accent focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-base disabled:opacity-50 disabled:cursor-not-allowed',
            'checked:bg-accent checked:border-accent',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-text cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }