'use client'

import { useEffect, useState } from 'react'

interface PreloaderProps {
  onComplete?: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [visible, setVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'wink' | 'exit'>('enter')

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Phase 1: Enter (0-800ms)
    timers.push(setTimeout(() => {
      setAnimationPhase('wink')
    }, 800))

    // Phase 2: Wink (800-1600ms) 
    timers.push(setTimeout(() => {
      setAnimationPhase('exit')
    }, 1600))

    // Phase 3: Exit and hide (1600-2200ms)
    timers.push(setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 2200))

    // Cleanup function
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        animationPhase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #1a1824 0%, #2d1b3d 100%)'
      }}
    >
      {/* Main logo container - no background div */}
      <div 
        className={`relative transition-all duration-700 ${
          animationPhase === 'enter' ? 'scale-0 rotate-180' : 
          animationPhase === 'exit' ? 'scale-125 rotate-12' : 'scale-100 rotate-0'
        }`}
      >
        <svg 
          className={`logo w-16 h-16 ${animationPhase === 'wink' ? 'boot' : ''}`}
          viewBox="0 0 236 236" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          aria-label="IdleMates"
        >
          {/* Main face - same as navigation logo */}
          <path 
            d="M218 128C218 141.132 215.413 154.136 210.388 166.268C205.362 178.401 197.997 189.425 188.711 198.711C179.425 207.997 168.401 215.362 156.268 220.388C144.136 225.413 131.132 228 118 228C104.868 228 91.8642 225.413 79.7317 220.388C67.5991 215.362 56.5752 207.997 47.2893 198.711C38.0035 189.425 30.6375 178.401 25.612 166.268C20.5866 154.136 18 141.132 18 128L218 128Z" 
            fill="#8A5CFF"
          />
          
          {/* Eye that winks - same as navigation logo */}
          <circle cx="42.375" cy="32.375" r="24.375" fill="#8A5CFF"/>
        </svg>

      </div>
    </div>
  )
}

// Preloader uses the same CSS animations as the navigation logo (wink + smirk)
// See globals.css for .logo.boot animations