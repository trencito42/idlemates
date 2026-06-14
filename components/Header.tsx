'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import MobileNav from './ui/MobileNav'
import { ThemeToggle } from './ui/theme-toggle'
import { Logo } from './ui/logo'
import { Button } from './ui/Button'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './ui/DropdownMenu'
import { getAvatarUrl } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)

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

  // Scroll shadow/elevation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trigger logo animation on first paint
  useEffect(() => {
    const el = logoRef.current?.querySelector('svg.logo')
    if (!el) return
    el.classList.add('boot')
    const t = setTimeout(() => el.classList.remove('boot'), 700)
    return () => clearTimeout(t)
  }, [])

  const navItems = [
    { icon: 'fa-duotone fa-tag', label: 'Pricing', href: '/pricing' },
    { icon: 'fa-duotone fa-circle-question', label: 'FAQ', href: '/faq' },
    { icon: 'fa-duotone fa-scale-balanced', label: 'Legal', href: '/legal' },
    { icon: 'fa-brands fa-discord', label: 'Discord', href: '/discord' },
    ...(session?.user 
      ? [
          { icon: 'fa-duotone fa-gauge-high', label: 'Dashboard', href: '/app/dashboard' },
          { icon: 'fa-duotone fa-crown', label: 'My Plan', href: '/app/billing' },
          { icon: 'fa-duotone fa-shield', label: 'Security', href: '/app/security' },
          ...(session.user.role === 'ADMIN' ? [{ icon: 'fa-duotone fa-shield-halved', label: 'Admin', href: '/admin' }] : []),
          { icon: 'fa-duotone fa-right-from-bracket', label: 'Logout', href: '#', onClick: () => signOut({ callbackUrl: '/' }) }
        ]
      : [
          { icon: 'fa-duotone fa-right-to-bracket', label: 'Login', href: '/auth/login' },
          { icon: 'fa-duotone fa-user-plus', label: 'Register', href: '/auth/register' }
        ]
    )
  ]

  return (
    <header className={`sticky top-0 z-20 border-b border-accent/20 bg-card/90 backdrop-blur-xl transition-shadow ${scrolled ? 'shadow-2xl' : ''}`}>
      <div className="container relative z-20 mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div ref={logoRef} className="flex items-center">
              <Link href="/" className="flex items-center gap-2 transition-all hover:opacity-80 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Logo size="sm" variant="mark" />
                </div>
                <span className="hidden sm:inline-block text-base font-bold text-white group-hover:text-primary transition-colors">IdleMates</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Main navigation">
              <Link href="/pricing" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/pricing' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white hover:bg-primary/5 hover:border-primary/10 border border-transparent'}`} aria-current={pathname === '/pricing' ? 'page' : undefined}>
                Pricing
              </Link>
              <Link href="/faq" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/faq' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white hover:bg-primary/5 hover:border-primary/10 border border-transparent'}`} aria-current={pathname === '/faq' ? 'page' : undefined}>
                FAQ
              </Link>
              <Link href="/legal" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname?.startsWith('/legal') ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white hover:bg-primary/5 hover:border-primary/10 border border-transparent'}`} aria-current={pathname?.startsWith('/legal') ? 'page' : undefined}>
                Legal
              </Link>
              
              <a href="/discord" target="_blank" rel="noopener" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-primary transition-all">
                <i className="fa-brands fa-discord"></i>
                Discord
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            
            {status === 'loading' ? (
              <div className="text-sm text-text-muted">Loading...</div>
            ) : (
              <>
                {/* Desktop Navigation */}
                <div className="md:flex hidden items-center gap-3">
                  {session?.user ? (
                    <DropdownMenu
                      align="end"
                      trigger={
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all">
                          <img
                            src={getAvatarUrl(session.user.email, (session.user as any).avatarUrl, 64)}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover border border-white/10"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(session.user.email, null, 64) }}
                          />
                          <span className="text-sm font-semibold text-white">{session.user.email?.split('@')[0]}</span>
                          <i className="fa-duotone fa-chevron-down text-xs text-primary"></i>
                        </button>
                      }
                    >
                      <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
                      <DropdownMenuItem icon="fa-duotone fa-gauge-high" onClick={() => window.location.href = '/app/dashboard'}>
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem icon="fa-duotone fa-crown" onClick={() => window.location.href = '/app/billing'}>
                        My Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem icon="fa-duotone fa-shield" onClick={() => window.location.href = '/app/security'}>
                        Security
                      </DropdownMenuItem>
                      {session.user.role === 'ADMIN' && (
                        <DropdownMenuItem icon="fa-duotone fa-shield-halved" onClick={() => window.location.href = '/admin'}>
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem icon="fa-duotone fa-right-from-bracket" destructive onClick={() => signOut({ callbackUrl: '/' })}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => window.location.href = '/auth/login'}
                        className="hover:bg-primary/10 text-white border border-transparent"
                      >
                        <i className="fa-duotone fa-right-to-bracket mr-1.5 text-primary"></i>
                        Login
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => window.location.href = '/auth/register'}
                        className="border border-primary/20"
                      >
                        <i className="fa-duotone fa-user-plus mr-1.5"></i>
                        Register
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                  aria-label="Open mobile menu"
                >
                  <i className="fa-duotone fa-bars text-lg text-primary"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <MobileNav
        items={navItems}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        avatarUrl={(session?.user as any)?.avatarUrl || undefined}
        email={session?.user?.email || null}
      />
      {/* Decorative bottom hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </header>
  )
}
