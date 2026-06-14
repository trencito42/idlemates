'use client'

import React from 'react'

type LogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'mark'
}

const sizeMap = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16',
}

export function IdleMatesLogo({ className = '', size = 'md', variant = 'mark' }: LogoProps) {
  const combinedClasses = `inline-block ${sizeMap[size]} ${className}`
  
  if (variant === 'mark') {
    return (
      <svg 
        className={`logo ${combinedClasses}`}
        viewBox="0 0 236 236" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="IdleMates"
      >
        <path 
          d="M218 128C218 141.132 215.413 154.136 210.388 166.268C205.362 178.401 197.997 189.425 188.711 198.711C179.425 207.997 168.401 215.362 156.268 220.388C144.136 225.413 131.132 228 118 228C104.868 228 91.8642 225.413 79.7317 220.388C67.5991 215.362 56.5752 207.997 47.2893 198.711C38.0035 189.425 30.6375 178.401 25.612 166.268C20.5866 154.136 18 141.132 18 128L218 128Z" 
          fill="#8A5CFF"
        />
        <circle cx="42.375" cy="32.375" r="24.375" fill="#8A5CFF"/>
      </svg>
    )
  }
  
  return (
    <svg 
      className={`logo ${combinedClasses}`}
      viewBox="0 0 236 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IdleMates"
    >
      <path 
        d="M218 128C218 141.132 215.413 154.136 210.388 166.268C205.362 178.401 197.997 189.425 188.711 198.711C179.425 207.997 168.401 215.362 156.268 220.388C144.136 225.413 131.132 228 118 228C104.868 228 91.8642 225.413 79.7317 220.388C67.5991 215.362 56.5752 207.997 47.2893 198.711C38.0035 189.425 30.6375 178.401 25.612 166.268C20.5866 154.136 18 141.132 18 128L218 128Z" 
        fill="#8A5CFF"
        transform="scale(0.25) translate(0, 60)"
      />
      <circle cx="10.5" cy="8" r="6" fill="#8A5CFF"/>
      <text x="70" y="40" fill="currentColor" fontSize="32" fontWeight="700" fontFamily="var(--font-proxima-nova)">
        IdleMates
      </text>
    </svg>
  )
}

// Alias for backward compatibility
export const Logo = IdleMatesLogo