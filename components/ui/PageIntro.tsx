import type { ReactNode } from 'react'

// Simple fade+slide wrapper for consistent page intro animations
export function PageIntro({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`animate-fade-in md:animate-slide-up ${className}`.trim()}>
      {children}
    </div>
  )
}
