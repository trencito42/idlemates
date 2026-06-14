'use client'

import { useEffect } from 'react'

// Simple resource preloader - only preload what we immediately use
const CriticalResourcePreloader = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only preload fonts that are immediately used
    const fontResources: { href: string; as: string; type?: string }[] = []
    

    // Use a slight delay to avoid preload warnings
    setTimeout(() => {
      fontResources.forEach(({ href, as, type }) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = href
        link.as = as
        if (type) link.type = type
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }, 100)
  }, [])

  return null
}

const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Simple performance tracking without web-vitals to avoid SSR issues
    const trackPerformance = () => {
      try {
        // Track page load time
        if (typeof performance !== 'undefined' && performance.timing) {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
          console.log('Page load time:', loadTime + 'ms')
          
          // Track paint metrics if available
          if ('getEntriesByType' in performance) {
            const paintEntries = performance.getEntriesByType('paint')
            paintEntries.forEach(entry => {
              console.log(`${entry.name}:`, entry.startTime + 'ms')
            })
            
            // Track LCP if available
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
            if (lcpEntries.length > 0) {
              const lcp = lcpEntries[lcpEntries.length - 1]
              console.log('LCP:', lcp.startTime + 'ms')
            }
          }
        }
      } catch (error) {
        console.warn('Performance tracking error:', error)
      }
    }

    // Additional performance monitoring with PerformanceObserver
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming
            console.log('Navigation Timing:', {
              DNS: nav.domainLookupEnd - nav.domainLookupStart,
              TCP: nav.connectEnd - nav.connectStart,
              Request: nav.responseStart - nav.requestStart,
              Response: nav.responseEnd - nav.responseStart,
              DOM: nav.domInteractive - nav.responseEnd,
              Resources: nav.loadEventStart - nav.domContentLoadedEventEnd
            })
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP Element:', entry)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] })
      } catch (e) {
        // Graceful fallback for unsupported browsers
      }

      // Cleanup function
      return () => {
        observer.disconnect()
      }
    } else {
      // Fallback for browsers without PerformanceObserver
      setTimeout(trackPerformance, 1000)
    }
  }, [])

  return null
}

export default PerformanceMonitor
export { CriticalResourcePreloader }