'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DropdownMenu({ trigger, children, align = 'end', className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 min-w-[12rem] bg-card/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl py-2 z-50 animate-slide-down',
            alignClasses[align],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className,
  icon,
  destructive
}: { 
  children: ReactNode
  onClick?: () => void
  className?: string
  icon?: string
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left hover:bg-primary/10',
        destructive 
          ? 'text-red-400 hover:bg-red-500/10' 
          : 'text-text',
        className
      )}
    >
      {icon && (
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', 
          destructive ? 'bg-red-500/10' : 'bg-primary/10'
        )}>
          <i className={cn(
            icon.replace('fa-solid', 'fa-duotone'), 
            destructive ? 'text-red-400' : 'text-primary'
          )} />
        </div>
      )}
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-white/10 my-2" />
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 ', className)}>
      <div className="text-xs text-primary font-medium">Account</div>
      <div className="text-white text-sm truncate">{children}</div>
    </div>
  )
}