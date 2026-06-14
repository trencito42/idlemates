'use client'

import { useEffect, useState } from 'react'
import { Preloader } from './ui/Preloader'

export function GlobalPreloader() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show only when really needed: if load is slow (>600ms) and page isn't complete
    let didLoad = document.readyState === 'complete'
    const onLoad = () => {
      didLoad = true
      setShow(false)
    }
    window.addEventListener('load', onLoad)

    const t = setTimeout(() => {
      if (!didLoad && document.readyState !== 'complete') {
        setShow(true)
      }
    }, 600)

    return () => {
      window.removeEventListener('load', onLoad)
      clearTimeout(t)
    }
  }, [])

  const handleComplete = () => {
    setShow(false)
  }

  if (!show) return null

  return <Preloader onComplete={handleComplete} />
}