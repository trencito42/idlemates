'use client'

import React from 'react'
import Link from 'next/link'

export default function AdminTopBar() {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="border-b border-border/10 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
          <div className="flex items-center gap-4 md:gap-8 w-full">
            <Link href="/admin" className="font-bold text-lg flex items-center gap-2">
              <i className="fa-duotone fa-shield-halved text-primary"></i>
              Admin Panel
            </Link>
            {/* Mobile hamburger */}
            <button
              className="ml-auto md:hidden inline-flex items-center justify-center rounded-lg border border-border/30 px-3 py-2 text-sm hover:bg-white/5"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="admin-mobile-menu"
            >
              <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-3 md:gap-6 flex-wrap">
              <Link href="/admin/users" className="text-sm text-muted hover:text-fg transition">Users</Link>
              <Link href="/admin/sessions" className="text-sm text-muted hover:text-fg transition">Sessions</Link>
              <Link href="/admin/payments" className="text-sm text-muted hover:text-fg transition">Payments</Link>
              <Link href="/admin/plans" className="text-sm text-muted hover:text-fg transition">Plans</Link>
              <Link href="/admin/webhooks" className="text-sm text-muted hover:text-fg transition">Webhooks</Link>
              <Link href="/admin/news" className="text-sm text-muted hover:text-fg transition">News</Link>
              <Link href="/admin/settings" className="text-sm text-muted hover:text-fg transition">Settings</Link>
            </nav>
          </div>
          <Link href="/app/dashboard" className="text-sm text-muted hover:text-fg transition self-start md:self-auto">
            ← Back to App
          </Link>
        </div>
        {/* Mobile menu panel */}
        {open && (
          <div id="admin-mobile-menu" className="md:hidden pb-3">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/users" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Users</Link>
              <Link href="/admin/sessions" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Sessions</Link>
              <Link href="/admin/payments" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Payments</Link>
              <Link href="/admin/plans" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Plans</Link>
              <Link href="/admin/webhooks" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Webhooks</Link>
              <Link href="/admin/news" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>News</Link>
              <Link href="/admin/settings" className="btn-secondary !py-2 text-sm text-center" onClick={() => setOpen(false)}>Settings</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
