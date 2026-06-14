'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative z-50 animate-slide-up"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface rounded-2xl shadow-xl border border max-w-lg w-full p-6', className)}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-2xl font-semibold text-text', className)}>{children}</h2>
}

export function DialogDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-text-muted mt-2', className)}>{children}</p>
}

export function DialogFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex gap-3 justify-end mt-6', className)}>{children}</div>
}