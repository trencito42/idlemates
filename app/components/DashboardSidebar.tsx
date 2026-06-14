'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardSidebar({ session }: { session: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/app/dashboard' },
    { icon: 'fa-solid fa-credit-card', label: 'Billing', href: '/app/billing' },
    { icon: 'fa-solid fa-circle-info', label: 'FAQ', href: '/faq' },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="text-xl font-bold text-fg">
            IdleMates
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-fg"
          >
            <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-white/5 z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full bg-card">
          <img src="/logo.svg" alt="IdleMates" className="w-6 h-6" /> {/* Logo */}
          <div className="p-6 border-b border-white/5 hidden lg:block">
            <Link href="/" className="text-2xl font-bold text-fg">
              IdleMates
            </Link>
            <p className="text-xs text-muted mt-1">Steam Boost Platform</p>
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
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
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
          </nav>

          {/* User Section */}
          {session?.user && (
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {session.user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-fg">{session.user.email}</p>
                  <p className="text-xs text-muted">Free Plan</p>
                </div>
              </div>
              <Link
                href="/api/auth/signout"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-muted hover:text-fg hover:bg-white/5 transition-colors"
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
