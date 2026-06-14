import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — IdleMates',
  description: 'IdleMates Terms of Service for usage, billing, refunds, and acceptable use.',
  alternates: { canonical: '/legal/tos' }
}

export default function ToSPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-file-contract"></i>
              <span className="text-primary font-semibold">Terms</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Terms of Service</span>
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
            <h2 className="text-2xl font-bold mb-4 text-fg">1. Service Terms</h2>
            <p>By using IdleMates, you agree to comply with these terms. We provide Steam game idling as a service, with fair use limits and security measures to protect all users.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">2. Account Rules</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Fair Use Policy</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Stay within Steam's guidelines</li>
                  <li>No trading or selling accounts</li>
                  <li>One active subscription per user</li>
                  <li>Respect session limits</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg mb-2">Prohibited Activities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>API abuse or DDoS attempts</li>
                  <li>Credential sharing</li>
                  <li>Automatic account creation</li>
                  <li>Reselling service access</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">3. Service Limitations</h2>
            <div className="card p-6 bg-primary/5 border-primary/20 mb-4">
              <h3 className="text-lg font-semibold text-fg mb-3">Plan Restrictions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free:</strong> 1 game, 100 hours</li>
                <li><strong>Basic:</strong> 6 games, unlimited hours</li>
                <li><strong>Pro:</strong> 12 games, unlimited hours</li>
                <li><strong>Ultra:</strong> 24 games, unlimited hours</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">4. Billing & Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monthly/yearly billing via Stripe</li>
              <li>Auto-renewal unless cancelled</li>
              <li>No refunds for past usage</li>
              <li>Pro-rated refunds for yearly plans</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">5. Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Terms violation</li>
              <li>Payment issues</li>
              <li>Abuse or fraud</li>
              <li>Steam ToS violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">6. Service Availability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>99.9% uptime target</li>
              <li>Scheduled maintenance with notice</li>
              <li>No guarantee for Steam issues</li>
              <li>Force majeure exceptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">7. Support & Communication</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email support within 24 hours</li>
              <li>Service updates via email</li>
              <li>Terms changes with notice</li>
              <li>Emergency notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-fg">8. Liability</h2>
            <p>IdleMates is provided "as is" without warranty. We're not responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Steam account issues</li>
              <li>Game progress loss</li>
              <li>Network problems</li>
              <li>Third-party actions</li>
            </ul>
          </section>

          <section className="card p-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-bold mb-4 text-fg">Contact</h2>
            <p>For any questions about these terms:</p>
            <p><a href="mailto:legal@idlemat.es" className="text-primary hover:underline">legal@idlemat.es</a></p>
          </section>
        </div>
        </div>
      </section>
    </main>
  )
}
