import type { Metadata } from 'next'
import Link from 'next/link'
import GalaxyGames from '@/components/GalaxyGamesLazy'

export const metadata: Metadata = {
  title: 'Steam Level Up Service - Boost Your Steam Profile Fast | IdleMates',
  description: 'Level up your Steam profile automatically. Farm hours, earn cards, craft badges - all while you sleep. Your cloud buddy handles the grinding for maximum Steam XP.',
  keywords: [
    'steam level up',
    'steam profile boost',
    'steam xp farming',
    'steam badge crafting',
    'increase steam level',
    'steam profile leveling',
    'steam showcase unlock',
    'steam friend slots',
    'steam profile customization',
    'steam level service'
  ],
  alternates: { canonical: '/steam-level-up' },
  openGraph: {
    title: 'Steam Level Up Service - Boost Your Steam Profile Fast | IdleMates',
    description: 'Level up your Steam profile automatically. Farm hours, earn cards, craft badges - all while you sleep. Your cloud buddy handles the grinding for maximum Steam XP.',
    images: ['/api/og?title=Steam%20Level%20Up%20Service&subtitle=Boost%20your%20Steam%20profile%20while%20you%20sleep.%20We%20grind%20while%20you%20shine.']
  },
  twitter: {
    title: 'Steam Level Up Service - Boost Your Steam Profile Fast | IdleMates',
    description: 'Level up your Steam profile automatically. Farm hours, earn cards, craft badges - all while you sleep. Your cloud buddy handles the grinding for maximum Steam XP.',
    images: ['/api/og?title=Steam%20Level%20Up%20Service&subtitle=Boost%20your%20Steam%20profile%20while%20you%20sleep.%20We%20grind%20while%20you%20shine.']
  }
}

export default function SteamLevelUpPage() {
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
              <i className="fa-duotone fa-trophy"></i>
              <span className="text-primary font-semibold">Automatic Steam Leveling</span>
            </div>
            
            <h1 className="relative text-center text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pointer-events-none">
              <span className="block text-white drop-shadow-2xl text-shadow-md">Steam Level Up</span>
              <span className="relative inline-block">
                <span className="relative z-0 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  While You Sleep
                </span>
                <span className="absolute -inset-2 -z-0 rounded-3xl bg-accent/10 blur-xl" />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light text-shadow-md">
              Unlock showcase features, get more friend slots, and show off your epic Steam profile. We handle the grinding.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent/90 text-white font-bold text-lg rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-rocket-launch"></i> 
                Start Leveling Up
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl backdrop-blur-xl border border-border/20 hover:border-accent/40 transition-all duration-300 hover:scale-105"
              >
                <i className="fa-duotone fa-chart-line-up"></i> 
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Level Benefits */}
      <section className="py-24 bg-dark-2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What You Get with <span className="text-primary">Higher Steam Levels</span>
            </h2>
            <p className="text-xl text-white/60">Every level unlocks more features and showcases</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                level: 'Level 10+',
                icon: 'fa-duotone fa-user-plus',
                title: 'More Friend Slots',
                description: 'Expand your Steam friends list with +5 slots per level',
                color: 'text-blue-400'
              },
              {
                level: 'Level 20+',
                icon: 'fa-duotone fa-palette',
                title: 'Profile Showcases',
                description: 'Unlock achievement, game, and screenshot showcases',
                color: 'text-purple-400'
              },
              {
                level: 'Level 30+',
                icon: 'fa-duotone fa-badge',
                title: 'Custom Badges',
                description: 'Display rare and crafted badges on your profile',
                color: 'text-orange-400'
              },
              {
                level: 'Level 50+',
                icon: 'fa-duotone fa-crown',
                title: 'Profile Prestige',
                description: 'Stand out with exclusive high-level profile features',
                color: 'text-yellow-400'
              },
              {
                level: 'Level 100+',
                icon: 'fa-duotone fa-sparkles',
                title: 'Animated Profile',
                description: 'Unlock animated avatars and profile effects',
                color: 'text-pink-400'
              },
              {
                level: 'Level 200+',
                icon: 'fa-duotone fa-gem',
                title: 'Elite Status',
                description: 'Join the elite club of high-level Steam users',
                color: 'text-emerald-400'
              }
            ].map((benefit, i) => (
              <div key={i} className="group p-6 bg-white/5 rounded-2xl border border-border/10 hover:border-accent/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                      <i className={`${benefit.icon} text-xl text-accent`}></i>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${benefit.color} mb-1`}>{benefit.level}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level Up Process */}
      <section className="py-24 bg-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How We <span className="text-primary">Level Up</span> Your Steam Profile
            </h2>
            <p className="text-xl text-white/60">The complete automation process explained</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: '1',
                icon: 'fa-duotone fa-gamepad',
                title: 'Farm Game Hours',
                description: 'We idle your Steam games 24/7 to accumulate playtime and trigger trading card drops',
                detail: 'Cards drop every 15-30 minutes of gameplay across multiple games simultaneously'
              },
              {
                step: '2',
                icon: 'fa-duotone fa-cards-blank',
                title: 'Collect Trading Cards',
                description: 'All earned trading cards are automatically collected in your Steam inventory',
                detail: 'No manual collection needed - everything happens in the background'
              },
              {
                step: '3',
                icon: 'fa-duotone fa-badge',
                title: 'Craft Steam Badges',
                description: 'We automatically craft badges from complete card sets to generate Steam XP',
                detail: 'Each badge crafted gives 100 XP + bonus XP for higher badge levels'
              },
              {
                step: '4',
                icon: 'fa-duotone fa-trophy',
                title: 'Profile Level Up',
                description: 'XP accumulates to increase your Steam level and unlock new profile features',
                detail: 'Higher levels require more XP but unlock better showcase options'
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-6 p-6 bg-white/5 rounded-2xl border border-border/10">
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent text-dark font-black text-lg rounded-full flex items-center justify-center">
                    {step.step}
                  </div>
                  <div className="w-16 h-16 bg-accent/10 border-2 border-accent/30 rounded-2xl flex items-center justify-center">
                    <i className={`${step.icon} text-2xl text-accent`}></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed mb-2">{step.description}</p>
                  <p className="text-accent text-sm font-medium">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level Calculator */}
      <section className="py-24 bg-dark-2">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Steam Level <span className="text-primary">XP Calculator</span>
            </h2>
            <p className="text-xl text-white/60">See how much XP you need for your target level</p>
          </div>

          <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl border border-border/10 p-8">
            <div className="grid md:grid-cols-2 gap-6 text-center">
              {[
                { level: '10', xp: '1,000', cards: '10 sets', time: '2-3 days' },
                { level: '20', xp: '4,000', cards: '40 sets', time: '1 week' },
                { level: '50', xp: '25,000', cards: '250 sets', time: '3-4 weeks' },
                { level: '100', xp: '100,000', cards: '1,000 sets', time: '2-3 months' }
              ].map((calc, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-border/10">
                  <div className="text-2xl font-bold text-accent mb-2">Level {calc.level}</div>
                  <div className="space-y-1 text-sm text-white/70">
                    <div>{calc.xp} XP needed</div>
                    <div>{calc.cards} required</div>
                    <div className="text-primary font-medium">~{calc.time} with IdleMates</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Real <span className="text-primary">Success Stories</span>
            </h2>
            <p className="text-xl text-white/60">See what our users have achieved</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Alex K.',
                before: '5',
                after: '47',
                time: '6 weeks',
                quote: 'Went from level 5 to 47 without lifting a finger. Amazing service!'
              },
              {
                name: 'Sarah M.',
                before: '12',
                after: '89',
                time: '3 months',
                quote: 'My Steam profile looks incredible now. Friends are so jealous of my showcases.'
              },
              {
                name: 'Mike R.',
                before: '1',
                after: '156',
                time: '4 months',
                quote: 'From complete noob to Steam elite. Best investment I\'ve ever made.'
              }
            ].map((story, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-2xl border border-border/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold text-white">{story.name}</div>
                  <div className="text-sm text-accent">{story.time}</div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">L{story.before}</div>
                    <div className="text-xs text-white/50">Before</div>
                  </div>
                  <i className="fa-duotone fa-arrow-right text-accent"></i>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">L{story.after}</div>
                    <div className="text-xs text-white/50">After</div>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">"{story.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-accent/20 via-dark to-dark-2">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Level Up Your Steam Profile <span className="text-accent">Tonight</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Stop grinding manually. Let your cloud buddy handle the boring stuff while you enjoy gaming.
          </p>
          
          <Link 
            href="/auth/register"
            className="group inline-flex items-center gap-3 px-12 py-5 bg-accent hover:bg-accent/90 text-dark font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-accent/40 hover:shadow-accent/60 hover:scale-105"
          >
            <span>Start Leveling Up</span>
            <i className="fa-duotone fa-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
          </Link>
          
          <p className="mt-6 text-white/50 text-sm">
            <i className="fa-duotone fa-shield-check text-accent mr-1"></i>
            Free to start • No commitment • See results in days
          </p>
        </div>
      </section>
    </main>
  )
}