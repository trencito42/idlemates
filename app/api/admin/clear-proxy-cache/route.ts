import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProxyManager } from '@/lib/proxy-manager'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proxyManager = ProxyManager.getInstance()

    // Reload from configured source (file/url/env) and clear rate limits
    proxyManager.reload()
    const stats = proxyManager.getStats()

    return NextResponse.json({ 
      success: true,
      message: 'Proxy cache cleared and reloaded from source.',
      stats
    })
  } catch (error: any) {
    console.error('Clear proxy cache error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to clear proxy cache' 
    }, { status: 500 })
  }
}
