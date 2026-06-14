import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  maintenanceMode: false,
  allowNewRegistrations: true,
  announcementEnabled: false,
  announcementType: 'info',
  announcementMessage: '',
  announcementLinkLabel: '',
  announcementLinkUrl: ''
}

export async function GET() {
  try {
    const redis = getRedis()
    const raw = await redis.get('system:settings')
    const stored = raw ? JSON.parse(raw) : {}
    const merged = { ...DEFAULTS, ...stored }
    // Public subset only
    return NextResponse.json({
      settings: {
        maintenanceMode: !!merged.maintenanceMode,
        allowNewRegistrations: !!merged.allowNewRegistrations,
        announcementEnabled: !!merged.announcementEnabled,
        announcementType: merged.announcementType,
        announcementMessage: merged.announcementMessage,
        announcementLinkLabel: merged.announcementLinkLabel,
        announcementLinkUrl: merged.announcementLinkUrl,
      }
    })
  } catch (e) {
    return NextResponse.json({ settings: DEFAULTS })
  }
}
