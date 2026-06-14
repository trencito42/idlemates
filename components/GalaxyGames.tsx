'use client'

import { useEffect, useRef } from 'react'

// Minimal set of covers; reuse the existing list from FloatingGames for now
const GAMES = [
  { id: 730, name: 'CS:GO', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg' },
  { id: 570, name: 'Dota 2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg' },
  { id: 271590, name: 'GTA V', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg' },
  { id: 252490, name: 'Rust', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg' },
  { id: 413150, name: 'Stardew', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg' },
  { id: 1172470, name: 'Apex', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg' },
  { id: 1245620, name: 'Elden', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
  { id: 1091500, name: 'Cyber', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
  { id: 440, name: 'TF2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg' },
  { id: 578080, name: 'PUBG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg' },
  { id: 381210, name: 'DbD', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/381210/header.jpg' },
  { id: 381210, name: 'Ark', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/346110/header.jpg' },
  { id: 1174180, name: 'RDR2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' },
  { id: 271590, name: 'Terraria', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg' },
]

type Node = {
  img: HTMLImageElement
  angle: number
  speed: number
  radius: number
  size: number
  loaded: boolean
}

export default function GalaxyGames() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const dprRef = useRef(1)
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      dprRef.current = dpr
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    resize()
    window.addEventListener('resize', resize)

    // Build galaxy rings: inner/medium/outer, clockwise
    const center = () => ({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 })
    const minDim = Math.min(canvas.clientWidth, canvas.clientHeight)
    const rings = [0.22, 0.34, 0.46].map((r, i) => ({ r: minDim * r, speed: 0.15 + i * 0.08, size: 64 + i * 10 }))

    const imgs = GAMES.slice(0, 18).map(src => {
      const img = new Image()
      img.decoding = 'async'
      img.referrerPolicy = 'no-referrer'
      img.src = src.image
      return img
    })
    const nodes: Node[] = []
    let idx = 0
    for (const ring of rings) {
      const perRing = Math.max(4, Math.min(8, Math.floor(minDim / 180)))
      for (let i = 0; i < perRing; i++) {
        const img = imgs[idx % imgs.length]
        const n: Node = {
          img,
          angle: (i / perRing) * Math.PI * 2,
          speed: ring.speed,
          radius: ring.r,
          size: ring.size,
          loaded: false,
        }
        img.onload = () => (n.loaded = true)
        img.onerror = () => {
          n.loaded = false
          // Retry once after a short delay to avoid transient CDN issues
          setTimeout(() => {
            try { img.src = img.src.split('?')[0] + '?t=' + Date.now() } catch {}
          }, 800)
        }
        nodes.push(n)
        idx++
      }
    }
    nodesRef.current = nodes

    let last = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(32, now - last) / 1000
      last = now
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      const { x: cx, y: cy } = center()

      // Background halo
      const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(cx, cy))
      halo.addColorStop(0, 'rgba(138,92,255,0.20)')
      halo.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(cx, cy), 0, Math.PI * 2)
      ctx.fill()

      // Subtle spiral arms
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(now / 8000)
      const arms = 4
      for (let a = 0; a < arms; a++) {
        ctx.rotate((Math.PI * 2) / arms)
        ctx.strokeStyle = 'rgba(138,92,255,0.06)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let t = 0; t < 1; t += 0.02) {
          const rr = minDim * (0.1 + 0.45 * t)
          const ang = t * 6
          const x = Math.cos(ang) * rr
          const y = Math.sin(ang) * rr
          if (t === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      // Nodes
      for (const n of nodesRef.current) {
        n.angle += n.speed * dt
        const x = cx + Math.cos(n.angle) * n.radius
        const y = cy + Math.sin(n.angle) * n.radius
        const s = n.size
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.sin(now / 3000 + n.radius * 0.001) * 0.06)
        ctx.globalAlpha = 0.85
        // Card bg
        ctx.fillStyle = 'rgba(138,92,255,0.10)'
        ctx.strokeStyle = 'rgba(138,92,255,0.25)'
        ctx.lineWidth = 1
        roundRect(ctx, -s / 2, -s * 0.32, s, s * 0.64, 12)
        ctx.fill()
        ctx.stroke()
        if (n.loaded) {
          ctx.save()
          roundRect(ctx, -s / 2, -s * 0.32, s, s * 0.64, 12)
          ctx.clip()
          ctx.drawImage(n.img, -s / 2, -s * 0.32, s, s * 0.64)
          ctx.restore()
        } else {
          // Shimmer placeholder so no card appears empty
          ctx.save()
          roundRect(ctx, -s / 2, -s * 0.32, s, s * 0.64, 12)
          ctx.clip()
          const grad = ctx.createLinearGradient(-s / 2 - s, 0, s / 2 + s, 0)
          const off = (now % 1500) / 1500 // 0..1
          grad.addColorStop(Math.max(0, off - 0.3), 'rgba(255,255,255,0.06)')
          grad.addColorStop(off, 'rgba(255,255,255,0.14)')
          grad.addColorStop(Math.min(1, off + 0.3), 'rgba(255,255,255,0.06)')
          ctx.fillStyle = grad
          ctx.fillRect(-s / 2, -s * 0.32, s, s * 0.64)
          ctx.restore()
        }
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
