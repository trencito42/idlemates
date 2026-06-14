'use client'

import { useEffect, useRef } from 'react'

// Different set of games for pricing page
const GAMES = [
  { id: 1174180, name: 'Red Dead Redemption 2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' },
  { id: 1245620, name: 'Elden Ring', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
  { id: 1091500, name: 'Cyberpunk 2077', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
  { id: 271590, name: 'Grand Theft Auto V', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg' },
  { id: 413150, name: 'Stardew Valley', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg' },
  { id: 1172470, name: 'Apex Legends', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg' },
  { id: 252490, name: 'Rust', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg' },
  { id: 570, name: 'Dota 2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg' },
  { id: 730, name: 'Counter-Strike 2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg' },
  { id: 578080, name: 'PUBG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg' },
  { id: 381210, name: 'Dead by Daylight', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/381210/header.jpg' },
  { id: 346110, name: 'ARK', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/346110/header.jpg' },
]

type FloatingGame = {
  img: HTMLImageElement
  x: number
  y: number
  z: number
  rotX: number
  rotY: number
  rotZ: number
  speedX: number
  speedY: number
  speedRot: number
  size: number
  loaded: boolean
  opacity: number
}

export default function FloatingGameStack() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gamesRef = useRef<FloatingGame[]>([])
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

    // Initialize floating games
    const games: FloatingGame[] = []
    GAMES.slice(0, 8).forEach((game, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.referrerPolicy = 'no-referrer'
      img.src = game.image
      
      const floatingGame: FloatingGame = {
        img,
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        z: Math.random() * 100 + 50, // Depth for 3D effect
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 20,
        speedY: (Math.random() - 0.5) * 20,
        speedRot: (Math.random() - 0.5) * 0.02,
        size: 80 + Math.random() * 40,
        loaded: false,
        opacity: 0.6 + Math.random() * 0.4
      }
      
      img.onload = () => (floatingGame.loaded = true)
      img.onerror = () => {
        floatingGame.loaded = false
        setTimeout(() => {
          try { 
            img.src = img.src.split('?')[0] + '?t=' + Date.now() 
          } catch {}
        }, 800)
      }
      
      games.push(floatingGame)
    })
    gamesRef.current = games

    let last = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(32, now - last) / 1000
      last = now
      
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      
      // Sort by z-depth for proper layering
      const sortedGames = [...gamesRef.current].sort((a, b) => b.z - a.z)
      
      for (const game of sortedGames) {
        // Update position
        game.x += game.speedX * dt
        game.y += game.speedY * dt
        game.rotZ += game.speedRot * dt
        
        // Wrap around edges with padding
        const padding = game.size
        if (game.x < -padding) game.x = canvas.clientWidth + padding
        if (game.x > canvas.clientWidth + padding) game.x = -padding
        if (game.y < -padding) game.y = canvas.clientHeight + padding
        if (game.y > canvas.clientHeight + padding) game.y = -padding
        
        // Calculate 3D perspective scale
        const scale = game.z / 150
        const actualSize = game.size * scale
        
        ctx.save()
        ctx.translate(game.x, game.y)
        ctx.rotate(game.rotZ)
        ctx.scale(scale, scale)
        ctx.globalAlpha = game.opacity * scale
        
        // Draw game card with subtle shadow
        const halfSize = actualSize / 2 / scale
        
        // Shadow
        ctx.save()
        ctx.translate(4, 4)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
        ctx.fill()
        ctx.restore()
        
        // Card background
        ctx.fillStyle = 'rgba(138, 92, 255, 0.1)'
        ctx.strokeStyle = 'rgba(138, 92, 255, 0.3)'
        ctx.lineWidth = 1
        roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
        ctx.fill()
        ctx.stroke()
        
        if (game.loaded) {
          ctx.save()
          roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
          ctx.clip()
          ctx.drawImage(game.img, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2)
          ctx.restore()
          
          // Subtle glow effect
          ctx.save()
          ctx.globalCompositeOperation = 'overlay'
          const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize)
          glow.addColorStop(0, 'rgba(138, 92, 255, 0.1)')
          glow.addColorStop(1, 'rgba(138, 92, 255, 0)')
          ctx.fillStyle = glow
          ctx.fillRect(-halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2)
          ctx.restore()
        } else {
          // Shimmer loading effect
          ctx.save()
          roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
          ctx.clip()
          const grad = ctx.createLinearGradient(-halfSize - halfSize, 0, halfSize + halfSize, 0)
          const off = (now % 2000) / 2000
          grad.addColorStop(Math.max(0, off - 0.3), 'rgba(255, 255, 255, 0.05)')
          grad.addColorStop(off, 'rgba(255, 255, 255, 0.15)')
          grad.addColorStop(Math.min(1, off + 0.3), 'rgba(255, 255, 255, 0.05)')
          ctx.fillStyle = grad
          ctx.fillRect(-halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2)
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
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