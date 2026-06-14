import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3699'
  const now = new Date()

  // High priority pages for SEO domination
  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: now },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: now },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' as const, lastModified: now },
    { path: '/security', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: now },
    { path: '/news', priority: 0.8, changeFrequency: 'daily' as const, lastModified: now },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: now },
    { path: '/legal/tos', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: now },
    { path: '/legal', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: now },
    
    // SEO landing pages for different keywords
    { path: '/steam-idle-hours', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: now },
    { path: '/steam-card-farming', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: now },
    { path: '/steam-level-up', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: now },
  ]

  let allRoutes = staticRoutes.map(route => ({
    url: `${siteUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // Add dynamic news articles
  try {
    const articles = await (prisma as any).newsPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    })

    const newsRoutes = articles.map((article: any) => ({
      url: `${siteUrl}/news/${article.slug}`,
      lastModified: article.updatedAt || article.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    allRoutes = [...allRoutes, ...newsRoutes]
  } catch (error) {
    console.warn('Failed to fetch news articles for sitemap:', error)
  }

  return allRoutes
}
