import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, asChild, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-base focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-pressed shadow-lg hover:shadow-xl',
      secondary: 'bg-surface border border hover:bg-surface-2 text-text shadow-md',
      subtle: 'bg-overlay-hover hover:bg-surface-2 text-text',
      destructive: 'bg-danger text-white hover:opacity-90 shadow-lg',
      ghost: 'hover:bg-overlay-hover text-text-muted hover:text-text',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'w-10 h-10',
    }

    const classes = cn(baseStyles, variants[variant], sizes[size], className)

    // If asChild, clone the child element and pass the className
    if (asChild && children) {
      const child = children as any
      if (child?.type) {
        return <child.type {...child.props} className={cn(classes, child.props?.className)} ref={ref} />
      }
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }