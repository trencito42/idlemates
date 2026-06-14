'use client'

import { ReactNode, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  duration?: number
  onClose?: () => void
}

export function Toast({ title, description, variant = 'default', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const variants = {
    default: 'bg-surface border-border',
    success: 'bg-success-subtle border-success text-success',
    warning: 'bg-warning-subtle border-warning text-warning',
    danger: 'bg-danger-subtle border-danger text-danger',
  }

  const icons = {
    default: 'fa-circle-info',
    success: 'fa-circle-check',
    warning: 'fa-triangle-exclamation',
    danger: 'fa-circle-exclamation',
  }

  if (!isVisible) return null

  return createPortal(
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border shadow-xl animate-slide-up',
        variants[variant]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <i className={`fa-solid ${icons[variant]} text-lg mt-0.5`} />
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="text-text-muted hover:text-text transition-colors"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>
    </div>,
    document.body
  )
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([])

  const toast = (props: ToastProps) => {
    const id = toastCount++
    setToasts((prev) => [...prev, { ...props, id }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, (props.duration || 5000) + 300)
  }

  const ToastContainer = () => (
    <>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))} />
      ))}
    </>
  )

  return { toast, ToastContainer }
}