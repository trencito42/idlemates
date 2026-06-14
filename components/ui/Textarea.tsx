import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
  const baseStyles = 'w-full rounded-xl bg-surface border px-4 py-2.5 text-text text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-base disabled:opacity-50 disabled:cursor-not-allowed resize-none'
    
    const variantStyles = error
      ? 'border-danger focus:ring-danger/50'
      : 'border focus:ring-accent/50'
    
    return (
      <textarea
        ref={ref}
        className={cn(baseStyles, 'text-base', className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }