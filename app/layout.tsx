import './globals.css'
import type { Metadata, Viewport } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Providers } from '@/components/Providers'
import { getRedis } from '@/lib/redis'
import AnnouncementBarClient from '@/components/AnnouncementBarClient'
import { PageIntro } from '@/components/ui/PageIntro'
import PerformanceMonitor, { CriticalResourcePreloader } from '@/components/ui/PerformanceMonitor'
import Script from 'next/script'

export const dynamic = 'force-dynamic'

async function AnnouncementBar() {
  if (!process.env.REDIS_URL) return null

  try {
    const redis = getRedis()
    const raw = await redis.get('system:settings')
    const settings = raw ? JSON.parse(raw) : null
    if (!settings?.announcementEnabled || !settings?.announcementMessage) return null

    const id = `${settings.announcementType}:${settings.announcementMessage}`
    return (
      <AnnouncementBarClient
        id={id}
        enabled={!!settings.announcementEnabled}
        type={settings.announcementType || 'info'}
        message={settings.announcementMessage}
        linkLabel={settings.announcementLinkLabel}
        linkUrl={settings.announcementLinkUrl}
      />
    )
  } catch (e) {
    // Fail closed if Redis is unavailable
    return null
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://idlemat.es'),
  title: {
    default: 'IdleMates — The Cloud Buddy for Steam',
    template: '%s — IdleMates'
  },
  description: "Your games never sleep. IdleMates is your cloud buddy for Steam—we're your lazy gamer alter-ego. Idle smarter, not harder.",
  icons: [
    { rel: 'icon', type: 'image/svg+xml', url: '/logo.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' }
  ],
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    title: 'IdleMates — The Cloud Buddy for Steam',
    description: "Your games never sleep. IdleMates is your cloud buddy for Steam—we're your lazy gamer alter-ego. Idle smarter, not harder.",
    siteName: 'IdleMates',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'IdleMates'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IdleMates — The Cloud Buddy for Steam',
    description: "Your games never sleep. IdleMates is your cloud buddy for Steam—we're your lazy gamer alter-ego. Idle smarter, not harder.",
    images: ['/api/og']
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8A5CFF' },
    { media: '(prefers-color-scheme: dark)', color: '#8A5CFF' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical CDNs */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://kit-pro.fontawesome.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.steamstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.cloudflare.steamstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for additional resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//kit-pro.fontawesome.com" />
        <link rel="dns-prefetch" href="//cdn.steamstatic.com" />
        <link rel="dns-prefetch" href="//cdn.cloudflare.steamstatic.com" />

        {/* Fonts are loaded via globals.css @import or next/font */}
        
        
        {/* Navigation prefetch is handled by Next.js <Link> components */}
        
  {/* Avoid hard-coding Next chunks: removed modulepreload that caused 404s in production */}
        
        {/* Prefetch common images */}
        <link rel="prefetch" href="/logo.svg" as="image" />
        <link rel="prefetch" href="/favicon-32x32.png" as="image" />
        
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('idlemat-ui-theme') || 'dark';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const effectiveTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
                document.documentElement.classList.toggle('light', effectiveTheme === 'light');
                document.documentElement.style.colorScheme = effectiveTheme;
              })();
            `,
          }}
        />
        
        {/* Load fonts with async loading */}
        <Script
          id="async-css-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function loadCSS(href, media) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.media = media || 'all';
                document.head.appendChild(link);
              }
              // Load fonts after critical resources
              setTimeout(() => {
                loadCSS('/fonts/optimized-fonts.css');
                loadCSS('https://kit-pro.fontawesome.com/releases/v6.7.2/css/pro.min.css');
              }, 100);
            `,
          }}
        />
        
        {/* Fallback for no-js */}
        <noscript>
          <link rel="stylesheet" href="/fonts/optimized-fonts.css" />
          <link href="https://kit-pro.fontawesome.com/releases/v6.7.2/css/pro.min.css" rel="stylesheet" />
        </noscript>
      </head>
      <body suppressHydrationWarning>
        <div className="relative">
          
          {/* Skip to content for accessibility */}
          <a 
            href="#main-content" 
            className="skip-to-content focus-enhanced"
          >
            Skip to main content
          </a>
          
          {/* Global announcement banner (server component) should be outside client Providers */}
          <AnnouncementBar />
          <Providers>
            <PerformanceMonitor />
            <CriticalResourcePreloader />
            <Header />
            <PageIntro>
              <div id="main-content">
                {children}
              </div>
            </PageIntro>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  )
}
