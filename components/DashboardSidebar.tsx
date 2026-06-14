'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getAvatarUrl } from '@/lib/utils'

export default function DashboardSidebar({ session }: { session: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/app/dashboard' },
    { icon: 'fa-solid fa-credit-card', label: 'Billing', href: '/app/billing' },
    { icon: 'fa-solid fa-shield', label: 'Security', href: '/app/security' },
    { icon: 'fa-solid fa-circle-info', label: 'FAQ', href: '/faq' },
  ]

  return (
    <>
      {/* Mobile Header */}
  <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-accent/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="text-xl font-bold text-text">
            IdleMates
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-overlay-hover transition-colors text-text"
          >
            <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-bg border-r border-accent/10 z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full bg-bg">
          <img src="/logo.svg" alt="IdleMates" className="w-6 h-6" /> {/* Logo */}
          <div className="p-6 border-b border-accent/10 hidden lg:block">
            <Link href="/" className="text-2xl font-bold text-text">
              IdleMates
            </Link>
            <p className="text-xs text-text-muted mt-1">Steam Boost Platform</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-accent text-white' 
                      : 'text-text-muted hover:text-text hover:bg-overlay-hover'
                    }
                  `}
                >
                  <i className={`${item.icon} w-5 text-center`}></i>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          {session?.user && (
            <div className="p-4 border-t border-accent/10">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-overlay-hover mb-2">
                <img
                  src={getAvatarUrl(session.user.email, (session.user as any).avatarUrl, 80)}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-text">{session.user.email}</p>
                  <p className="text-xs text-text-muted">Free Plan</p>
                </div>
              </div>
              <Link
                href="/api/auth/signout"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-overlay-hover transition-colors"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
