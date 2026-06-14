import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getAvatarUrl } from '@/lib/utils'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'News & Updates',
  description: 'Latest product updates, improvements, and announcements from your cloud buddy. Stay updated on new features, game support, and platform enhancements.',
  openGraph: {
    title: 'News & Updates — IdleMates',
    description: 'Latest product updates, improvements, and announcements from your cloud buddy. Stay updated on new features, game support, and platform enhancements.',
    images: [
      {
        url: '/api/og?title=News%20%26%20Updates&subtitle=Latest%20product%20updates%2C%20improvements%2C%20and%20announcements',
        width: 1200,
        height: 630,
        alt: 'IdleMates News & Updates'
      }
    ]
  },
  twitter: {
    title: 'News & Updates — IdleMates',
    description: 'Latest product updates, improvements, and announcements from your cloud buddy. Stay updated on new features, game support, and platform enhancements.',
    images: ['/api/og?title=News%20%26%20Updates&subtitle=Latest%20product%20updates%2C%20improvements%2C%20and%20announcements']
  }
}

type NewsPost = { id: string; title: string; slug: string; excerpt: string | null; createdAt: Date; author?: { email: string | null; avatarUrl?: string | null } | null }

export default async function NewsPage() {
  type Post = { id: string; title: string; slug: string; excerpt: string | null; createdAt: Date; author: { email: string | null; avatarUrl?: string | null } | null }
  const posts = (await (prisma as any).newsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { email: true, avatarUrl: true } } }
  })) as Post[]

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <span className="text-primary font-semibold">News</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">News & Updates</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Latest product updates, improvements, and announcements.</p>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="container-page py-12 md:py-18">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((p: Post) => (
              <Link key={p.id} href={`/news/${p.slug}`} className="card p-6 block hover:border-primary/40 transition-colors">
                <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{p.title}</h3>
                {p.excerpt && <p className="text-muted text-sm">{p.excerpt}</p>}
                <div className="text-xs text-white/70 mt-3 flex items-center gap-2">
                  {p.author?.email && (
                    <img src={getAvatarUrl(p.author.email, p.author.avatarUrl, 40)} alt="author" className="w-4 h-4 rounded-full object-cover border border-white/10" />
                  )}
                  <span>{fmtDate(p.createdAt)}{p.author?.email ? ` · by ${p.author.email.split('@')[0]}` : ''}</span>
                </div>
              </Link>
            ))}
          </div>
          {posts.length === 0 && (
            <div className="card p-12 text-center text-muted mt-6">No news yet</div>
          )}
        </div>
      </section>
    </main>
  )
}
