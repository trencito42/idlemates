import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3699'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/*', '/admin/*', '/api/*', '/auth/reset/*', '/auth/verify/*']
      },
      // Aggressive crawling for major search engines
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1
      },
      {
        userAgent: 'Slurp', // Yahoo
        allow: '/',
        crawlDelay: 1
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  }
}
