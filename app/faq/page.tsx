import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — IdleMates',
  description: "We're your lazy gamer alter-ego. Answers to setup, plans, safety, and support for the cloud buddy that plays for you.",
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ — IdleMates',
    description: "We're your lazy gamer alter-ego. Answers to setup, plans, safety, and support for the cloud buddy that plays for you.",
    images: ['/api/og?title=FAQ%20%E2%80%94%20IdleMates&subtitle=We%27re%20your%20lazy%20gamer%20alter-ego.%20Get%20answers%20about%20your%20cloud%20buddy.']
  },
  twitter: {
    title: 'FAQ — IdleMates',
    description: "We're your lazy gamer alter-ego. Answers to setup, plans, safety, and support for the cloud buddy that plays for you.",
    images: ['/api/og?title=FAQ%20%E2%80%94%20IdleMates&subtitle=We%27re%20your%20lazy%20gamer%20alter-ego.%20Get%20answers%20about%20your%20cloud%20buddy.']
  }
}

export default function FAQPage() {
  const categories = [
    {
      title: 'Getting Started',
      icon: 'fa-rocket-launch',
      faqs: [
        {
          q: 'What is IdleMates?',
          a: 'IdleMates is an automated platform for accumulating hours on Steam. Connect your Steam account, select games, and start 24/7 idling without consuming your PC resources.'
        },
        {
          q: 'How does idling work?',
          a: 'Our worker authenticates to your Steam account (in the cloud) and "plays" your selected games. Steam sees this as an active session and accumulates hours. You can be offline or play other games simultaneously.'
        },
        {
          q: 'Is it safe? Can I get banned?',
          a: 'Yes, it\'s safe. We use the official Steam client through steam-user (same engine as Steam Desktop). We don\'t abuse unofficial APIs. Millions of users have been using legitimate idling on Steam for years. However, read Steam ToS and use responsibly.'
        },
        {
          q: 'How do I start?',
          a: 'Create free account → Connect Steam (username + password + 2FA if you have it) → Add games by AppID or name → Click "Start" → Done! Hours accumulate automatically 24/7.'
        }
      ]
    },
    {
      title: 'Plans & Payments',
      icon: 'fa-credit-card',
      faqs: [
        {
          q: 'How does the Free plan work?',
          a: '100 free hours monthly for 1 game simultaneously. After exhaustion, manually renew from dashboard ("Reload Free Plan" button). No card required, no time-limited trial. You can stay on Free as long as you want.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'Stripe with monthly auto-renewal. Pay with most credit/debit cards. We don\'t accept crypto, wire transfer, or other methods at the moment.'
        },
        {
          q: 'How do I cancel my subscription?',
          a: 'From dashboard → Billing → "Cancel subscription". Instant cancellation, no questions, no penalties. Access continues until the end of the paid period. Already accumulated hours remain, obviously.'
        },
        {
          q: 'Can I upgrade/downgrade?',
          a: 'Yes, anytime from Billing. On upgrade, you pay pro-rata for the remaining period. On downgrade, the difference is automatically credited for the next period. Zero friction.'
        },
        {
          q: 'Are there refunds?',
          a: 'Yes, within the first 7 days if you haven\'t used > 10 hours. Contact support with email and reason. We process refunds in 3-5 business days.'
        }
      ]
    },
    {
      title: 'Features',
      icon: 'fa-stars',
      faqs: [
        {
          q: 'What does "smart pause" mean?',
          a: 'When we detect you\'re actually playing on Steam (through Steam presence API), we auto-pause idling to avoid interference. After you close the game, we automatically resume the session. Available on Basic+ plans.'
        },
        {
          q: 'How do I add games?',
          a: 'From dashboard → "Add game" → Enter AppID (e.g., 730 for CS:GO) or game name (automatic search in our database). Simultaneous game limit depends on plan: Free=1, Basic=6, Pro=12, Ultra=24.'
        },
        {
          q: 'Can I remove games from session?',
          a: 'Yes, click the "✖" button next to each game in the active session list. The game stops instantly and you can re-add it anytime. Already accumulated hours are not lost.'
        },
        {
          q: 'What is "priority session" on Ultra?',
          a: 'Ultra plan runs on dedicated servers with guaranteed CPU/RAM. During high load periods, Ultra sessions have maximum priority in the queue (instant start, zero throttling).'
        },
        {
          q: 'How do I see statistics?',
          a: 'Dashboard shows total accumulated hours, active sessions, complete history, and graphs (Pro+). You can export CSV reports or receive webhook notifications (Pro+) for important events.'
        }
      ]
    },
    {
      title: 'Security & Privacy',
      icon: 'fa-shield-check',
      faqs: [
        {
          q: 'How do you keep my credentials secure?',
          a: 'AES-256-GCM envelope encryption. Each account has a unique data key, encrypted with hardware master key (rotated monthly). Credentials are decrypted only in worker memory, never stored in plaintext. Zero human access.'
        },
        {
          q: 'What data do you collect?',
          a: 'Email, Steam username (not password in plaintext), game AppIDs, accumulated hours, session IPs (for security), error logs. We don\'t sell data, don\'t do remarketing, don\'t share with third parties. See complete Privacy Policy.'
        },
        {
          q: 'What is Steam Guard / 2FA?',
          a: 'Steam Guard is 2-step authentication from Steam. If activated, you must provide shared_secret (from Steam Mobile Authenticator) or manual code at each login. Complete guide in dashboard after account connection.'
        },
        {
          q: 'Can I delete my account and data?',
          a: 'Yes, from Settings → "Delete account permanently". GDPR-compliant process: we delete all data within 30 days (legal retention period for billing). Complete export available before deletion.'
        }
      ]
    },
    {
      title: 'Technical & Support',
      icon: 'fa-screwdriver-wrench',
      faqs: [
        {
          q: 'Why won\'t my session start?',
          a: 'Check: 1) Correct Steam credentials, 2) 2FA configured correctly (shared_secret or manual code), 3) Steam Guard not blocking new logins (check email), 4) Game limit not exceeded. If it persists, contact support with session ID.'
        },
        {
          q: 'Session says "running" but I\'m not accumulating hours',
          a: 'Steam updates hours with delay (15-30 min). Check on Steam directly after 1h. If hours still don\'t appear, stop session, verify credentials and restart. Contact support if problem continues > 2h.'
        },
        {
          q: 'Can I run IdleMates on phone?',
          a: 'Dashboard is fully responsive (works perfectly on mobile). But idling runs in the cloud on servers, so you don\'t need PC/phone turned on. Control everything remotely from browser.'
        },
        {
          q: 'What is the service uptime?',
          a: '99% Free, 99.5% Basic, 99.9% Pro, 99.99% Ultra (contractual SLA). 24/7 monitoring, automatic health checks, instant failover. Status page: status.idlemat.es (coming soon).'
        },
        {
          q: 'How do I contact support?',
          a: 'Email: support@idlemat.es (response in 24h for Free, 12h Basic, 6h Pro, 2h Ultra). Discord: coming soon. Live chat: Ultra only. Always include account email and detailed description.'
        }
      ]
    }
  ]

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-circle-question"></i>
              <span className="text-primary font-semibold">FAQ</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Frequently Asked Questions</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Everything you need to know about IdleMates. If you can’t find your answer, contact support.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
      {categories.map((cat) => (
        <div key={cat.title} className="max-w-4xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <i className={`fa-duotone ${cat.icon} text-2xl text-primary`}></i>
            </div>
            <h2 className="text-2xl font-bold">{cat.title}</h2>
          </div>
          <div className="space-y-4">
            {cat.faqs.map((faq, i) => (
              <details key={i} className="card p-6 group">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between text-lg">
                  {faq.q}
                  <i className="fa-solid fa-chevron-down group-open:rotate-180 transition-transform text-muted"></i>
                </summary>
                <p className="text-muted text-sm mt-4 leading-relaxed whitespace-pre-line">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      ))}
      </section>

      <section className="container-page pb-16">
        <div className="card p-12 text-center bg-gradient-to-br from-primary/10 to-primary-2/10 border-primary/20 max-w-3xl mx-auto">
          <i className="fa-duotone fa-envelope text-5xl text-primary mb-6"></i>
          <h2 className="text-3xl font-bold mb-4">Didn't find what you were looking for?</h2>
          <p className="text-muted mb-8">Email us at <a href="mailto:support@idlemat.es" className="text-primary hover:underline">support@idlemat.es</a> and we'll respond within 24h.</p>
          <Link href="/auth/register" className="btn text-base px-8 py-3 inline-block">
            Or start free now
          </Link>
        </div>
      </section>
    </main>
  )
}
