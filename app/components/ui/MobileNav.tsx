'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNavProps {
  items: {
    icon: string
    label: string
    href: string
    onClick?: () => void
  }[]
  isOpen: boolean
  onClose: () => void
  title?: string
  logo?: string
  subtitle?: string
  footer?: React.ReactNode
  className?: string
}

export default function MobileNav({ 
  items, 
  isOpen, 
  onClose,
  title = 'IdleMates',
  logo = '/logo.svg',
  subtitle,
  footer,
  className = ''
}: MobileNavProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className={`fixed top-0 left-0 h-[100dvh] w-80 bg-card border-r border-white/10 shadow-2xl z-[999] lg:hidden overflow-hidden ${className}`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <Link href="/" className="flex items-center gap-3" onClick={onClose}>
                  <img src={logo} alt={title} className="w-8 h-8" />
                  <div>
                    <h2 className="text-lg font-bold text-fg">{title}</h2>
                    {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
                  </div>
                </Link>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-fg"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto overscroll-contain">
                <div className="space-y-2 pb-safe">
                  {items.map((item, idx) => {
                    const isActive = pathname === item.href
                    
                    if (item.onClick) {
                      return (
                        <button
                          key={`${item.href}-${idx}`}
                          onClick={() => {
                            item.onClick?.()
                            onClose()
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                            ${item.label === 'Logout' 
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                              : 'text-muted hover:text-fg hover:bg-white/5'
                            }
                          `}
                        >
                          <i className={`${item.icon} w-5 text-center`}></i>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      )
                    }
                    
                    return (
                      <Link
                        key={`${item.href}-${idx}`}
                        href={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${isActive 
                            ? 'bg-primary text-white' 
                            : 'text-muted hover:text-fg hover:bg-white/5'
                          }
                        `}
                      >
                        <i className={`${item.icon} w-5 text-center`}></i>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </nav>

              {/* Footer */}
              {footer && (
                <div className="p-4 border-t border-white/10">
                  {footer}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}