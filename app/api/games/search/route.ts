import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STEAM_API_KEY = process.env.STEAM_API_KEY

interface SteamStoreItem {
  id: number
  name: string
  tiny_image?: string
  type: string
  is_free: boolean
  released?: string
}

interface SteamStoreSearchResponse {
  total: number
  items: SteamStoreItem[]
}

// Common app IDs for popular games that might not show up in search
const POPULAR_GAMES: Record<string, number> = {
  'rocket league': 252950,
  'cs2': 730,
  'counter-strike 2': 730,
  'csgo': 730,
  'dota 2': 570,
  'team fortress 2': 440,
  'tf2': 440,
  'pubg': 578080,
  'rust': 252490,
  'apex': 1172470,
  'apex legends': 1172470
}

// GET /api/games/search?q=rocket%20league
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  if (!q) return NextResponse.json({ results: [] })

  try {
    // Check for known game ID first
    if (POPULAR_GAMES[q]) {
      const appId = POPULAR_GAMES[q]
      try {
        // Get game details from Steam Store API
        const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&key=${STEAM_API_KEY}`
        const storeRes = await fetch(storeUrl, { next: { revalidate: 3600 } })
        const storeData = await storeRes.json()
        
        if (storeData[appId]?.success) {
          const gameData = storeData[appId].data
          return NextResponse.json({
            results: [{
              appId,
              name: gameData.name,
              image: gameData.header_image,
              type: gameData.type,
              isFree: gameData.is_free,
              shortDescription: gameData.short_description
            }]
          })
        }
      } catch (e) {
        console.error('Steam Store API error:', e)
      }
    }

    // Try Steam Store search first
    try {
      const storeSearchUrl = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(q)}&l=en&cc=US`
      const storeRes = await fetch(storeSearchUrl, { next: { revalidate: 300 } })
      
      if (storeRes.ok) {
        const storeData = await storeRes.json() as SteamStoreSearchResponse
        if (storeData.total > 0) {
          const results = storeData.items.slice(0, 20).map((item: SteamStoreItem) => ({
            appId: item.id,
            name: item.name,
            image: item.tiny_image,
            type: item.type,
            isFree: item.is_free,
            released: item.released
          }))
          return NextResponse.json({ results })
        }
      }
    } catch (error) {
      console.error('Steam Store search failed:', error)
      // Continue to fallback search
    }

    // Fallback to community search if store search fails
    const communityUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(q)}`
    const res = await fetch(communityUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IdleMatesBot/1.0)'
      },
      next: { revalidate: 60 }
    })
    
    if (!res.ok) {
      throw new Error(`Steam search failed: ${res.status}`)
    }

    const data = (await res.json()) as Array<{ appid: number; name: string; icon?: string }>
    const results = data.slice(0, 20).map(item => ({
      appId: item.appid,
      name: item.name,
      image: item.icon 
        ? `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${item.appid}/${item.icon}.jpg` 
        : undefined
    }))
    
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Search failed', results: [] }, { status: 500 })
  }
}
