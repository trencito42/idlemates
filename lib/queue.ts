import { Queue, Worker, type JobsOptions } from 'bullmq'
import { getRedis } from './redis'

export const QUEUE_SESSION = 'session'
export const QUEUE_HEALTH = 'health'

const connection = getRedis()

export const sessionQueue = new Queue(QUEUE_SESSION, { connection })
export const healthQueue = new Queue(QUEUE_HEALTH, { connection })
// BullMQ v5 no longer requires explicit QueueScheduler instances

export type SessionJob = {
  userId: string
  steamAccountId: string
  action: 'start' | 'stop' | 'refresh' | 'reload_settings'
  totpCode?: string
}

export const defaultJobOpts: JobsOptions = { attempts: 5, backoff: { type: 'exponential', delay: 1000 } }

// Helper to enqueue jobs
export async function enqueueJob(action: SessionJob['action'], data: Omit<SessionJob, 'action'>) {
  return sessionQueue.add(action, { ...data, action }, defaultJobOpts)
}
