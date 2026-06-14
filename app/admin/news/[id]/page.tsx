'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { marked } from 'marked'

type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<NewsPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'edit' | 'preview' | 'split'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Markdown preview HTML
  const previewHtml = marked.parse(content || '') as string

  function replaceSelection(transform: (text: string, start: number, end: number) => { next: string; selectStart?: number; selectEnd?: number }) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const before = content.slice(0, start)
    const selected = content.slice(start, end)
    const after = content.slice(end)
    const { next, selectStart, selectEnd } = transform(selected, start, end)
    const newContent = before + next + after
    setContent(newContent)
    // Restore selection after state update
    requestAnimationFrame(() => {
      const posStart = selectStart ?? start
      const posEnd = selectEnd ?? (posStart + next.length)
      el.focus()
      el.setSelectionRange(posStart, posEnd)
    })
  }

  useEffect(() => {
    if (!postId) return
    
    async function loadPost() {
      try {
        const res = await fetch('/api/admin/news')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        const foundPost = data.posts.find((p: NewsPost) => p.id === postId)
        
        if (!foundPost) {
          router.push('/admin/news')
          return
        }
        
        setPost(foundPost)
        setTitle(foundPost.title)
        setSlug(foundPost.slug)
        setExcerpt(foundPost.excerpt || '')
        setContent(foundPost.content)
        setPublished(foundPost.published)
      } catch (e) {
        console.error('Load post error', e)
        router.push('/admin/news')
      } finally {
        setLoading(false)
      }
    }
    
    loadPost()
  }, [postId, router])

  async function updatePost() {
    if (!title || !slug || !content || !post) return
    setSaving(true)
    
    const res = await fetch(`/api/admin/news/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, excerpt, content, published })
    })
    
    setSaving(false)
    if (res.ok) {
      router.push('/admin/news')
    } else {
      const msg = await res.text().catch(() => '')
      console.error('Update post failed', msg)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Post not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Edit News Post</h1>
            <p className="text-muted mt-2">Update your news article</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/news')}
              className="btn-secondary"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to News
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input w-full"
                    placeholder="Post title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="input w-full"
                    placeholder="url-slug"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Excerpt (optional)</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="input w-full h-20 resize-none"
                    placeholder="Brief description..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="published" className="text-sm">Published</label>
                </div>
                
                <button
                  onClick={updatePost}
                  disabled={saving || !title || !slug || !content}
                  className="btn w-full"
                >
                  {saving ? 'Updating...' : 'Update Post'}
                </button>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="text-sm text-muted space-y-2">
                <div><strong>Created:</strong> {new Date(post.createdAt).toLocaleDateString()}</div>
                <div><strong>Updated:</strong> {new Date(post.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Editor/Preview */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              {/* View toggle */}
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                <button
                  onClick={() => setView('edit')}
                  className={`px-3 py-1 rounded text-sm ${view === 'edit' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setView('preview')}
                  className={`px-3 py-1 rounded text-sm ${view === 'preview' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setView('split')}
                  className={`px-3 py-1 rounded text-sm ${view === 'split' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                >
                  Split
                </button>
              </div>

              {/* Formatting toolbar */}
              {(view === 'edit' || view === 'split') && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-surface-elevated rounded border">
                  <button onClick={() => replaceSelection((text) => ({ next: `**${text || 'bold'}**` }))} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded">
                    <i className="fa-solid fa-bold"></i>
                  </button>
                  <button onClick={() => replaceSelection((text) => ({ next: `*${text || 'italic'}*` }))} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded">
                    <i className="fa-solid fa-italic"></i>
                  </button>
                  <button onClick={() => replaceSelection((text) => ({ next: `[${text || 'text'}](url)` }))} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded">
                    <i className="fa-solid fa-link"></i>
                  </button>
                  <button onClick={() => replaceSelection((text) => ({ next: `\`${text || 'code'}\`` }))} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded">
                    <i className="fa-solid fa-code"></i>
                  </button>
                </div>
              )}

              <div className={`grid ${view === 'split' ? 'grid-cols-2 gap-4' : 'grid-cols-1'} h-96`}>
                {/* Editor */}
                {(view === 'edit' || view === 'split') && (
                  <div className="h-full">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input w-full h-full resize-none font-mono text-sm"
                      placeholder="Write your post content in Markdown..."
                    />
                  </div>
                )}

                {/* Preview */}
                {(view === 'preview' || view === 'split') && (
                  <div className="h-full overflow-y-auto border border-border rounded p-4 bg-surface-elevated">
                    <div className="prose prose-invert max-w-none prose-sm">
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}