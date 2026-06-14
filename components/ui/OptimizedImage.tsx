'use client'

import { useState, useRef, useEffect } from 'react'
import { useIntersectionObserver } from '@/hooks/useLazyLoad'
import { ImageSkeleton } from './LazyLoad'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder,
  fallback = '/images/placeholder.png',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [imageLoadState, setImageLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [shouldLoad, setShouldLoad] = useState(priority)
  const imageRef = useRef<HTMLImageElement>(null)
  const { elementRef, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  // Load image when it becomes visible (or immediately if priority)
  useEffect(() => {
    if (hasBeenVisible || priority) {
      setShouldLoad(true)
    }
  }, [hasBeenVisible, priority])

  // Handle image loading
  useEffect(() => {
    if (!shouldLoad || !src) return

    // Try optimized version first, fallback to original
    const optimizedSrc = optimizeSteamImage(src, width, height)
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(optimizedSrc)
      setImageLoadState('loaded')
      onLoad?.()
    }

    img.onerror = () => {
      // If optimized version fails, try original
      if (optimizedSrc !== src) {
        const fallbackImg = new Image()
        fallbackImg.onload = () => {
          setImageSrc(src)
          setImageLoadState('loaded')
          onLoad?.()
        }
        fallbackImg.onerror = () => {
          setImageSrc(fallback)
          setImageLoadState('error')
          onError?.()
        }
        fallbackImg.src = src
      } else {
        setImageSrc(fallback)
        setImageLoadState('error')
        onError?.()
      }
    }

    img.src = optimizedSrc
  }, [shouldLoad, src, width, height, fallback, onLoad, onError])

  const containerStyle = {
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
  }

  return (
    <div 
      ref={elementRef} 
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {imageLoadState === 'loading' && !imageSrc && (
        <ImageSkeleton className="absolute inset-0 rounded-inherit" />
      )}
      
      {imageSrc && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoadState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Blur-up effect for smooth loading */}
      {placeholder && imageSrc !== src && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 transition-opacity duration-300"
          style={{ 
            backgroundImage: `url(${placeholder})`,
            opacity: imageLoadState === 'loaded' ? 0 : 0.6
          }}
        />
      )}
    </div>
  )
}

// Utility to generate optimized Steam image URLs
export function optimizeSteamImage(src: string, width?: number, height?: number): string {
  if (!src.includes('steamstatic.com')) return src
  
  try {
    const url = new URL(src)
    
    // Convert to WebP format when possible
    if (url.pathname.includes('header.jpg')) {
      // Use Next.js image optimization API for Steam images
      const optimizedSrc = `/api/og/steam-image?url=${encodeURIComponent(src)}&w=${width || 460}&h=${height || 215}&q=80&f=webp`
      return optimizedSrc
    }
  } catch {
    // Fallback to original if URL parsing fails
  }
  
  return src
}

// Utility to generate low-quality placeholder for images
export function generatePlaceholder(src: string): string {
  if (!src.includes('steamstatic.com')) return src
  
  // For Steam images, we can use a smaller version as placeholder
  try {
    const url = new URL(src)
    // Replace header.jpg with capsule_sm_120.jpg for smaller placeholder
    if (url.pathname.includes('header.jpg')) {
      const appId = url.pathname.match(/\/(\d+)\//)?.[1]
      if (appId) {
        return `${url.origin}/steam/apps/${appId}/capsule_sm_120.jpg`
      }
    }
  } catch {
    // Fallback to original if URL parsing fails
  }
  
  return src
}

// Hook for bulk image preloading
export function useImagePreloader(images: string[], priority = false) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!priority || images.length === 0) return

    const preloadImage = (src: string) => {
      if (loadedImages.has(src) || loadingImages.has(src)) return

      setLoadingImages(prev => new Set(prev).add(src))

      const img = new Image()
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src))
        setLoadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(src)
          return newSet
        })
      }
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(src)
          return newSet
        })
      }
      img.src = src
    }

    // Preload images with a small delay to avoid blocking
    const preloadBatch = () => {
      images.forEach((src, index) => {
        setTimeout(() => preloadImage(src), index * 50)
      })
    }

    requestIdleCallback ? requestIdleCallback(preloadBatch) : setTimeout(preloadBatch, 100)
  }, [images, priority, loadedImages, loadingImages])

  return {
    loadedImages,
    isLoading: loadingImages.size > 0,
    progress: images.length > 0 ? loadedImages.size / images.length : 1
  }
}