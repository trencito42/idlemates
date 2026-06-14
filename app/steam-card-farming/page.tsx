import type { Metadata } from 'next'
import Link from 'next/link'
import GalaxyGames from '@/components/GalaxyGamesLazy'

export const metadata: Metadata = {
  title: 'Steam Card Farming Service - Earn Trading Cards 24/7 | IdleMates',
  description: 'Automatically farm Steam trading cards while you sleep. Our cloud buddy handles the grinding - you get the cards, badges, and Steam levels without the hassle.',
  keywords: [
    'steam card farming',
    'steam trading cards',
    'steam badge farming',
    'steam card bot',
    'earn steam cards',
    'steam card generator',
    'auto steam cards',
    'steam card service',
    'steam level farming',
    'steam marketplace cards'
  ],
  alternates: { canonical: '/steam-card-farming' },
  openGraph: {
    title: 'Steam Card Farming Service - Earn Trading Cards 24/7 | IdleMates',
    description: 'Automatically farm Steam trading cards while you sleep. Our cloud buddy handles the grinding - you get the cards, badges, and Steam levels without the hassle.',
    images: ['/api/og?title=Steam%20Card%20Farming&subtitle=Earn%20trading%20cards%20while%20you%20sleep.%20We%20grind%20while%20you%20shine.']
  },
  twitter: {
    title: 'Steam Card Farming Service - Earn Trading Cards 24/7 | IdleMates',
    description: 'Automatically farm Steam trading cards while you sleep. Our cloud buddy handles the grinding - you get the cards, badges, and Steam levels without the hassle.',
    images: ['/api/og?title=Steam%20Card%20Farming&subtitle=Earn%20trading%20cards%20while%20you%20sleep.%20We%20grind%20while%20you%20shine.']
  }
}

export default function SteamCardFarmingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[720px]">
        <div className="absolute inset-0 z-[2]">
          <GalaxyGames />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        
        <div className="relative z-10 mx-auto px-6 py-24 md:py-40">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary mb-4 shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-cards-blank"></i>
              <span className="text-primary font-semibold">Automated Card Farming</span>
            </div>
            
            <h1 className="relative text-center text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pointer-events-none">
              <span className="block text-white drop-shadow-2xl text-shadow-md">Steam Card</span>
              <span className="relative inline-block">
                <span className="relative z-0 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  Farming Service
                </span>
                <span className="absolute -inset-2 -z-0 rounded-3xl bg-accent/10 blur-xl" />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light text-shadow-md">
              Earn Steam trading cards while you sleep. Your lazy gamer alter-ego handles the grinding.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-cards-blank"></i> 
                Start Farming Cards
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl backdrop-blur-xl border border-border/20 hover:border-accent/40 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-tags"></i> 
                See Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-dark-2">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-accent mb-2">10,000+</div>
              <div className="text-white/70">Cards Farmed Daily</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-accent mb-2">24/7</div>
              <div className="text-white/70">Automatic Operation</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-accent mb-2">100%</div>
              <div className="text-white/70">VAC-Safe Methods</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Card Farming Works */}
      <section className="py-24 bg-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How Our Steam Card <span className="text-primary">Farming Works</span>
            </h2>
            <p className="text-xl text-white/60">The smartest way to earn Steam trading cards</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            {[
              {
                icon: 'fa-duotone fa-play-circle',
                title: 'Automatic Game Idling',
                description: 'Our cloud servers run your Steam games 24/7, simulating legitimate gameplay to earn card drops naturally.',
                detail: 'Cards drop every 15-30 minutes of playtime, just like normal gaming.'
              },
              {
                icon: 'fa-duotone fa-cards-blank',
                title: 'Card Collection & Management',
                description: 'All earned trading cards are automatically collected in your Steam inventory, ready for crafting badges or selling.',
                detail: 'No manual intervention needed - everything happens in the background.'
              },
              {
                icon: 'fa-duotone fa-badge',
                title: 'Badge Crafting & Levels',
                description: 'Use farmed cards to craft badges, increase your Steam level, and unlock profile showcase features.',
                detail: 'Higher Steam levels mean more friend slots and customization options.'
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-6 p-6 bg-white/5 rounded-2xl border border-border/10 hover:border-accent/30 transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-accent/10 border-2 border-accent/30 rounded-2xl flex items-center justify-center">
                    <i className={`${step.icon} text-3xl text-accent`}></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/70 text-lg leading-relaxed mb-2">{step.description}</p>
                  <p className="text-accent text-sm font-medium">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Farming Benefits */}
      <section className="py-24 bg-dark-2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why Choose IdleMates for <span className="text-primary">Card Farming</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'fa-duotone fa-money-bills',
                title: 'Earn Real Money',
                description: 'Sell farmed cards on Steam Market for Steam Wallet funds or real cash'
              },
              {
                icon: 'fa-duotone fa-trophy',
                title: 'Level Up Profile',
                description: 'Craft badges to increase your Steam level and unlock profile features'
              },
              {
                icon: 'fa-duotone fa-gamepad-modern',
                title: '32 Games Simultaneously',
                description: 'Farm cards from multiple games at once for maximum efficiency'
              },
              {
                icon: 'fa-duotone fa-clock',
                title: 'Zero Time Investment',
                description: 'Cards farm automatically while you work, sleep, or play other games'
              }
            ].map((benefit, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-2xl border border-border/10 hover:border-accent/30 transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <i className={`${benefit.icon} text-2xl text-accent`}></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Games */}
      <section className="py-24 bg-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Popular Games for <span className="text-primary">Card Farming</span>
            </h2>
            <p className="text-xl text-white/60">These games have valuable trading cards worth farming</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              'CS2', 'Dota 2', 'TF2', 'PUBG', 'Rust', 'GTA V',
              'Apex Legends', 'Dead by Daylight', 'Payday 2', 'Rocket League',
              'Terraria', 'Garry\'s Mod'
            ].map((game, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-border/10 hover:border-accent/30 transition-all duration-300 text-center">
                <div className="text-sm font-medium text-white">{game}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-accent/20 via-dark to-dark-2">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Start Earning Steam Cards <span className="text-accent">Tonight</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            While you sleep, we grind. Wake up to a full inventory of Steam trading cards.
          </p>
          
          <Link 
            href="/auth/register"
            className="group inline-flex items-center gap-3 px-12 py-5 bg-accent hover:bg-accent/90 text-dark font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-accent/40 hover:shadow-accent/60 hover:scale-105"
          >
            <span>Start Card Farming</span>
            <i className="fa-duotone fa-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
          </Link>
          
          <p className="mt-6 text-white/50 text-sm">
            <i className="fa-duotone fa-shield-check text-accent mr-1"></i>
            Free trial • VAC-safe • No downloads required
          </p>
        </div>
      </section>
    </main>
  )
}