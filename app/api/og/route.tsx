import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

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
  { id: 346110, name: 'Ark', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/346110/header.jpg' },
]

// Create orbital positions for games
const createOrbitalPositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    positions.push({ x, y, angle })
  }
  return positions
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'IdleMates — The Cloud Buddy for Steam'
  const subtitle = searchParams.get('subtitle') || 'Your games never sleep. We grind while you shine.'

  // Create orbital positions for the games
  const centerX = 600
  const centerY = 315
  const innerRadius = 180
  const outerRadius = 280

  const innerPositions = createOrbitalPositions(6, centerX, centerY, innerRadius)
  const outerPositions = createOrbitalPositions(6, centerX, centerY, outerRadius)
  const allPositions = [...innerPositions, ...outerPositions]

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background stars */}
                {/* Simple starfield */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            opacity: 0.3,
          }}
        />

        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
            borderRadius: '50%',
            left: centerX - 300,
            top: centerY - 300,
          }}
        />

        {/* Game orbital rings */}
        <div
          style={{
            position: 'absolute',
            width: innerRadius * 2,
            height: innerRadius * 2,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '50%',
            left: centerX - innerRadius,
            top: centerY - innerRadius,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: outerRadius * 2,
            height: outerRadius * 2,
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '50%',
            left: centerX - outerRadius,
            top: centerY - outerRadius,
          }}
        />

        {/* Game icons positioned in galaxy */}
        {allPositions.slice(0, GAMES.length).map((pos, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: pos.x - 25,
              top: pos.y - 15,
              width: '50px',
              height: '30px',
              borderRadius: '8px',
              background: `url(${GAMES[index].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          />
        ))}

        {/* Central logo/icon */}
        <div
          style={{
            position: 'absolute',
            left: centerX - 40,
            top: centerY - 40,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)',
            border: '3px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Steam-like icon */}
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🎮
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%',
            paddingBottom: '60px',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              marginBottom: '16px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: '20px',
              color: '#cbd5e1',
              margin: 0,
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, rgba(15, 15, 15, 0.8))',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}