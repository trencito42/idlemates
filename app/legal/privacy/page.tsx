import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — IdleMates',
  description: 'How IdleMates collects, stores, and protects your data. GDPR-compliant and security-first.',
  alternates: { canonical: '/legal/privacy' }
}

export default function PrivacyPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-user-shield"></i>
              <span className="text-primary font-semibold">Privacy</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Privacy Policy</span>
            </h1>
            <p className="text-white/70">Last updated: October 17, 2025</p>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="max-w-4xl mx-auto mb-6">
          <a href="/legal" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <i className="fa-duotone fa-arrow-left text-primary"></i>
            Back to Legal
          </a>
        </div>
        <div className="prose prose-invert prose-lg max-w-4xl mx-auto">

  <div className="card p-8 space-y-8 text-muted">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">1. Introduction</h2>
            <p>At IdleMates, we take your privacy seriously. This policy outlines how we collect, use, store, and protect your data. We operate under GDPR compliance and follow industry best practices for security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">2. Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Account Data</h3>
                <p>Email, Steam username (encrypted), Steam password (AES-256-GCM encrypted), shared_secret for 2FA (encrypted), account timestamps.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Session Data</h3>
                <p>Game AppIDs, session duration, accumulated hours, session status logs.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Technical Data</h3>
                <p>IP addresses (security), browser/device info, error logs (30-day retention), API request logs.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Payment Data</h3>
                <p>PayPal transaction IDs, subscription status, billing history. We never store credit card numbers (handled by PayPal).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">3. How We Use Your Data</h2>
            <p className="mb-3">We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Operation:</strong> Authenticate to Steam and run idling sessions</li>
              <li><strong>Account Management:</strong> Manage subscriptions, billing, and support</li>
              <li><strong>Communication:</strong> Send service updates and security alerts</li>
              <li><strong>Security:</strong> Detect fraud and prevent abuse</li>
            </ul>
            <p className="mt-4 font-semibold">We NEVER: Sell your data, share with third parties for marketing, use for ads, or manually access your credentials.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">4. Security</h2>
            <div className="card p-6 bg-primary/5 border-primary/20 mb-4">
              <h3 className="text-lg font-semibold text-fg mb-3">Encryption Standards</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>At Rest:</strong> AES-256-GCM envelope encryption</li>
                <li><strong>In Transit:</strong> TLS 1.3</li>
                <li><strong>Keys:</strong> Hardware-backed, monthly rotation</li>
                <li><strong>Zero Knowledge:</strong> Credentials decrypted only in memory</li>
              </ul>
            </div>
            <p>Additional: Regular security audits, rate limiting, DDoS protection, intrusion detection, MFA for admin access.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active Accounts:</strong> Data retained while account exists</li>
              <li><strong>Deleted Accounts:</strong> Data deleted within 30 days</li>
              <li><strong>Logs:</strong> 30-day retention, then auto-purged</li>
              <li><strong>Billing:</strong> 7 years (legal requirement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">6. Your Rights (GDPR)</h2>
            <p className="mb-4">You have the right to:</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="card p-4 bg-primary/5"><strong>Access:</strong> Export your data</div>
              <div className="card p-4 bg-primary/5"><strong>Rectification:</strong> Correct information</div>
              <div className="card p-4 bg-primary/5"><strong>Erasure:</strong> Delete your data</div>
              <div className="card p-4 bg-primary/5"><strong>Portability:</strong> Machine-readable export</div>
            </div>
            <p>Exercise rights: Email <a href="mailto:privacy@idlemat.es" className="text-primary hover:underline">privacy@idlemat.es</a> (30-day response)</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">7. Cookies & Tracking</h2>
            <p><strong>Essential Cookies:</strong> Session authentication (required)</p>
            <p><strong>Analytics:</strong> Self-hosted only (no Google Analytics)</p>
            <p><strong>No Ads:</strong> Zero advertising cookies or remarketing</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">8. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Steam:</strong> Authentication and idling</li>
              <li><strong>Cloud:</strong> Hosting (encrypted)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">9. Contact</h2>
            <div className="card p-6 bg-primary/5 border-primary/20">
              <p><strong>Email:</strong> <a href="mailto:privacy@idlemat.es" className="text-primary hover:underline">privacy@idlemat.es</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@idlemat.es" className="text-primary hover:underline">support@idlemat.es</a></p>
            </div>
          </section>

          <div className="pt-8 border-t border-white/10 text-center text-sm">
            <p>Governed by EU law and GDPR regulations.</p>
            <p className="mt-2">IdleMates © 2025 · Committed to your privacy</p>
          </div>
        </div>
        </div>
      </section>
    </main>
  )
}
