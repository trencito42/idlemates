import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal — IdleMates',
  description: 'Legal information for IdleMates including Privacy Policy and Terms of Service.',
  alternates: { canonical: '/legal' },
  openGraph: {
    title: 'Legal — IdleMates',
    description: 'Legal information for IdleMates including Privacy Policy and Terms of Service.',
    type: 'website',
    images: ['/api/og?title=Legal%20%E2%80%94%20IdleMates&subtitle=Privacy%20Policy%2C%20Terms%20of%20Service%20and%20legal%20information']
  },
  twitter: {
    title: 'Legal — IdleMates',
    description: 'Legal information for IdleMates including Privacy Policy and Terms of Service.',
    images: ['/api/og?title=Legal%20%E2%80%94%20IdleMates&subtitle=Privacy%20Policy%2C%20Terms%20of%20Service%20and%20legal%20information']
  }
}

export default function LegalIndexPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-scale-balanced"></i>
              <span className="text-primary font-semibold">Legal</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Legal & Policies</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Read our Privacy Policy and Terms of Service. We keep things clear and respectful.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Link href="/legal/privacy" className="card p-6 group hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <i className="fa-duotone fa-user-shield text-2xl text-primary"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">Privacy Policy</h2>
                <p className="text-muted text-sm">How we collect, use, and protect your data. GDPR-compliant.</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/60">Last updated: October 17, 2025</div>
          </Link>

          <Link href="/legal/tos" className="card p-6 group hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <i className="fa-duotone fa-file-contract text-2xl text-primary"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">Terms of Service</h2>
                <p className="text-muted text-sm">The rules of using IdleMates, billing, and acceptable use.</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/60">Last updated: October 17, 2025</div>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto mt-10 text-center">
          <div className="card p-8 bg-primary/5 border-primary/20">
            <i className="fa-duotone fa-envelope text-4xl text-primary mb-4"></i>
            <p className="text-muted">Questions about our policies? Email <a href="mailto:legal@idlemat.es" className="text-primary hover:underline">legal@idlemat.es</a>.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
