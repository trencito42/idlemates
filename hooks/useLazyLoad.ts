'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '50px',
  freezeOnceVisible = true
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)

        if (isVisible && !hasBeenVisible) {
          setHasBeenVisible(true)
        }

        // If freezeOnceVisible and element has been visible, stop observing
        if (freezeOnceVisible && hasBeenVisible && isVisible) {
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, freezeOnceVisible, hasBeenVisible])

  return {
    elementRef,
    isIntersecting,
    hasBeenVisible: freezeOnceVisible ? hasBeenVisible : isIntersecting
  }
}

export function useLazyLoad(delay: number = 0) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const { elementRef, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  })

  useEffect(() => {
    if (hasBeenVisible && !shouldLoad) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldLoad(true), delay)
        return () => clearTimeout(timer)
      } else {
        setShouldLoad(true)
      }
    }
  }, [hasBeenVisible, shouldLoad, delay])

  return {
    elementRef,
    shouldLoad,
    isVisible: hasBeenVisible
  }
}