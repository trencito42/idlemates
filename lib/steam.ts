import { z } from 'zod'

const STEAM_API_KEY = process.env.STEAM_API_KEY

if (!STEAM_API_KEY) {
  console.warn('STEAM_API_KEY not found in environment variables')
}

export interface SteamGameDetails {
  appid: number
  name: string
  icon?: string
  header_image?: string
  type?: string
  is_free?: boolean
  short_description?: string
  developers?: string[]
  publishers?: string[]
  categories?: Array<{ id: number, description: string }>
  genres?: Array<{ id: string, description: string }>
}

export const steamGameSchema = z.object({
  appid: z.number(),
  name: z.string(),
  icon: z.string().optional(),
  header_image: z.string().optional(),
  type: z.string().optional(),
  is_free: z.boolean().optional(),
  short_description: z.string().optional(),
  developers: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  categories: z.array(z.object({
    id: z.number(),
    description: z.string()
  })).optional(),
  genres: z.array(z.object({
    id: z.string(),
    description: z.string()
  })).optional()
})

const gameCache = new Map<number, SteamGameDetails>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function fetchSteamGameDetails(appId: number): Promise<SteamGameDetails | null> {
  try {
    // Check cache first
    const cached = gameCache.get(appId)
    if (cached) {
      return cached
    }

    // Try official Steam API first
    if (STEAM_API_KEY) {
      try {
        const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&key=${STEAM_API_KEY}`
        const response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'IdleMatesBot/1.0' },
          cache: 'no-store'
        })

        if (response.ok) {
          const data = await response.json()
          if (data[appId]?.success && data[appId]?.data) {
            const gameData = data[appId].data
            
            // Steam CDN icon URL - this is more reliable
            const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
            
            const details = {
              appid: appId,
              name: gameData.name,
              icon: iconUrl,
              header_image: gameData.header_image || iconUrl,
              type: gameData.type,
              is_free: gameData.is_free,
              short_description: gameData.short_description,
              developers: gameData.developers,
              publishers: gameData.publishers,
              categories: gameData.categories,
              genres: gameData.genres
            }

            // Validate and cache the data
            const parsed = steamGameSchema.safeParse(details)
            if (parsed.success) {
              gameCache.set(appId, parsed.data)
              return parsed.data
            }
          }
        }
      } catch (err) {
        console.error('Steam API error:', err)
      }
    }

    // Fallback to direct Store API call
    try {
      const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
      const storeRes = await fetch(storeUrl, {
        headers: { 'User-Agent': 'IdleMatesBot/1.0' },
        cache: 'no-store'
      })
      
      if (storeRes.ok) {
        const data = await storeRes.json()
        if (data[appId]?.success && data[appId]?.data) {
          const gameData = data[appId].data
          
          // Steam CDN icon URL - this is more reliable than header_image
          const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
          
          const details = {
            appid: appId,
            name: gameData.name,
            icon: iconUrl,
            header_image: gameData.header_image || iconUrl,
            type: gameData.type,
            is_free: gameData.is_free,
            short_description: gameData.short_description,
            developers: gameData.developers,
            publishers: gameData.publishers,
            categories: gameData.categories,
            genres: gameData.genres
          }

          const parsed = steamGameSchema.safeParse(details)
          if (parsed.success) {
            gameCache.set(appId, parsed.data)
            return parsed.data
          }
        }
      }
    } catch (err) {
      console.error('Store API fallback failed:', err)
    }

    return null
  } catch (e) {
    console.error('Failed to fetch Steam game details:', e)
    return null
  }
}

export interface SteamProfile {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
}

const profileCache = new Map<string, { profile: SteamProfile, timestamp: number }>()

export async function fetchSteamProfile(steamId: string): Promise<SteamProfile | null> {
  try {
    // Check cache first (cache for 1 hour)
    const cached = profileCache.get(steamId)
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
      return cached.profile
    }

    if (!STEAM_API_KEY) {
      console.warn('Cannot fetch Steam profile: STEAM_API_KEY not configured')
      return null
    }

    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
    const res = await fetch(url, { 
      cache: 'no-store',
      next: { revalidate: 3600 } // Revalidate after 1 hour
    })

    if (!res.ok) {
      console.error('Steam API error:', res.status)
      return null
    }

    const data = await res.json()
    const player = data?.response?.players?.[0]

    if (!player) {
      console.warn('Steam profile not found:', steamId)
      return null
    }

    const profile: SteamProfile = {
      steamid: player.steamid,
      personaname: player.personaname,
      profileurl: player.profileurl,
      avatar: player.avatar,
      avatarmedium: player.avatarmedium,
      avatarfull: player.avatarfull
    }

    // Cache the profile
    profileCache.set(steamId, { profile, timestamp: Date.now() })

    return profile
  } catch (e) {
    console.error('Failed to fetch Steam profile:', e)
    return null
  }
}