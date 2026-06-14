'use client'

import { useEffect, useRef } from 'react'

// Popular Steam games with their app IDs and images
const GAMES = [
  { id: 730, name: 'CS:GO', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg' },
  { id: 440, name: 'TF2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg' },
  { id: 570, name: 'Dota 2', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg' },
  { id: 271590, name: 'GTA V', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg' },
  { id: 578080, name: 'PUBG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg' },
  { id: 252490, name: 'Rust', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg' },
  { id: 413150, name: 'Stardew Valley', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg' },
  { id: 892970, name: 'Valheim', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/892970/header.jpg' },
  { id: 427520, name: 'Factorio', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/427520/header.jpg' },
  { id: 1172470, name: 'Apex', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg' },
  { id: 1245620, name: 'Elden Ring', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
  { id: 1091500, name: 'Cyberpunk', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
]

type Game = (typeof GAMES)[number]

interface OrbitCard {
  id: number
  game: Game
  img: HTMLImageElement
  loaded: boolean
  angle: number
  speed: number
  radius: number
  depth: number // 1..3, controls size/opacity/speed
  bobPhase: number
  // computed each frame
  x?: number
  y?: number
  w?: number
  h?: number
  // interactive state
  scaleBoost?: number
  // ragdoll physics state
  prevX?: number
  prevY?: number
  lastAngle?: number
  vx?: number
  vy?: number
  tilt?: number
  tiltVel?: number
  stretch?: number
  stretchVel?: number
}

export default function FloatingGames() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardsRef = useRef<OrbitCard[]>([])
  const rafRef = useRef<number>()
  const dprRef = useRef<number>(1)
  const reducedRef = useRef<boolean>(false)
  const hoveredIdRef = useRef<number | null>(null)
  const draggingIdRef = useRef<number | null>(null)
  const dragOffsetRef = useRef<{x:number, y:number}>({ x: 0, y: 0 })
  const lastMoveRef = useRef<{ t: number; angle: number } | null>(null)
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const touchPrimedRef = useRef<boolean>(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = prefersReduced.matches
    const onPref = (e: MediaQueryListEvent) => (reducedRef.current = e.matches)
    prefersReduced.addEventListener('change', onPref)

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      dprRef.current = dpr
      canvas.width = Math.floor(clientWidth * dpr)
      canvas.height = Math.floor(clientHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // Make canvas fill parent absolutely
    const style = canvas.style
    style.width = '100%'
    style.height = '100%'
    resize()
  window.addEventListener('resize', resize)

    // Build orbiting cards
    const count = Math.max(6, Math.min(12, Math.floor(window.innerWidth / 220)))
    const center = () => ({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 })

    const shuffle = <T,>(arr: T[]): T[] => {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    // Ensure uniqueness: sample without replacement up to count
    const gamesPool = shuffle(GAMES).slice(0, Math.min(count, GAMES.length))
    const makeCard = (i: number): OrbitCard => {
      const game = gamesPool[i % gamesPool.length]
      const img = new Image()
      img.decoding = 'async'
      img.referrerPolicy = 'no-referrer'
      const depth = 1 + (i % 3) // 1..3
      const radiusBase = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.35
      const radius = radiusBase * (0.6 + 0.15 * depth) + (Math.random() - 0.5) * 40
      const speed = (0.006 + 0.002 * depth) * (Math.random() > 0.5 ? 1 : -1)
      const angle = Math.random() * Math.PI * 2
      const bobPhase = Math.random() * Math.PI * 2
      const card: OrbitCard = { id: i, game, img, loaded: false, angle, speed, radius, depth, bobPhase, scaleBoost: 0 }
      img.onload = () => (card.loaded = true)
      img.onerror = () => (card.loaded = false)
      img.src = game.image
      return card
    }
    cardsRef.current = Array.from({ length: count }, (_, i) => makeCard(i))

    const drawRounded = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    let last = performance.now()
    const animate = (now: number) => {
      const dtMs = Math.min(33, now - last)
      const dt = dtMs / 1000 // seconds
      last = now
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      const { x: cx, y: cy } = center()

      // Soft vignette so visuals fade near edges and avoid text clash
  const vignette = ctx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.25, cx, cy, Math.max(cx, cy))
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.18)')

  for (const card of cardsRef.current) {
        // motion
        if (!reducedRef.current && draggingIdRef.current !== card.id) card.angle += card.speed * dt
        const bob = Math.sin((now / 2200) + card.bobPhase) * (1.5 + card.depth * 0.8)
        let x = cx + Math.cos(card.angle) * (card.radius + bob)
        let y = cy + Math.sin(card.angle) * (card.radius + bob)
        if (draggingIdRef.current === card.id) {
          // Follow pointer while dragging
          x = pointerPosRef.current.x - dragOffsetRef.current.x
          y = pointerPosRef.current.y - dragOffsetRef.current.y
          // Update angle/radius live to avoid snapping on release
          const dx = x - cx
          const dy = y - cy
          card.radius = Math.hypot(dx, dy)
          card.angle = Math.atan2(dy, dx)
        }

    // --- Ragdoll: derive velocity and physics targets
    const prevX = card.prevX ?? x
    const prevY = card.prevY ?? y
    const vx = dt > 0 ? (x - prevX) / dt : 0
    const vy = dt > 0 ? (y - prevY) / dt : 0
    card.vx = vx
    card.vy = vy
    const lastA = card.lastAngle ?? card.angle
    let dA = card.angle - lastA
    while (dA > Math.PI) dA -= 2 * Math.PI
    while (dA < -Math.PI) dA += 2 * Math.PI
    const angVel = dt > 0 ? dA / dt : 0
    // Tilt into motion/turn with limits
    const targetTilt = Math.max(-0.35, Math.min(0.35, -angVel * 0.35))
    const ksTilt = 16
    const kdTilt = 8
    card.tiltVel = (card.tiltVel || 0) + ((targetTilt - (card.tilt || 0)) * ksTilt - (card.tiltVel || 0) * kdTilt) * dt
    card.tilt = (card.tilt || 0) + (card.tiltVel || 0) * dt
    // Stretch with speed
    const speedPix = Math.hypot(vx, vy)
    const targetStretch = Math.min(0.12, speedPix * 0.0009)
    const ksStr = 10
    const kdStr = 12
    card.stretchVel = (card.stretchVel || 0) + ((targetStretch - (card.stretch || 0)) * ksStr - (card.stretchVel || 0) * kdStr) * dt
    card.stretch = (card.stretch || 0) + (card.stretchVel || 0) * dt

        // size/opacity by depth
  const baseW = 200
  const baseH = 95
  const baseScale = 0.95 + card.depth * 0.12
  // Interactive scale boost decays over time
  card.scaleBoost = (card.scaleBoost || 0) * 0.9
  const isHovered = hoveredIdRef.current === card.id
  if (isHovered) card.scaleBoost = Math.max(card.scaleBoost, 0.05)
  if (draggingIdRef.current === card.id) card.scaleBoost = Math.max(card.scaleBoost, 0.12)
  const scale = baseScale * (1 + (card.scaleBoost || 0))
        const w = baseW * scale
        const h = baseH * scale
  const alphaBase = 0.26 + card.depth * 0.08
  const alpha = isHovered || draggingIdRef.current === card.id ? Math.min(0.95, alphaBase + 0.12) : alphaBase

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(x, y)
  // Ragdoll rotation + micro jiggle
  ctx.rotate((card.tilt || 0) + Math.sin(now / 1400 + card.bobPhase) * 0.01)
  // Ragdoll stretch/squash
  const s = card.stretch || 0
  ctx.scale(1 + s, 1 - s * 0.5)

        // Shadow/glow
  ctx.shadowColor = 'rgba(138, 92, 255, 0.28)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 12

    // Motion trail (subtle)
    if (speedPix > 5) {
      const len = Math.hypot(vx, vy) || 1
      const tail = Math.min(20, (len * 0.02))
      const offX = -vx / len * tail
      const offY = -vy / len * tail
      ctx.save()
      ctx.globalAlpha = alpha * 0.18
      ctx.translate(offX, offY)
      // Trail uses slightly more squash
      ctx.scale(1 + s * 0.8, 1 - s * 0.8)
      // draw trail body (background only)
      const rTrail = 12
      drawRounded(ctx, -w / 2, -h / 2, w, h, rTrail)
      const gradT = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
      gradT.addColorStop(0, 'rgba(138,92,255,0.10)')
      gradT.addColorStop(1, 'rgba(138,92,255,0.04)')
      ctx.fillStyle = gradT
      ctx.fill()
      ctx.restore()
    }

        // Card background
        const r = 12
        drawRounded(ctx, -w / 2, -h / 2, w, h, r)
        const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
        grad.addColorStop(0, 'rgba(138,92,255,0.12)')
        grad.addColorStop(1, 'rgba(138,92,255,0.06)')
        ctx.fillStyle = grad
        ctx.strokeStyle = 'rgba(138,92,255,0.25)'
        ctx.lineWidth = 1
        ctx.fill()
        ctx.stroke()

        // Image layer
        ctx.shadowColor = 'transparent'
        if (card.loaded) {
          ctx.save()
          drawRounded(ctx, -w / 2, -h / 2, w, h, r)
          ctx.clip()
          ctx.drawImage(card.img, -w / 2, -h / 2, w, h)
          // darken a touch for better contrast with hero text
          const overlay = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
          overlay.addColorStop(0, 'rgba(11,15,20,0.28)')
          overlay.addColorStop(1, 'rgba(11,15,20,0.52)')
          ctx.fillStyle = overlay
          drawRounded(ctx, -w / 2, -h / 2, w, h, r)
          ctx.fill()
          ctx.restore()
        }

        // Minimal meta text (very subtle)
        ctx.fillStyle = 'rgba(232,233,237,0.6)'
        ctx.font = '600 11px "BR Shape", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(card.game.name, 0, h * 0.02)

        ctx.restore()

        // expose for hit-testing
        card.x = x
        card.y = y
        card.w = w
        card.h = h
        card.prevX = x
        card.prevY = y
        card.lastAngle = card.angle
      }

      // apply vignette last
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.restore()

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    // Interaction helpers
    const canvasPoint = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
    }

    const hitTest = (px: number, py: number): OrbitCard | null => {
      // Check higher depth first, then by proximity
      const cards = [...cardsRef.current].sort((a, b) => b.depth - a.depth)
      for (const c of cards) {
        if (!c.w || !c.h || c.x === undefined || c.y === undefined) continue
        const halfW = c.w / 2
        const halfH = c.h / 2
        if (px >= c.x - halfW && px <= c.x + halfW && py >= c.y - halfH && py <= c.y + halfH) {
          return c
        }
      }
      return null
    }

    const clearTextSelection = () => {
      const sel = (window.getSelection && window.getSelection()) || null
      if (sel && sel.removeAllRanges) sel.removeAllRanges()
    }

    const disableUserSelect = () => {
      document.documentElement.style.setProperty('user-select', 'none')
      document.documentElement.style.setProperty('-webkit-user-select', 'none')
      document.body.style.setProperty('user-select', 'none')
      document.body.style.setProperty('-webkit-user-select', 'none')
    }

    const enableUserSelect = () => {
      document.documentElement.style.removeProperty('user-select')
      document.documentElement.style.removeProperty('-webkit-user-select')
      document.body.style.removeProperty('user-select')
      document.body.style.removeProperty('-webkit-user-select')
    }

    const onPointerMove = (e: PointerEvent) => {
      if (draggingIdRef.current != null) e.preventDefault()
      const p = canvasPoint(e)
      pointerPosRef.current = p
      if (draggingIdRef.current != null) {
        // while dragging, update velocity ref
        const { x: cx, y: cy } = center()
        const ang = Math.atan2(p.y - dragOffsetRef.current.y - cy, p.x - dragOffsetRef.current.x - cx)
        lastMoveRef.current = { t: performance.now(), angle: ang }
        canvas.style.cursor = 'grabbing'
        clearTextSelection()
        return
      }
      const card = hitTest(p.x, p.y)
      hoveredIdRef.current = card ? card.id : null
      canvas.style.cursor = card ? 'grab' : 'default'
    }

    // We no longer lock body scroll to avoid hiding the scrollbar; instead rely on
    // touch-action: none on canvas and preventing default on touch/pointer move.
    const lockScroll = () => {}
    const unlockScroll = () => {}

    const onPointerDown = (e: PointerEvent) => {
      // Ignore clicks on interactive UI elements
      const target = e.target as Element | null
      if (target && target.closest('a,button,input,textarea,select,summary,[role="button"],.no-drag')) return
      const p = canvasPoint(e)
      const card = hitTest(p.x, p.y)
      if (!card) return
      // prevent text selection beginning and disable while dragging
      e.preventDefault()
      disableUserSelect()
      // no body scroll lock to keep scrollbar visible
      if (touchPrimedRef.current) touchPrimedRef.current = false
      draggingIdRef.current = card.id
      hoveredIdRef.current = card.id
      dragOffsetRef.current = { x: p.x - (card.x || 0), y: p.y - (card.y || 0) }
      lastMoveRef.current = { t: performance.now(), angle: Math.atan2((card.y || 0) - canvas.clientHeight / 2, (card.x || 0) - canvas.clientWidth / 2) }
      canvas.style.cursor = 'grabbing'
    }

    const onPointerUp = (e: PointerEvent) => {
      if (draggingIdRef.current == null) return
      const card = cardsRef.current.find(c => c.id === draggingIdRef.current)
      draggingIdRef.current = null
      canvas.style.cursor = 'default'
  enableUserSelect()
      if (!card) return
      // compute angular velocity from last movement to set smooth orbit
      const { x: cx, y: cy } = center()
      const nowT = performance.now()
      const last = lastMoveRef.current
      if (card.x == null || card.y == null) return
      const currAngle = Math.atan2(card.y - cy, card.x - cx)
      if (last) {
        let dA = currAngle - last.angle
        // normalize to [-pi, pi]
        while (dA > Math.PI) dA -= 2 * Math.PI
        while (dA < -Math.PI) dA += 2 * Math.PI
        const dt = Math.max(0.016, (nowT - last.t) / 1000)
        const angVel = dA / dt // rad/s
        // clamp to pleasant range
        const clamped = Math.max(-0.02, Math.min(0.02, angVel))
        card.speed = clamped
      }
      // small pop on release
      card.scaleBoost = Math.max(card.scaleBoost || 0, 0.18)
    }

    const onSelectStart = (e: Event) => {
      if (draggingIdRef.current != null) e.preventDefault()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerdown', onPointerDown, { passive: false })
    window.addEventListener('pointerup', onPointerUp, { passive: false })
    // Extra guards for mobile Safari to prevent page scroll during drag
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches && e.touches[0]
      if (!touch) return
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const card = hitTest(x, y)
      if (card) {
        // Preempt scroll before pointerdown fires
        e.preventDefault()
        disableUserSelect()
        lockScroll()
        touchPrimedRef.current = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (draggingIdRef.current != null) e.preventDefault()
    }
    const onGestureStart = (e: Event) => {
      if (draggingIdRef.current != null) e.preventDefault()
    }
    const onPointerCancel = (e: PointerEvent) => {
      if (draggingIdRef.current == null) return
      draggingIdRef.current = null
      enableUserSelect()
      canvas.style.cursor = 'default'
    }
    const onTouchEnd = () => {
      // Failsafe: always release locks after touch ends
      if (draggingIdRef.current != null) draggingIdRef.current = null
      touchPrimedRef.current = false
      enableUserSelect()
      canvas.style.cursor = 'default'
    }
    const onTouchCancel = onTouchEnd
  window.addEventListener('touchstart', onTouchStart, { passive: false })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: false })
    window.addEventListener('touchcancel', onTouchCancel as any, { passive: false } as any)
    window.addEventListener('gesturestart', onGestureStart as any, { passive: false } as any)
    window.addEventListener('pointercancel', onPointerCancel, { passive: false })
    window.addEventListener('selectstart', onSelectStart)

    return () => {
      window.removeEventListener('resize', resize)
      prefersReduced.removeEventListener('change', onPref)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('selectstart', onSelectStart)
      window.removeEventListener('touchstart', onTouchStart as any)
  window.removeEventListener('touchmove', onTouchMove as any)
  window.removeEventListener('touchend', onTouchEnd as any)
  window.removeEventListener('touchcancel', onTouchCancel as any)
      window.removeEventListener('gesturestart', onGestureStart as any)
      window.removeEventListener('pointercancel', onPointerCancel)
      enableUserSelect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 touch-none"
      style={{ opacity: 0.68, touchAction: 'none', overscrollBehavior: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    />
  )
}
