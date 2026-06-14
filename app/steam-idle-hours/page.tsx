import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import GalaxyGames from '@/components/GalaxyGamesLazy'

export const metadata: Metadata = {
  title: 'Steam Idle Hours Farming - Boost Steam Playtime 24/7 | IdleMates',
  description: 'Farm Steam hours effortlessly with IdleMates. Your games never sleep - we grind while you shine. Get Steam cards, XP, and level up without running games on your PC.',
  keywords: [
    'steam idle hours',
    'steam hour farming',
    'steam playtime boost',
    'steam cards farming',
    'steam level up',
    'steam hours 24/7',
    'steam cloud gaming',
    'steam hour generator',
    'steam time boost',
    'idle steam games'
  ],
  alternates: { canonical: '/steam-idle-hours' },
  openGraph: {
    title: 'Steam Idle Hours Farming - Boost Steam Playtime 24/7 | IdleMates',
    description: 'Farm Steam hours effortlessly with IdleMates. Your games never sleep - we grind while you shine. Get Steam cards, XP, and level up without running games on your PC.',
    images: ['/api/og?title=Steam%20Idle%20Hours%20Farming&subtitle=Your%20games%20never%20sleep.%20We%20grind%20while%20you%20shine.']
  },
  twitter: {
    title: 'Steam Idle Hours Farming - Boost Steam Playtime 24/7 | IdleMates',
    description: 'Farm Steam hours effortlessly with IdleMates. Your games never sleep - we grind while you shine. Get Steam cards, XP, and level up without running games on your PC.',
    images: ['/api/og?title=Steam%20Idle%20Hours%20Farming&subtitle=Your%20games%20never%20sleep.%20We%20grind%20while%20you%20shine.']
  }
}

export default function SteamIdleHoursPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[720px]">
        {/* Galaxy background */}
        <div className="absolute inset-0 z-[2]">
          <GalaxyGames />
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        
        <div className="relative z-10 mx-auto px-6 py-24 md:py-40">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary mb-4 shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-clock"></i>
              <span className="text-primary font-semibold">24/7 Steam Hour Farming</span>
            </div>
            
            {/* Main H1 */}
            <h1 className="relative text-center text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pointer-events-none">
              <span className="block text-white drop-shadow-2xl text-shadow-md">Steam Idle Hours</span>
              <span className="relative inline-block">
                <span className="relative z-0 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  Farming Made Easy
                </span>
                <span className="absolute -inset-2 -z-0 rounded-3xl bg-accent/10 blur-xl" />
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light text-shadow-md">
              Your games never sleep. Farm Steam hours, get cards, and level up—all without running games on your PC.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-rocket-launch"></i> 
                Start Farming Free
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl backdrop-blur-xl border border-border/20 hover:border-accent/40 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-tags"></i> 
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-dark-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent"></div>
        
        <div className="container relative z-10 mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why Choose IdleMates for <span className="text-primary">Steam Hour Farming</span>?
            </h2>
            <p className="text-xl text-white/60">The smartest way to boost your Steam profile</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: 'fa-duotone fa-clock-rotate-left',
                title: '24/7 Automatic Farming',
                description: 'Your Steam games idle continuously in the cloud. No need to keep your PC running.'
              },
              {
                icon: 'fa-duotone fa-cards-blank',
                title: 'Get Steam Trading Cards',
                description: 'Earn valuable Steam trading cards automatically while farming hours.'
              },
              {
                icon: 'fa-duotone fa-arrow-trend-up',
                title: 'Level Up Your Profile',
                description: 'Increase your Steam level and unlock more friend slots, showcase items, and badges.'
              },
              {
                icon: 'fa-duotone fa-gamepad-modern',
                title: 'Support 32+ Games',
                description: 'Farm hours on multiple games simultaneously. Works with any Steam game.'
              },
              {
                icon: 'fa-duotone fa-shield-heart',
                title: '100% Safe & Secure',
                description: 'Military-grade encryption keeps your Steam account protected. VAC-safe methods only.'
              },
              {
                icon: 'fa-duotone fa-bolt',
                title: 'Instant Setup',
                description: 'Start farming in under 60 seconds. No downloads, no software installation required.'
              }
            ].map((benefit, i) => (
              <div 
                key={i}
                className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-border/10 hover:border-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${benefit.icon} text-3xl text-primary`}></i>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/60 leading-relaxed">{benefit.description}</p>
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
              How Steam Hour Farming Works
            </h2>
            <p className="text-xl text-white/60">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: '01',
                icon: 'fa-duotone fa-user-plus',
                title: 'Create Account',
                description: 'Sign up for free and connect your Steam account securely via QR code'
              },
              {
                number: '02',
                icon: 'fa-duotone fa-gamepad',
                title: 'Select Games',
                description: 'Choose which Steam games you want to farm hours on (up to 32 games)'
              },
              {
                number: '03',
                icon: 'fa-duotone fa-play',
                title: 'Start Farming',
                description: 'Hit start and watch your hours grow 24/7 while you do other things'
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

      {/* FAQ */}
      <section className="py-24 bg-dark-2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Steam Hour Farming FAQ
            </h2>
            <p className="text-xl text-white/60">Everything you need to know</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: 'Is Steam hour farming safe?',
                a: 'Yes, IdleMates uses 100% VAC-safe methods. We simulate legitimate gameplay without any game modifications or cheats. Your account security is our top priority.'
              },
              {
                q: 'How many hours can I farm per day?',
                a: 'You can farm 24 hours per day across multiple games. Our Pro plans allow farming on up to 32 games simultaneously for maximum efficiency.'
              },
              {
                q: 'Will I get Steam trading cards?',
                a: 'Absolutely! Farming hours naturally generates Steam trading cards for eligible games, just like normal gameplay would.'
              },
              {
                q: 'Do I need to keep my computer on?',
                a: 'No! Everything runs in our secure cloud infrastructure. Your computer can be off, and the farming continues 24/7.'
              },
              {
                q: 'How long does it take to see results?',
                a: 'You\'ll see hour increases immediately after starting. Steam trading cards typically drop every 15-30 minutes of playtime.'
              }
            ].map((faq, i) => (
              <div key={i} className="card p-6 bg-white/5 border border-border/10">
                <h3 className="text-xl font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-white/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-accent/20 via-dark to-dark-2">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Start Farming Steam Hours <span className="text-accent">Today</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Join thousands of gamers who farm Steam hours while they sleep. Your cloud buddy is ready to work!
          </p>
          
          <Link 
            href="/auth/register"
            className="group inline-flex items-center gap-3 px-12 py-5 bg-accent hover:bg-accent/90 text-dark font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-accent/40 hover:shadow-accent/60 hover:scale-105"
          >
            <span>Start Free Trial</span>
            <i className="fa-duotone fa-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
          </Link>
          
          <p className="mt-6 text-white/50 text-sm">
            <i className="fa-duotone fa-shield-check text-accent mr-1"></i>
            100 hours free • No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  )
}