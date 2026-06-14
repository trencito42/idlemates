'use client'

import dynamic from 'next/dynamic'
import { LazyLoad, CardSkeleton } from './ui/LazyLoad'

// Dynamically import FloatingGames component
const FloatingGamesComponent = dynamic(() => import('./FloatingGames'), {
  ssr: false,
  loading: () => <FloatingGamesSkeleton />
})

function FloatingGamesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-2 bg-white/10 rounded w-1/2" />
          </div>
          <div className="w-16 h-6 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function FloatingGamesLazy() {
  return (
    <LazyLoad
      delay={300}
      minHeight={200}
      skeleton={<FloatingGamesSkeleton />}
    >
      <FloatingGamesComponent />
    </LazyLoad>
  )
}