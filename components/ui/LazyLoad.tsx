'use client'

import { ReactNode, Suspense } from 'react'
import { useLazyLoad } from '@/hooks/useLazyLoad'

interface LazyLoadProps {
  children: ReactNode
  fallback?: ReactNode
  delay?: number
  className?: string
  minHeight?: string | number
  skeleton?: ReactNode
}

export function LazyLoad({ 
  children, 
  fallback, 
  delay = 0, 
  className = '', 
  minHeight = 'auto',
  skeleton
}: LazyLoadProps) {
  const { elementRef, shouldLoad, isVisible } = useLazyLoad(delay)

  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight

  return (
    <div 
      ref={elementRef} 
      className={`transition-opacity duration-300 ${className}`}
      style={{ minHeight: minHeightStyle }}
    >
      {shouldLoad ? (
        <Suspense fallback={skeleton || fallback || <LazyLoadSkeleton />}>
          {children}
        </Suspense>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {skeleton || fallback || <LazyLoadSkeleton />}
        </div>
      )}
    </div>
  )
}

export function LazyLoadSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white/5 rounded-xl h-full min-h-[200px] flex flex-col justify-center items-center space-y-4">
        {/* Loading icon */}
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        
        {/* Loading bars */}
        <div className="space-y-2 w-3/4 max-w-xs">
          <div className="h-3 bg-white/10 rounded animate-pulse" />
          <div className="h-3 bg-white/10 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-white/10 rounded animate-pulse w-3/5" />
        </div>
        
        {/* Loading text */}
        <div className="text-xs text-white/40 animate-pulse">
          Loading content...
        </div>
      </div>
    </div>
  )
}

// Skeleton variants for specific components
export function GalaxySkeleton() {
  return (
    <div className="absolute inset-0 bg-dark animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      {/* Floating dots to simulate stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="text-sm text-primary/60">Loading galaxy...</div>
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-border/10 rounded-xl p-4 animate-pulse">
      <div className="space-y-3">
        {/* Header */}
        <div className="h-4 bg-white/10 rounded w-3/4" />
        
        {/* Content lines */}
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
          <div className="h-3 bg-white/10 rounded w-4/6" />
        </div>
        
        {/* Button placeholder */}
        <div className="h-8 bg-white/10 rounded w-24" />
      </div>
    </div>
  )
}

export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 animate-pulse flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 text-white/20">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}