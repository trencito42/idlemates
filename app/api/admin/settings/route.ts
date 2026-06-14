import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'system:settings'

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  allowNewRegistrations: true,
  maxConcurrentUsers: 1000,
  proxyHealthCheckInterval: 30,
  sessionHealthCheckInterval: 60,
  defaultRateLimitMinutes: 30,
  // Public announcement banner
  announcementEnabled: false,
  announcementType: 'info', // info | success | warning | danger
  announcementMessage: '',
  announcementLinkLabel: '',
  announcementLinkUrl: ''
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redis = getRedis()
    const raw = await redis.get(SETTINGS_KEY)
    const stored = raw ? JSON.parse(raw) : {}
    const merged = { ...DEFAULT_SETTINGS, ...stored }
    return NextResponse.json({ settings: merged })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json({ 
      settings: DEFAULT_SETTINGS 
    })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await req.json()
    
    // Validate settings
    if (typeof settings.maintenanceMode !== 'boolean' ||
        typeof settings.allowNewRegistrations !== 'boolean' ||
        typeof settings.maxConcurrentUsers !== 'number' ||
        typeof settings.proxyHealthCheckInterval !== 'number' ||
        typeof settings.sessionHealthCheckInterval !== 'number' ||
        typeof settings.defaultRateLimitMinutes !== 'number' ||
        typeof settings.announcementEnabled !== 'boolean' ||
        typeof settings.announcementType !== 'string' ||
        typeof settings.announcementMessage !== 'string' ||
        typeof settings.announcementLinkLabel !== 'string' ||
        typeof settings.announcementLinkUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
    }

    const redis = getRedis()
    await redis.set(SETTINGS_KEY, JSON.stringify(settings))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save settings error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save settings' 
    }, { status: 500 })
  }
}
