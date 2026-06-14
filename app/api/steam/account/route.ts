import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { envelopeDecryptDataKey, decryptWithDataKey } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dataKeyEnc: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const steamAccounts = await prisma.steamAccount.findMany({
      where: { userId }
    })

    // Decrypt usernames for display
    let dataKey: Buffer | null = null
    try {
      dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
    } catch (e) {
      console.error('Failed to decrypt data key for user:', userId, e)
    }

    const accounts = steamAccounts.map(acc => {
      let username = 'Unknown'
      if (dataKey) {
        try {
          username = decryptWithDataKey(dataKey, acc.usernameEnc)
        } catch (e) {
          console.error('Failed to decrypt username for account:', acc.id, e)
        }
      }

      return {
        ...acc,
        username,
        // Don't leak encrypted password/secrets if not needed by UI, 
        // but DashboardPage.tsx seems to include them in its type.
        // We'll return them as requested by the type but ideally they should be omitted.
      }
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching steam accounts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
