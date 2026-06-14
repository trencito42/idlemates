import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    const baseStyles = 'w-full rounded-xl bg-surface border px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-base disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-[url(\'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%239EA0AC\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E\')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10'
    
    const variantStyles = error
      ? 'border-danger focus:ring-danger/50'
      : 'border focus:ring-accent/50'
    
    return (
      <select
        ref={ref}
        className={cn(baseStyles, 'text-base', className)}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

export { Select }