'use client'

import { useEffect, useState } from 'react'

type Props = {
  id: string
  enabled: boolean
  type: 'info' | 'success' | 'warning' | 'danger'
  message: string
  linkLabel?: string
  linkUrl?: string
}

export default function AnnouncementBarClient({ id, enabled, type, message, linkLabel, linkUrl }: Props) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (!enabled || !message) {
      setHidden(true)
      return
    }
    const key = `announcement:dismissed:${id}`
    const dismissed = typeof window !== 'undefined' ? localStorage.getItem(key) === '1' : false
    setHidden(dismissed)
  }, [enabled, id, message])

  if (!enabled || !message || hidden) return null

  const style =
    type === 'success'
      ? 'text-green-200 bg-green-500/15 border-green-500/30'
      : type === 'warning'
      ? 'text-yellow-200 bg-yellow-500/15 border-yellow-500/30'
      : type === 'danger'
      ? 'text-red-200 bg-red-500/15 border-red-500/30'
      : 'text-blue-200 bg-blue-500/15 border-blue-500/30'

  const dismiss = () => {
    const key = `announcement:dismissed:${id}`
    try { localStorage.setItem(key, '1') } catch {}
    setHidden(true)
  }

  return (
    <div className={`border-b border-border/10 backdrop-blur ${style}`}>
      <div className="container mx-auto px-4 md:px-6 py-2 text-sm flex items-center gap-3">
        <i className="fa-solid fa-bullhorn opacity-80"></i>
        <span className="truncate">{message}</span>
        <div className="ml-auto flex items-center gap-2">
          {linkLabel && (
            <a
              href={linkUrl || '#'}
              className="px-2 py-1 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors text-white/90"
            >
              {linkLabel}
            </a>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
