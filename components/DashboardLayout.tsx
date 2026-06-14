'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from './ui/MobileNav'

function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/app/dashboard' },
    { icon: 'fa-solid fa-credit-card', label: 'Billing', href: '/app/billing' },
    { icon: 'fa-solid fa-circle-info', label: 'FAQ', href: '/faq' }
  ]

  const userSection = session?.user ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/15">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-md shadow-primary/10">
          {session.user.email?.[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-fg">{session.user.email}</p>
          <p className="text-xs text-muted">Free Plan</p>
        </div>
      </div>
      <button 
        onClick={() => void signOut({ callbackUrl: '/' })}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-muted hover:text-fg hover:bg-primary/10 border border-primary/10 transition-colors"
      >
        <i className="fa-solid fa-arrow-right-from-bracket" />
        <span>Sign Out</span>
      </button>
    </div>
  ) : null

  return (
    <>
    <div className="min-h-screen bg-bg">
  <div className="lg:hidden sticky top-0 z-50 border-b border-primary/20 bg-card/90 backdrop-blur-xl transition-shadow shadow-md">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.svg" alt="IdleMates" width={24} height={24} className="w-6 h-6" />
              <span className="text-xl font-bold text-fg">IdleMates</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
            >
              <i className="fa-solid fa-bars text-xl" />
            </button>
          </div>
        </div>

  <aside className="fixed top-0 left-0 h-full w-64 bg-surface border-r border-primary/20 shadow-lg shadow-primary/5 z-40 hidden lg:block">
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-50 border-b border-primary/20 bg-card/90 backdrop-blur-xl transition-shadow p-6">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.svg" alt="IdleMates" width={32} height={32} className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold text-fg">IdleMates</h2>
                  <p className="text-xs text-muted">Steam Boost Platform</p>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                        : 'text-text-muted hover:text-text hover:bg-primary/10'
                      }
                    `}
                  >
                    <i className={`${item.icon} w-5 text-center`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {session?.user && (
              <div className="p-4 border-t border-primary/20">
                {userSection}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile dropdown navigation */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[999] lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute top-16 right-4 w-64 bg-card/95 backdrop-blur-xl rounded-xl border border-primary/20 shadow-xl shadow-primary/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
              
              {/* Header with user info */}
              {session?.user && (
                <div className="sticky top-0 z-50 p-4 border-b border-primary/20 bg-card/95 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-md shadow-primary/10">
                      {session.user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-fg">{session.user.email}</p>
                      <p className="text-xs text-muted">Free Plan</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation items */}
              <div className="p-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1
                        ${isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                          : 'text-text-muted hover:text-text hover:bg-primary/10'
                        }
                      `}
                    >
                      <i className={`${item.icon} w-5 text-center`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
                
                {/* Sign out button */}
                <button 
                  onClick={() => void signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="container relative z-10 mx-auto px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default DashboardLayout
