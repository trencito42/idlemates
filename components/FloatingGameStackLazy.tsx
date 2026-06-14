'use client'

import dynamic from 'next/dynamic'
import { LazyLoad, CardSkeleton } from './ui/LazyLoad'

// Dynamically import FloatingGameStack component
const FloatingGameStackComponent = dynamic(() => import('./FloatingGameStack'), {
  ssr: false,
  loading: () => <FloatingGameStackSkeleton />
})

function FloatingGameStackSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-[3/4] bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <div className="w-full h-2/3 bg-white/10" />
          <div className="p-2 space-y-2">
            <div className="h-3 bg-white/10 rounded" />
            <div className="h-2 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FloatingGameStackLazy() {
  return (
    <LazyLoad
      delay={400}
      minHeight={400}
      skeleton={<FloatingGameStackSkeleton />}
    >
      <FloatingGameStackComponent />
    </LazyLoad>
  )
}