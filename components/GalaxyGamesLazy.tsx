'use client'

import dynamic from 'next/dynamic'
import { LazyLoad, GalaxySkeleton } from './ui/LazyLoad'

// Dynamically import the heavy GalaxyGames component
const GalaxyGamesComponent = dynamic(() => import('./GalaxyGames'), {
  ssr: false,
  loading: () => <GalaxySkeleton />
})

export default function GalaxyGames() {
  return (
    <LazyLoad
      delay={200}
      minHeight="100%"
      skeleton={<GalaxySkeleton />}
      className="absolute inset-0"
    >
      <GalaxyGamesComponent />
    </LazyLoad>
  )
}

// Export the original component for direct use when needed
export { default as GalaxyGamesOriginal } from './GalaxyGames'