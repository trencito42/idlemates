import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchSteamProfile } from '@/lib/steam'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const steamIdsParam = searchParams.get('steamIds')
    
    if (!steamIdsParam) {
      return NextResponse.json({ profiles: {} })
    }

    const steamIds = steamIdsParam.split(',').filter(id => id.trim().length > 0)
    const profiles: Record<string, any> = {}

    // Fetch profiles in parallel
    await Promise.all(steamIds.map(async (id) => {
      try {
        const profile = await fetchSteamProfile(id)
        if (profile) {
          profiles[id] = profile
        }
      } catch (e) {
        console.error(`Failed to fetch profile for ${id}:`, e)
      }
    }))

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error in profiles API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
