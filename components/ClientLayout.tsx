'use client'

import { useState, useEffect } from 'react'
import { Preloader } from './ui/Preloader'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [showPreloader, setShowPreloader] = useState(true)

  useEffect(() => {
    // Simple preloader that always shows for a consistent experience
    const timer = setTimeout(() => {
      // Let the preloader handle its own timing
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
  }

  if (showPreloader) {
    return (
      <>
        <Preloader onComplete={handlePreloaderComplete} />
        <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>
          {children}
        </div>
      </>
    )
  }

  return <>{children}</>
}

// Performance optimization: preload critical components
export function preloadCriticalComponents() {
  // Dynamically import heavy components in the background
  if (typeof window !== 'undefined') {
    // Preload GalaxyGames component
    import('@/components/GalaxyGames').catch(() => {})
    
    // Preload FloatingGames component
    import('@/components/FloatingGames').catch(() => {})
    
    // Preload other heavy components
    import('@/components/FloatingGameStack').catch(() => {})
    import('@/components/FloatingHourStack').catch(() => {})
  }
}