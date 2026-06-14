import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { envelopeDecryptDataKey, encryptWithDataKey } from '@/lib/crypto'
import { enqueueJob } from '@/lib/queue'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1),
  sharedSecret: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { username, password, sharedSecret } = parsed.data
    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dataKeyEnc: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Encrypt credentials
    const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
    const usernameEnc = encryptWithDataKey(dataKey, username)
    const passwordEnc = encryptWithDataKey(dataKey, password)
    const sharedSecretEnc = sharedSecret ? encryptWithDataKey(dataKey, sharedSecret) : null

    // Check if account already exists for this user
    // We should probably allow multiple accounts but maybe limit by plan
    // For now, just create it
    const steamAccount = await prisma.steamAccount.create({
      data: {
        userId,
        usernameEnc,
        passwordEnc,
        sharedSecretEnc,
        status: 'connecting'
      }
    })

    // Enqueue job to verify the account
    try {
      await enqueueJob('start', { 
        userId, 
        steamAccountId: steamAccount.id 
      })
    } catch (e) {
      console.error('Failed to enqueue start job during connection:', e)
    }

    return NextResponse.json({ ok: true, id: steamAccount.id })
  } catch (error) {
    console.error('Error connecting steam account:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
