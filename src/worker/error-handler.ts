import { log } from '@/lib/logger'
import { setTimeout } from 'timers/promises'

export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message)
    this.name = 'RetryableError'
  }
}

export class PermanentError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message)
    this.name = 'PermanentError'
  }
}

export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000,    // 10 seconds
  backoffFactor: 2
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = 'operation'
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on permanent errors
      if (error instanceof PermanentError) {
        log.error(`[${context}] Permanent error:`, { 
          error: error.message,
          name: error.name,
          stack: error.stack,
          originalError: error.originalError
        })
        throw error
      }

      const shouldRetry = attempt < finalConfig.maxRetries &&
        (error instanceof RetryableError || 
         error.code === 'P2002' || // Unique constraint violation
         error.code === 'P2025' || // Record not found
         error.code === 'P2003' || // Foreign key constraint
         error.code?.includes('CONNECTION_ERROR'))

      if (!shouldRetry) {
        log.error(`[${context}] Max retries reached or non-retryable error:`, error)
        throw error
      }

      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      )

      log.warn(`[${context}] Attempt ${attempt}/${finalConfig.maxRetries} failed, retrying in ${delay}ms:`, error)
      await setTimeout(delay)
    }
  }

  throw lastError || new Error('Max retries reached')
}