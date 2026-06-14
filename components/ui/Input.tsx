import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, ...props }, ref) => {
  const baseStyles = 'w-full rounded-xl bg-surface border px-4 py-2.5 text-text text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-base disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantStyles = error
      ? 'border-danger focus:ring-danger/50'
      : success
      ? 'border-success focus:ring-success/50'
      : 'border focus:ring-accent/50'
    
    return (
      <input
        ref={ref}
        className={cn(baseStyles, 'text-base', className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }