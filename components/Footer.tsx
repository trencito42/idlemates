'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './ui/logo'
import { Container } from './ui/Container'

export default function Footer() {
  const pathname = usePathname()
  const isApp = pathname?.startsWith('/app')

  if (isApp) return null

  return (
    <footer className="border-t border-border/10 mt-20 bg-bg">
      <Container className="py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <Logo size="sm" variant="mark" />
              <span className="text-lg font-bold text-text group-hover:text-accent transition-colors">IdleMates</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Your cloud buddy for Steam. We grind while you shine.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-text">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="text-text-muted hover:text-text transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="text-text-muted hover:text-text transition-colors">FAQ</Link></li>
              <li><Link href="/security" className="text-text-muted hover:text-text transition-colors">Security</Link></li>
              <li><Link href="/auth/register" className="text-text-muted hover:text-accent transition-colors">Start free</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-text">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal" className="text-text-muted hover:text-text transition-colors">Legal</Link></li>
              <li><Link href="/legal/tos" className="text-text-muted hover:text-text transition-colors">Terms</Link></li>
              <li><Link href="/legal/privacy" className="text-text-muted hover:text-text transition-colors">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-text">Contact</h4>
            <div className="text-sm text-text-muted space-y-2">
              <a href="mailto:support@idlemat.es" className="hover:text-text transition-colors block">
                support@idlemat.es
              </a>
              <a href="/discord" className="hover:text-accent transition-colors block flex items-center gap-2">
                <i className="fa-brands fa-discord"></i> Join Discord
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
          <p>&copy; {new Date().getFullYear()} IdleMates</p>
          <p className="text-xs">Not affiliated with Valve or Steam</p>
        </div>
      </Container>
    </footer>
  )
}
