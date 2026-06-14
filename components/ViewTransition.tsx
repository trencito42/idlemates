'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ViewTransition() {
  const pathname = usePathname()

  useEffect(() => {
    // Enable view transitions for navigation
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // Already handled by CSS
    }
  }, [pathname])

  return null
}
