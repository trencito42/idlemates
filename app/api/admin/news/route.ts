import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const db = prisma as any
    const posts = await db.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, content: true, published: true, createdAt: true, updatedAt: true }
    })
    return NextResponse.json({ posts })
  } catch (e: any) {
    console.error('GET /api/admin/news error', e)
    return NextResponse.json({ posts: [], error: 'Failed to load' }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { title, slug, excerpt, content, published } = await req.json()
    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const db = prisma as any
    let post
    try {
      post = await db.newsPost.create({ data: { title, slug, excerpt, content, published: !!published, authorId: (session.user as any).id } })
    } catch (err) {
      // Fallback for DBs without authorId column yet
      post = await db.newsPost.create({ data: { title, slug, excerpt, content, published: !!published } })
    }
    return NextResponse.json({ post })
  } catch (e: any) {
    console.error('POST /api/admin/news error', e)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
