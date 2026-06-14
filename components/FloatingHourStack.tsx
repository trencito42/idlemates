'use client'

import { useEffect, useRef } from 'react'

type FloatingHour = {
  x: number
  y: number
  z: number
  value: number
  speedX: number
  speedY: number
  speedZ: number
  rotation: number
  rotationSpeed: number
  opacity: number
  size: number
  type: 'hour' | 'progress' | 'counter'
  progress: number
  color: string
}

export default function FloatingHourStack() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoursRef = useRef<FloatingHour[]>([])
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

    // Color variations for different hour elements
    const colors = [
      '#8a5cff', // Primary purple
      '#22c55e', // Success green
      '#06b6d4', // Cyan
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#10b981', // Emerald
    ]

    // Initialize floating hour elements
    const hours: FloatingHour[] = []
    for (let i = 0; i < 15; i++) {
      // Favor hour counters more than progress bars for this section
      const type = Math.random() < 0.7 ? 'hour' : (Math.random() < 0.5 ? 'progress' : 'counter') as 'hour' | 'progress' | 'counter'
      
      const hour: FloatingHour = {
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        z: 50 + Math.random() * 100, // Depth for 3D effect
        value: Math.floor(Math.random() * 500) + 50, // 50-550 hours (more realistic ranges)
        speedX: (Math.random() - 0.5) * 25,
        speedY: (Math.random() - 0.5) * 25,
        speedZ: (Math.random() - 0.5) * 15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        opacity: 0.5 + Math.random() * 0.3,
        size: 70 + Math.random() * 30,
        type,
        progress: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      }
      
      hours.push(hour)
    }
    hoursRef.current = hours

    let last = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(32, now - last) / 1000
      last = now
      
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      
      // Sort by z-depth for proper layering
      const sortedHours = [...hoursRef.current].sort((a, b) => b.z - a.z)
      
      for (const hour of sortedHours) {
        // Update position and properties
        hour.x += hour.speedX * dt
        hour.y += hour.speedY * dt
        hour.z += hour.speedZ * dt
        hour.rotation += hour.rotationSpeed * dt
        
        // Slowly increment hour values to show accumulation
        if (Math.random() < 0.003) {
          hour.value = Math.min(999, hour.value + 1)
        }
        
        // Update progress bars
        if (hour.type === 'progress') {
          hour.progress += dt * 10
          if (hour.progress > 100) hour.progress = 0
        }
        
        // Wrap around edges with padding
        const padding = hour.size
        if (hour.x < -padding) hour.x = canvas.clientWidth + padding
        if (hour.x > canvas.clientWidth + padding) hour.x = -padding
        if (hour.y < -padding) hour.y = canvas.clientHeight + padding
        if (hour.y > canvas.clientHeight + padding) hour.y = -padding
        
        // Z-depth cycling
        if (hour.z < 30) hour.z = 150
        if (hour.z > 150) hour.z = 30
        
        // Calculate 3D perspective scale
        const scale = hour.z / 150
        const actualSize = hour.size * scale
        
        ctx.save()
        ctx.translate(hour.x, hour.y)
        ctx.rotate(hour.rotation)
        ctx.scale(scale, scale)
        ctx.globalAlpha = hour.opacity * scale * 0.8
        
        const halfSize = actualSize / 2 / scale
        
        // Draw shadow
        ctx.save()
        ctx.translate(3, 3)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        if (hour.type === 'progress') {
          roundRect(ctx, -halfSize * 1.2, -halfSize * 0.3, halfSize * 2.4, halfSize * 0.6, 6)
        } else {
          roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
        }
        ctx.fill()
        ctx.restore()
        
        if (hour.type === 'hour' || hour.type === 'counter') {
          // Hour counter card
          ctx.fillStyle = `${hour.color}20`
          ctx.strokeStyle = `${hour.color}60`
          ctx.lineWidth = 1.5
          roundRect(ctx, -halfSize, -halfSize * 0.6, halfSize * 2, halfSize * 1.2, 8)
          ctx.fill()
          ctx.stroke()
          
          // Hour text
          ctx.fillStyle = hour.color
          ctx.font = `bold ${Math.max(12, halfSize * 0.4)}px -apple-system, BlinkMacSystemFont, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          if (hour.type === 'hour') {
            ctx.fillText(`${hour.value}h`, 0, -halfSize * 0.15)
            ctx.font = `${Math.max(8, halfSize * 0.25)}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillStyle = `${hour.color}AA`
            ctx.fillText('IDLE TIME', 0, halfSize * 0.25)
          } else {
            ctx.fillText(`+${hour.value}h`, 0, 0)
          }
          
        } else if (hour.type === 'progress') {
          // Progress bar
          const barWidth = halfSize * 2.4
          const barHeight = halfSize * 0.6
          
          // Background
          ctx.fillStyle = `${hour.color}30`
          ctx.strokeStyle = `${hour.color}60`
          ctx.lineWidth = 1
          roundRect(ctx, -barWidth/2, -barHeight/2, barWidth, barHeight, 6)
          ctx.fill()
          ctx.stroke()
          
          // Progress fill
          const fillWidth = (barWidth - 8) * (hour.progress / 100)
          if (fillWidth > 0) {
            ctx.fillStyle = hour.color
            roundRect(ctx, -barWidth/2 + 4, -barHeight/2 + 4, fillWidth, barHeight - 8, 3)
            ctx.fill()
          }
          
          // Progress text
          ctx.fillStyle = hour.color
          ctx.font = `bold ${Math.max(10, barHeight * 0.4)}px -apple-system, BlinkMacSystemFont, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${Math.floor(hour.progress)}%`, 0, 0)
        }
        
        // Subtle glow effect
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize * 1.5)
        glow.addColorStop(0, `${hour.color}20`)
        glow.addColorStop(1, `${hour.color}00`)
        ctx.fillStyle = glow
        ctx.fillRect(-halfSize * 1.5, -halfSize * 1.5, halfSize * 3, halfSize * 3)
        ctx.restore()
        
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