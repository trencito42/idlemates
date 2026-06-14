import { prisma } from '@/lib/db'
import { getAvatarUrl } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let post: any = null

  try {
    post = await (prisma as any).newsPost.findFirst({
      where: { slug: params.slug, published: true },
      include: { author: { select: { email: true, avatarUrl: true } } }
    })
  } catch {
    return {
      title: 'News',
      description: 'Read the latest updates from your cloud buddy for Steam.'
    }
  }

  if (!post) {
    return {
      title: 'Article Not Found',
      description: 'The article you are looking for could not be found.'
    }
  }

  const description = post.excerpt || `${post.content?.substring(0, 160)}...` || 'Read the latest updates from your cloud buddy for Steam.'
  const ogTitle = encodeURIComponent(post.title)
  const ogSubtitle = encodeURIComponent(description.substring(0, 100))

  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} — IdleMates`,
      description,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
      authors: post.author?.email ? [post.author.email.split('@')[0]] : [],
      images: [
        {
          url: `/api/og?title=${ogTitle}&subtitle=${ogSubtitle}`,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      title: `${post.title} — IdleMates`,
      description,
      images: [`/api/og?title=${ogTitle}&subtitle=${ogSubtitle}`]
    }
  }
}

// Configure marked for better Markdown fidelity
marked.setOptions({
  gfm: true,
  breaks: true,
})

type NewsPost = { id: string; title: string; slug: string; excerpt: string | null; content: string; createdAt: Date; author?: { email: string | null; avatarUrl?: string | null } | null }

export default async function NewsDetail({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user && (session.user as any).role === 'ADMIN'
  
  const post = await (prisma as any).newsPost.findFirst({
    where: { slug: params.slug, published: true },
    include: { author: { select: { email: true, avatarUrl: true } } }
  })
  if (!post) return notFound()

  // Render markdown to HTML
  const rawHtml = await marked.parse(post.content || '')
  // Sanitize to prevent XSS and add target/rel to external links
  const html = DOMPurify.sanitize(String(rawHtml), {
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe']
  }).replaceAll('<a href="', '<a target="_blank" rel="noopener noreferrer" href="')
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-16 md:py-24">
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <span className="text-primary font-semibold">News</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{post.title}</span>
            </h1>
            <div className="text-sm text-white/70 flex flex-col items-center gap-2 justify-center">
              <div className="flex items-center gap-2">
                {post.author?.email && (
                  <img
                    src={getAvatarUrl(post.author.email, post.author.avatarUrl, 40)}
                    alt="author"
                    className="w-5 h-5 rounded-full object-cover border border-white/10"
                  />
                )}
                <span>
                  Published {fmtDate(post.createdAt)}
                  {post.author?.email ? ` · by ${post.author.email.split('@')[0]}` : ''}
                </span>
              </div>
              {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                <div className="text-xs text-white/50">
                  Updated {fmtDate(post.updatedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container-page py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          {isAdmin && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="text-sm text-primary">
                <i className="fa-solid fa-crown mr-2"></i>
                Admin View
              </div>
              <Link 
                href={`/admin/news/${post.id}`}
                className="btn-secondary btn-sm"
              >
                <i className="fa-solid fa-edit mr-2"></i>
                Edit Post
              </Link>
            </div>
          )}
          
          {post.excerpt && <p className="text-lg text-white/70 mb-6">{post.excerpt}</p>}
          <article className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-pre:bg-white/5 prose-code:bg-white/10 prose-li:marker:text-white/50">
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: html as string }} />
          </article>
        </div>
      </section>
    </main>
  )
}
