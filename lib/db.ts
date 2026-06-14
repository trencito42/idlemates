import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error', 'warn'],
    // Add retries and connection timeouts
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Retry failed queries
    errorFormat: 'minimal'
  })

  // Add middleware for connection handling
  client.$use(async (params, next) => {
    try {
      const result = await next(params)
      return result
    } catch (error: any) {
      // Handle common database errors
      if (error.code === 'P2002') {
        throw new Error('Unique constraint violation')
      }
      if (error.code === 'P2025') {
        throw new Error('Record not found')
      }
      if (error.code === 'P2003') {
        throw new Error('Foreign key constraint failed')
      }
      throw error
    }
  })

  return client
}

export const prisma = global.prisma || createPrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
