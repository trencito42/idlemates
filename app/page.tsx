'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import GalaxyGames from '@/components/GalaxyGamesLazy'
import FloatingHourStack from '@/components/FloatingHourStack'
import FloatingGameStack from '@/components/FloatingGameStackLazy'
import Script from 'next/script'

export default function HomePage() {
  const { data: session } = useSession()
  
  return (
    <main>
      {/* SEO: JSON-LD for Organization and WebSite */}
      <Script id="ld-json-org" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'IdleMates',
            url: (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3699'),
            logo: '/logo.svg',
            sameAs: ['https://discord.gg/']
          })
        }}
      />
      <Script id="ld-json-website" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'IdleMates',
            url: (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3699'),
            potentialAction: {
              '@type': 'SearchAction',
              target: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3699'}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          })
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[720px] lg:min-h-[780px]">
        {/* Galaxy background fills hero */}
        <div className="absolute inset-0 z-[2]">
          <GalaxyGames />
        </div>
        
        {/* Gradient overlays */}
  <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
  <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        {/* Watermark: Big SVG logo with soft purple tint (behind galaxy) */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <svg aria-hidden="true" className="logo-anim boot w-[95vw] max-w-[1600px] h-auto" viewBox="0 0 236 236" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06 }}>
            <defs>
              <radialGradient id="wm" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#8A5CFF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.2" />
              </radialGradient>
            </defs>
            <path d="M218 128C218 141.132 215.413 154.136 210.388 166.268C205.362 178.401 197.997 189.425 188.711 198.711C179.425 207.997 168.401 215.362 156.268 220.388C144.136 225.413 131.132 228 118 228C104.868 228 91.8642 225.413 79.7317 220.388C67.5991 215.362 56.5752 207.997 47.2893 198.711C38.0035 189.425 30.6375 178.401 25.612 166.268C20.5866 154.136 18 141.132 18 128L218 128Z" fill="url(#wm)" />
            <circle cx="42.375" cy="32.375" r="24.375" fill="url(#wm)" />
          </svg>
        </div>
        {/* Decorative particles */}
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-50">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute bottom-10 right-1/5 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-subtle" />
        </div>
        
        <div className="relative z-10 mx-auto px-6 py-24 md:py-40">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary mb-4 shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-timer"></i>
              <span className="text-primary font-semibold">
                Runs 24/7 in the cloud
              </span>
            </div>
            
            {/* Main H1: concise, brand-first */}
            <h1 className="relative text-center text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pointer-events-none">
              <span className="block text-white drop-shadow-2xl text-shadow-md">The Cloud Buddy</span>
              <span className="relative inline-block">
                <span
                  className="relative z-0 text-transparent bg-clip-text [animation:grad-drift_8s_linear_infinite]"
                  style={{
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.18'/></svg>\"), linear-gradient(135deg,#8a5cff,rgba(255,255,255,1),rgba(255,255,255,0.85),#8a5cff,rgba(255,255,255,0.9))",
                    backgroundBlendMode: 'soft-light, normal',
                    backgroundRepeat: 'repeat, no-repeat',
                    backgroundSize: '90px 90px, 220% 220%',
                    backgroundPosition: '0 0, center'
                  }}
                >
                  that plays for you
                </span>
                <span className="absolute -inset-2 -z-0 rounded-3xl bg-accent/10 blur-xl" />
              </span>
            </h1>

            {/* Encryption ribbon: subtle animated stripes under heading (non-interactive) */}
            <div className="relative mt-4 flex justify-center pointer-events-none">
              <div className="h-1.5 w-64 md:w-80 rounded-full overflow-hidden">
                <div className="h-full w-[200%] [background:repeating-linear-gradient(90deg,rgba(138,92,255,0.55)_0_16px,rgba(138,92,255,0.15)_16px_32px)] [animation:cipher-scroll_12s_linear_infinite]" />
              </div>
            </div>

            
            {/* Subtitle: one clear message for conversion */}
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light text-shadow-md">
              Your games never sleep.
            </p>
            {/* Removed extra security brag line per request */}
            
            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
              {session ? (
                <Link 
                  href="/app/dashboard" 
                  className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105"
                >
                  <i className="fa-duotone fa-gauge-high"></i> 
                  Go to Dashboard
                </Link>
              ) : (
                <Link 
                  href="/auth/register" 
                  className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105"
                >
                  <i className="fa-duotone fa-rocket-launch"></i> 
                  Get started free
                </Link>
              )}
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl backdrop-blur-xl border border-border/20 hover:border-accent/40 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-tags"></i> 
                View pricing
              </Link>
            </div>
            
            {/* Trust badges removed per request */}
          </div>
        </div>
        
        {/* Bottom fade */}
  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent z-[2] pointer-events-none" />
      </section>

      {/* Features */}
      <section className="py-24 bg-dark-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent"></div>
        
        <div className="container relative z-10 mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why We're The Perfect <span className="text-primary">Cloud Buddy</span>
            </h2>
            <p className="text-xl text-white/60">24/7 XP farming, zero sweat. We do the grinding so you don't have to.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: 'fa-duotone fa-rocket-launch',
                title: 'Instant Setup',
                description: 'Link Steam, pick games, done. Your cloud buddy starts working in under 60 seconds.'
              },
              {
                icon: 'fa-duotone fa-shield-heart',
                title: 'Friends Don\'t Let Friends Lose Steam Cards',
                description: 'Military-grade encryption because we take your Steam account as seriously as you do.'
              },
              {
                icon: 'fa-duotone fa-gamepad-modern',
                title: 'Multi-Game Master',
                description: 'Run up to 32 games at once. We\'re basically your gaming overachiever friend.'
              },
              {
                icon: 'fa-duotone fa-arrows-rotate',
                title: 'Never Sleeps',
                description: 'Auto-restart keeps sessions alive 24/7. We\'re the friend who never logs off.'
              },
              {
                icon: 'fa-duotone fa-chart-line-up',
                title: 'Show Off Those Stats',
                description: 'Real-time progress tracking. Watch your hours climb while you actually play games.'
              },
              {
                icon: 'fa-duotone fa-comments',
                title: 'Always Here For You',
                description: 'Support team that actually gets gaming. We speak fluent Steam.'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-border/10 hover:border-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${feature.icon} text-3xl text-primary`}></i>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-dark relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Your Cloud Buddy in <span className="text-accent">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-white/60">Seriously. Even your grandma could set this up.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: '01',
                icon: 'fa-duotone fa-handshake',
                title: 'Meet Your Buddy',
                description: 'Sign up free. No strings attached, just like meeting a new gaming friend.'
              },
              {
                number: '02',
                icon: 'fa-duotone fa-plug-circle-bolt',
                title: 'Link Steam',
                description: 'Quick QR scan and you\'re connected. Easier than adding someone on Discord.'
              },
              {
                number: '03',
                icon: 'fa-duotone fa-bed',
                title: 'Let Us Do The Work',
                description: 'Pick your games, hit start. We\'ll handle the boring stuff while you live your life.'
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                {/* Connection line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-accent/50 to-transparent"></div>
                )}
                
                <div className="relative group">
                  <div className="relative p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-accent/20 hover:border-accent/40 transition-all duration-300">
                    {/* Step number badge */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent text-dark font-black text-xl rounded-full flex items-center justify-center shadow-lg shadow-accent/30">
                      {step.number}
                    </div>
                    
                    <div className="w-16 h-16 bg-accent/10 border-2 border-accent/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <i className={`${step.icon} text-4xl text-accent`}></i>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      {/* Features Section */}
            {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <FloatingGameStack />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-dark to-dark-2 animate-gradient" style={{backgroundSize: '200% 200%'}}></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready for Your <span className="text-accent">Cloud Buddy</span>?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Join thousands of gamers who let us do the grinding while they do the shining.
          </p>
          
          <Link 
            href="/auth/register"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-accent hover:bg-accent/90 text-dark font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-accent/40 hover:shadow-accent/60 hover:scale-105"
          >
            <span>Get Started Free</span>
            <i className="fa-duotone fa-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
          </Link>
          
          <p className="mt-6 text-white/50 text-sm">No credit card required • Cancel anytime</p>
        </div>
      </section>      {/* How it works */}
      <section className="container-page py-20 md:py-28 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary mb-6 uppercase tracking-wider">
              <i className="fa-duotone fa-list-check"></i>
              How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                Your buddy's ready in 60 seconds
              </span>
            </h2>
            <p className="text-xl text-muted">
              No downloads, no drama. Your cloud buddy just works.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { 
                step: '01', 
                icon: 'fa-handshake',
                title: 'Meet & greet', 
                desc: 'Quick Steam connection via QR code or login. We encrypt everything with AES-256 because we\'re protective of our friends.' 
              },
              { 
                step: '02', 
                icon: 'fa-gamepad-modern',
                title: 'Choose your favorites', 
                desc: 'Pick up to 24 games from the entire Steam catalog. We support everything from indie gems to AAA blockbusters.' 
              },
              { 
                step: '03', 
                icon: 'fa-bed',
                title: 'We take it from here', 
                desc: 'Your cloud buddy starts working instantly. Your PC stays free for actual gaming while we handle the boring stuff.' 
              },
              { 
                step: '04', 
                icon: 'fa-chart-line-up',
                title: 'Watch the magic', 
                desc: 'Real-time dashboard shows your growing hours. Pause, adjust, or just sit back and watch your Steam profile level up.' 
              },
            ].map((s, i) => (
              <div 
                key={s.step} 
                className="group card p-8 flex gap-8 items-start hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden"
              >
                {/* Connection line */}
                {i < 3 && (
                  <div className="absolute left-[4.5rem] top-full w-0.5 h-6 bg-gradient-to-b from-primary/40 to-transparent"></div>
                )}
                
                {/* Gradient glow */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Step indicator */}
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/30 shadow-lg group-hover:shadow-2xl group-hover:border-primary/50 transition-all">
                    <div className="w-full h-full rounded-2xl flex items-center justify-center">
                      <i className={`fa-duotone ${s.icon} text-3xl text-primary`}></i>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                    {s.step}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page py-20 md:py-28">
        <div className="card p-12 md:p-16 text-center relative overflow-hidden group">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(138,92,255,0.15),transparent_50%)]"></div>
          
          <div className="relative z-10">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-black">
                  <span className="text-primary">
                    2,500
                  </span>
                  <span className="text-primary text-4xl">+</span>
                </div>
                <p className="text-white/60 font-medium uppercase tracking-wider text-sm">
                  Accounts Connected
                </p>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-black">
                  <span className="text-primary">
                    50,000
                  </span>
                  <span className="text-primary text-4xl">+</span>
                </div>
                <p className="text-white/60 font-medium uppercase tracking-wider text-sm">
                  Hours Per Month
                </p>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-black">
                  <span className="text-primary">
                    99.9
                  </span>
                  <span className="text-primary text-4xl">%</span>
                </div>
                <p className="text-white/60 font-medium uppercase tracking-wider text-sm">
                  Uptime Guarantee
                </p>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
              <i className="fa-duotone fa-clock-rotate-left"></i>
              <p>Running since 2024. Over 1.2M hours accumulated so far.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20 md:py-28">
        <div className="card p-12 md:p-20 text-center relative overflow-hidden group">
          <FloatingHourStack />
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(138,92,255,0.3),transparent_70%)]"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-sm font-semibold text-primary mb-4">
              <i className="fa-duotone fa-gift"></i>
              100 Hours Free Forever
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="block bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">
                Your cloud buddy is waiting
              </span>
              <span className="block text-primary">
                ready to work
              </span>
            </h2>
            
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              100 free hours monthly. No credit card drama. 
              <span className="text-primary font-semibold"> We grind while you shine.</span>
            </p>
            
            {session ? (
              <Link 
                href="/app/dashboard" 
                className="inline-flex items-center gap-3 px-12 py-5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 hover:scale-110 group"
              >
                <i className="fa-duotone fa-gauge-high group-hover:scale-110 transition-transform"></i> 
                <span>Go to Dashboard</span>
                <i className="fa-duotone fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </Link>
            ) : (
              <Link 
                href="/auth/register" 
                className="inline-flex items-center gap-3 px-12 py-5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 hover:scale-110 group"
              >
                <i className="fa-duotone fa-user-plus group-hover:rotate-12 transition-transform"></i> 
                <span>Create free account</span>
                <i className="fa-duotone fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </Link>
            )}
            
            <p className="text-sm text-white/40 mt-6">
              <i className="fa-duotone fa-shield-check text-primary mr-1"></i>
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
