import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-text mb-1.5', className)}
        {...props}
      >
        {children}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label }