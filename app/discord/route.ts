import { NextResponse } from 'next/server'

export async function GET() {
  // Permanent redirect to Discord invite
  return NextResponse.redirect('https://discord.gg/sZM8U5XAhN', { status: 308 })
}
