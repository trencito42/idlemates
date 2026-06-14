'use client'

import { useState, useEffect } from 'react'

interface IconProps {
  name: string
  className?: string
  style?: React.CSSProperties
}

// Map of commonly used icons to reduce FontAwesome dependency
const iconMap: Record<string, string> = {
  // Navigation icons
  'bars': '☰',
  'times': '×',
  'home': '🏠',
  'user': '👤',
  'cog': '⚙️',
  'bell': '🔔',
  
  // Action icons  
  'play': '▶',
  'pause': '⏸',
  'stop': '⏹',
  'plus': '+',
  'minus': '−',
  'check': '✓',
  'cross': '✗',
  
  // Arrow icons
  'arrow-right': '→',
  'arrow-left': '←',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'chevron-right': '›',
  'chevron-left': '‹',
  'chevron-up': '⌃',
  'chevron-down': '⌄',
  
  // Social icons
  'discord': 'DC',
  'steam': 'ST',
  'twitter': 'TW',
  'github': 'GH',
  
  // Status icons
  'info': 'ℹ',
  'warning': '⚠',
  'error': '⚠',
  'success': '✓',
  
  // Misc
  'heart': '♥',
  'star': '★',
  'lock': '🔒',
  'unlock': '🔓',
  'eye': '👁',
  'eye-slash': '🙈',
  'search': '🔍',
  'filter': '🔽',
  'sort': '↕',
  'edit': '✎',
  'trash': '🗑',
  'download': '⬇',
  'upload': '⬆',
  'refresh': '🔄',
  'external-link': '↗',
  'copy': '📋',
  'save': '💾',
  'print': '🖨',
  'share': '📤',
  'bookmark': '🔖',
  'calendar': '📅',
  'clock': '🕐',
  'mail': '✉',
  'phone': '📞',
}

// Fallback FontAwesome class loader
const useFontAwesome = (iconName: string): boolean => {
  const [loaded, setLoaded] = useState(false)
  
  useEffect(() => {
    // Only load FontAwesome for icons not in our map
    if (!iconMap[iconName]) {
      // Check if FontAwesome is already loaded
      if (document.querySelector('[href*="fontawesome"]')) {
        setLoaded(true)
        return
      }
      
      // Load specific FontAwesome subset
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://kit-pro.fontawesome.com/releases/v6.7.2/css/pro.min.css`
      link.onload = () => setLoaded(true)
      document.head.appendChild(link)
    }
  }, [iconName])
  
  return loaded
}

export function OptimizedIcon({ name, className = '', style = {} }: IconProps) {
  const faLoaded = useFontAwesome(name)
  
  // Use Unicode fallback if we have it
  if (iconMap[name]) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1,
          ...style 
        }}
        role="img"
        aria-label={name}
      >
        {iconMap[name]}
      </span>
    )
  }
  
  // Fall back to FontAwesome for unmapped icons
  if (faLoaded) {
    return <i className={`fas fa-${name} ${className}`} style={style} />
  }
  
  // Loading state or empty fallback
  return (
    <span 
      className={`inline-block w-4 h-4 bg-gray-300 rounded-sm animate-pulse ${className}`}
      style={style}
    />
  )
}

// Common icon presets
export const Icons = {
  Menu: () => <OptimizedIcon name="bars" />,
  Close: () => <OptimizedIcon name="times" />,
  Home: () => <OptimizedIcon name="home" />,
  User: () => <OptimizedIcon name="user" />,
  Settings: () => <OptimizedIcon name="cog" />,
  Bell: () => <OptimizedIcon name="bell" />,
  
  Play: () => <OptimizedIcon name="play" />,
  Pause: () => <OptimizedIcon name="pause" />,
  Stop: () => <OptimizedIcon name="stop" />,
  
  ArrowRight: () => <OptimizedIcon name="arrow-right" />,
  ArrowLeft: () => <OptimizedIcon name="arrow-left" />,
  ChevronRight: () => <OptimizedIcon name="chevron-right" />,
  ChevronLeft: () => <OptimizedIcon name="chevron-left" />,
  
  Discord: () => <OptimizedIcon name="discord" className="text-[#5865f2]" />,
  Steam: () => <OptimizedIcon name="steam" className="text-[#1b2838]" />,
  
  Check: () => <OptimizedIcon name="check" className="text-green-500" />,
  Warning: () => <OptimizedIcon name="warning" className="text-yellow-500" />,
  Error: () => <OptimizedIcon name="error" className="text-red-500" />,
  Info: () => <OptimizedIcon name="info" className="text-blue-500" />,
}