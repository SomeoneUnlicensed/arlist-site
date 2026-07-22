import type { Prisma, SystemLogCategory, SystemLogLevel } from '@prisma/client'
import prisma from './prisma.service.js'

export type SystemLogInput = {
  level?: SystemLogLevel
  category?: SystemLogCategory
  event: string
  userId?: string | null
  subject?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  method?: string | null
  path?: string | null
  statusCode?: number | null
  durationMs?: number | null
  metadata?: Prisma.InputJsonValue
}

export async function writeSystemLog(input: SystemLogInput): Promise<void> {
  try {
    await prisma.systemLog.create({ data: input })
  } catch (error) {
    console.error('[system-log] Failed to persist event:', error)
  }
}

export async function pruneSystemLogs(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const result = await prisma.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  return result.count
}
