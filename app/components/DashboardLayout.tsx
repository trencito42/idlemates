'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
    { icon: 'fa-solid fa-shield', label: 'Security', href: '/app/security' },
    { icon: 'fa-solid fa-circle-info', label: 'FAQ', href: '/faq' }
  ]

  const userSection = session?.user ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {session.user.email?.[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-fg">{session.user.email}</p>
          <p className="text-xs text-muted">Free Plan</p>
        </div>
      </div>
      <button 
        onClick={() => void signOut({ callbackUrl: '/' })}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-muted hover:text-fg hover:bg-white/5 transition-colors"
      >
        <i className="fa-solid fa-arrow-right-from-bracket" />
        <span>Sign Out</span>
      </button>
    </div>
  ) : null

  return (
    <>
      <div className="min-h-screen bg-bg">
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="IdleMates" className="w-6 h-6" />
              <span className="text-xl font-bold text-fg">IdleMates</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-fg"
            >
              <i className="fa-solid fa-bars text-xl" />
            </button>
          </div>
        </div>

        <aside className="fixed top-0 left-0 h-full w-64 bg-card border-r border-white/10 z-40 hidden lg:block">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/10">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.svg" alt="IdleMates" className="w-8 h-8" />
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
                        : 'text-muted hover:text-fg hover:bg-white/5'
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
              <div className="p-4 border-t border-white/10">
                {userSection}
              </div>
            )}
          </div>
        </aside>

        <MobileNav
          items={navItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          subtitle="Steam Boost Platform"
          footer={userSection}
        />

        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
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
