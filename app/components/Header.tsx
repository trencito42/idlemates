'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import MobileNav from '@/components/ui/MobileNav'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Logo } from '@/components/ui/logo'

export default function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { icon: 'fa-solid fa-tag', label: 'Pricing', href: '/pricing' },
    { icon: 'fa-solid fa-circle-question', label: 'FAQ', href: '/faq' },
  { icon: 'fa-solid fa-scale-balanced', label: 'Legal', href: '/legal' },
    ...(session?.user 
      ? [
          { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/app/dashboard' },
          { icon: 'fa-solid fa-crown', label: 'My Plan', href: '/app/billing' },
          ...(session.user.role === 'ADMIN' ? [{ icon: 'fa-solid fa-shield-halved', label: 'Admin', href: '/admin' }] : []),
          { icon: 'fa-solid fa-right-from-bracket', label: 'Logout', href: '#', onClick: () => signOut({ callbackUrl: '/' }) }
        ]
      : [
          { icon: 'fa-solid fa-right-to-bracket', label: 'Login', href: '/auth/login' },
          { icon: 'fa-solid fa-user-plus', label: 'Register', href: '/auth/register' }
        ]
    )
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/95 backdrop-blur-sm">
      <nav className="container-page">
        <div className="flex items-center justify-between h-24">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" variant="mark" />
            <span className="text-xl font-bold">IdleMates</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-sm font-medium text-muted hover:text-fg transition">
              Pricing
            </Link>
            <Link href="/faq" className="text-sm font-medium text-muted hover:text-fg transition">
              FAQ
            </Link>
            <Link href="/legal" className="text-sm font-medium text-muted hover:text-fg transition">
              Legal
            </Link>
            <Link href="/discord" className="text-sm font-medium text-primary hover:text-fg transition flex items-center gap-1">
              <i className="fa-brands fa-discord"></i>
              Discord
            </Link>
          </div>

          <div className="flex items-center gap-3">
            
            {status === 'loading' ? (
              <div className="text-sm text-text-muted">...</div>
            ) : (
              <>
                {/* Desktop Navigation */}
                <div className="md:flex hidden items-center gap-3">
                  {session?.user ? (
                    <>
                      
                      {/* User Menu Dropdown */}
                      <div className="relative" ref={menuRef}>
                        <button
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <i className="fa-duotone fa-user text-white text-sm"></i>
                          </div>
                          <span className="text-sm font-semibold text-white">{session.user.email?.split('@')[0]}</span>
                          <i className={`fa-solid fa-chevron-down text-xs text-primary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
                        </button>

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                          <div className="absolute right-0 mt-3 w-64 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 bg-primary/5 border-b border-white/10">
                              <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Account</div>
                              <div className="text-sm font-medium text-white truncate">{session.user.email}</div>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="py-2">
                              <Link
                                href="/app/dashboard"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors group"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <i className="fa-duotone fa-gauge-high text-primary"></i>
                                </div>
                                <span className="text-white">Dashboard</span>
                              </Link>
                              
                              <Link
                                href="/app/billing"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors group"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <i className="fa-duotone fa-crown text-primary"></i>
                                </div>
                                <span className="text-white">My Plan</span>
                              </Link>
                              
                              {session.user.role === 'ADMIN' && (
                                <Link
                                  href="/admin"
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors group"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <i className="fa-duotone fa-shield-halved text-primary"></i>
                                  </div>
                                  <span className="text-white">Admin Panel</span>
                                </Link>
                              )}
                            </div>
                            
                            {/* Sign Out */}
                            <div className="border-t border-white/10 mt-2 pt-2">
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false)
                                  signOut({ callbackUrl: '/' })
                                }}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-red-500/10 transition-colors w-full text-left group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                  <i className="fa-duotone fa-right-from-bracket text-red-400"></i>
                                </div>
                                <span className="text-red-400 group-hover:text-red-300">Sign Out</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="text-sm font-medium text-muted hover:text-fg transition">
                        Login
                      </Link>
                      <Link href="/auth/register" className="btn btn-sm">
                        Register
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-fg"
                >
                  <i className="fa-solid fa-bars text-xl"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <MobileNav
        items={navItems}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        avatarUrl={(session?.user as any)?.avatarUrl || undefined}
        email={session?.user?.email || null}
      />
    </header>
  )
}
