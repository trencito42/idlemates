'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { marked } from 'marked'

type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  published: boolean
  createdAt: string
  updatedAt?: string
}

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([])
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

  function wrapSelected(prefix: string, suffix: string = prefix) {
    replaceSelection((text, s) => {
      const wrapped = `${prefix}${text || 'text'}${suffix}`
      const cursorStart = s + prefix.length
      const cursorEnd = cursorStart + (text ? text.length : 4)
      return { next: wrapped, selectStart: cursorStart, selectEnd: cursorEnd }
    })
  }

  function insertAtLineStart(token: string) {
    const el = textareaRef.current
    if (!el) return
    replaceSelection((text, start) => {
      // Expand to full line
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const segment = content.slice(lineStart, start) + text
      const updated = token + (segment || 'Heading')
      return { next: updated, selectStart: lineStart + token.length, selectEnd: lineStart + updated.length }
    })
  }

  function makeList() {
    const el = textareaRef.current
    if (!el) return
    replaceSelection((text) => {
      const hasNewline = text.includes('\n')
      const lines = (hasNewline ? text : (text || 'List item')).split(/\n/) 
      const bulleted = lines.map(l => (l.trim().length ? `- ${l}` : '- ')).join('\n')
      return { next: bulleted }
    })
  }

  function makeCodeBlock() {
    replaceSelection((text) => {
      const body = text || 'code'
      const fenced = '```\n' + body + '\n```'
      return { next: fenced }
    })
  }

  function makeLink() {
    const url = prompt('Link URL:') || 'https://'
    replaceSelection((text) => {
      const label = text || 'link'
      return { next: `[${label}](${url})` }
    })
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/news')
      if (!res.ok) throw new Error('Failed to load')
      const text = await res.text()
      const data = text ? JSON.parse(text) : { posts: [] }
      setPosts(data.posts || [])
    } catch (e) {
      console.error('Load news error', e)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createPost() {
    if (!title || !slug || !content) return
    setSaving(true)
    const res = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, excerpt, content, published })
    })
    setSaving(false)
    if (res.ok) {
      setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setPublished(false)
      load()
    } else {
      const msg = await res.text().catch(() => '')
      console.error('Create post failed', msg)
    }
  }

  async function togglePublish(id: string, value: boolean) {
    await fetch(`/api/admin/news/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: value })
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    load()
  }

  async function backfillAuthors() {
    const res = await fetch('/api/admin/news/backfill-authors', { method: 'POST' })
    if (!res.ok) {
      console.error('Backfill authors failed')
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">News</h1>
        <p className="text-muted">Publish updates to the News page</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button onClick={backfillAuthors} className="btn btn-sm">Assign all to me</button>
        </div>
        <div className="grid gap-3">
          <input className="px-3 py-2 rounded bg-surface/2 border border-border/10" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="px-3 py-2 rounded bg-surface/2 border border-border/10" placeholder="slug (e.g. october-update)" value={slug} onChange={e => setSlug(e.target.value)} />
          <input className="px-3 py-2 rounded bg-surface/2 border border-border/10" placeholder="Excerpt (optional)" value={excerpt} onChange={e => setExcerpt(e.target.value)} />
          {/* Toolbar */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="Bold" onClick={() => wrapSelected('**')}>B</button>
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="Italic" onClick={() => wrapSelected('*')}>I</button>
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="Heading" onClick={() => insertAtLineStart('## ')}>H2</button>
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="List" onClick={makeList}>UL</button>
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="Code" onClick={makeCodeBlock}>&lt;/&gt;</button>
              <button type="button" className="px-2 py-1 rounded bg-surface/2 border border-border/10 hover:bg-surface/3" title="Link" onClick={makeLink}>Link</button>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => setView('edit')} className={`px-2 py-1 rounded border ${view==='edit'?'border-primary text-primary':'border-border/10 text-muted'} hover:text-fg`}>Edit</button>
              <button type="button" onClick={() => setView('preview')} className={`px-2 py-1 rounded border ${view==='preview'?'border-primary text-primary':'border-border/10 text-muted'} hover:text-fg`}>Preview</button>
              <button type="button" onClick={() => setView('split')} className={`px-2 py-1 rounded border ${view==='split'?'border-primary text-primary':'border-border/10 text-muted'} hover:text-fg`}>Split</button>
            </div>
          </div>

          {/* Editor/Preview */}
          {view !== 'preview' && (
            <textarea
              ref={textareaRef}
              className="px-3 py-2 rounded bg-surface/2 border border-border/10 min-h-40 font-mono"
              placeholder="Content (Markdown allowed)"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          )}
          {view === 'preview' && (
            <div className="rounded border border-border/10 p-4 prose prose-invert" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
          {view === 'split' && (
            <div className="grid md:grid-cols-2 gap-3">
              <textarea
                ref={textareaRef}
                className="px-3 py-2 rounded bg-surface/2 border border-border/10 min-h-60 font-mono"
                placeholder="Content (Markdown allowed)"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="rounded border border-border/10 p-4 prose prose-invert" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /> Published</label>
            <button className="btn btn-sm disabled:opacity-50" disabled={saving || !title || !slug || !content} onClick={createPost}>{saving ? 'Saving...' : 'Create'}</button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-muted">Loading...</div>}
        {posts.map(p => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/news/${p.slug}`} className="font-semibold hover:underline">{p.title}</Link>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.published ? 'Published' : 'Draft'}</span>
                </div>
                <div className="text-xs text-muted">
                  Created: {new Date(p.createdAt).toLocaleDateString('en-US')}
                  {p.updatedAt && new Date(p.updatedAt).getTime() !== new Date(p.createdAt).getTime() && (
                    <span className="ml-3">Updated: {new Date(p.updatedAt).toLocaleDateString('en-US')}</span>
                  )}
                </div>
                {p.excerpt && <p className="text-sm mt-2 text-muted">{p.excerpt}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/news/${p.id}`} className="btn-secondary btn-sm">
                  <i className="fa-solid fa-edit mr-1"></i>Edit
                </Link>
                <button className="btn-secondary btn-sm" onClick={() => togglePublish(p.id, !p.published)}>{p.published ? 'Unpublish' : 'Publish'}</button>
                <button className="btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && !loading && (
          <div className="card p-12 text-center text-muted">No posts yet</div>
        )}
      </div>
    </div>
  )
}
