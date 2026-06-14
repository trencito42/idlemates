import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const imageUrl = searchParams.get('url')
    const width = parseInt(searchParams.get('w') || '460')
    const height = parseInt(searchParams.get('h') || '215')
    const quality = parseInt(searchParams.get('q') || '80')
    const format = searchParams.get('f') || 'webp'

    if (!imageUrl || !imageUrl.includes('steamstatic.com')) {
      return new NextResponse('Invalid image URL', { status: 400 })
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 404 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Set appropriate headers for caching
    const headers = {
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Length': imageBuffer.byteLength.toString(),
    }

    // For now, return the original image (you can add Sharp.js processing here later)
    return new NextResponse(imageBuffer, { headers })

  } catch (error) {
    console.error('Steam image optimization error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'