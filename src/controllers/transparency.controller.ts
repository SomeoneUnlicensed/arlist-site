import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

const ENTRY_TYPES = ['INCIDENT', 'ADVISORY']
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']

const cleanServices = (value: unknown) => Array.isArray(value)
  ? value.map(String).map((item) => item.trim()).filter(Boolean)
  : []

const optionalDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

const cleanOptionalText = (value: unknown) => {
  if (value === null || value === undefined) return null
  return String(value).trim() || null
}

export const getPublishedTransparencyEntries = async (_req: Request, res: Response) => {
  try {
    const entries = await prisma.transparencyEntry.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    })
    res.json(entries)
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить реестр прозрачности' })
  }
}

export const getTransparencyEntries = async (_req: Request, res: Response) => {
  try {
    const entries = await prisma.transparencyEntry.findMany({ orderBy: { publishedAt: 'desc' } })
    res.json(entries)
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить записи' })
  }
}

export const createTransparencyEntry = async (req: Request, res: Response) => {
  try {
    const { type, title, summary, severity, status, affectedServices, impact, response, recommendation, publishedAt, resolvedAt, isPublished } = req.body
    if (!ENTRY_TYPES.includes(type) || !SEVERITIES.includes(severity) || typeof title !== 'string' || typeof summary !== 'string' || !title.trim() || !summary.trim()) {
      return res.status(400).json({ error: 'Укажите тип, серьёзность, заголовок и описание' })
    }
    if (type === 'INCIDENT' && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Для инцидента укажите статус' })
    }
    if (affectedServices !== undefined && (!Array.isArray(affectedServices) || !affectedServices.every((service) => typeof service === 'string'))) {
      return res.status(400).json({ error: 'affectedServices должен быть массивом строк' })
    }
    if (isPublished !== undefined && typeof isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    const parsedPublishedAt = optionalDate(publishedAt)
    const parsedResolvedAt = optionalDate(resolvedAt)
    if (parsedPublishedAt === undefined || parsedResolvedAt === undefined) return res.status(400).json({ error: 'Неверный формат даты' })
    const entry = await prisma.transparencyEntry.create({
      data: {
        type,
        title: title.trim(),
        summary: summary.trim(),
        severity,
        status: type === 'INCIDENT' ? status : null,
        affectedServices: cleanServices(affectedServices),
        impact: cleanOptionalText(impact),
        response: cleanOptionalText(response),
        recommendation: cleanOptionalText(recommendation),
        publishedAt: parsedPublishedAt ?? new Date(),
        resolvedAt: parsedResolvedAt,
        isPublished: isPublished !== false,
      },
    })
    res.status(201).json(entry)
  } catch {
    res.status(500).json({ error: 'Не удалось создать запись' })
  }
}

export const updateTransparencyEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body
    const existing = await prisma.transparencyEntry.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Запись не найдена' })
    if (body.type !== undefined && !ENTRY_TYPES.includes(body.type)) return res.status(400).json({ error: 'Неверный тип' })
    if (body.severity !== undefined && !SEVERITIES.includes(body.severity)) return res.status(400).json({ error: 'Неверная серьёзность' })
    if (body.status !== undefined && body.status !== null && !STATUSES.includes(body.status)) return res.status(400).json({ error: 'Неверный статус' })
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return res.status(400).json({ error: 'Заголовок должен быть непустой строкой' })
    if (body.summary !== undefined && (typeof body.summary !== 'string' || !body.summary.trim())) return res.status(400).json({ error: 'Описание должно быть непустой строкой' })
    if (body.affectedServices !== undefined && (!Array.isArray(body.affectedServices) || !body.affectedServices.every((service: unknown) => typeof service === 'string'))) {
      return res.status(400).json({ error: 'affectedServices должен быть массивом строк' })
    }
    if (body.isPublished !== undefined && typeof body.isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    const finalType = body.type ?? existing.type
    const finalStatus = body.status !== undefined ? body.status : existing.status
    if (finalType === 'INCIDENT' && !STATUSES.includes(finalStatus)) return res.status(400).json({ error: 'Для инцидента укажите статус' })
    const parsedPublishedAt = body.publishedAt !== undefined ? optionalDate(body.publishedAt) : null
    const parsedResolvedAt = body.resolvedAt !== undefined ? optionalDate(body.resolvedAt) : null
    if (parsedPublishedAt === undefined || parsedResolvedAt === undefined) return res.status(400).json({ error: 'Неверный формат даты' })
    const entry = await prisma.transparencyEntry.update({
      where: { id },
      data: {
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.summary !== undefined ? { summary: String(body.summary).trim() } : {}),
        ...(body.severity !== undefined ? { severity: body.severity } : {}),
        ...(body.type === 'ADVISORY' ? { status: null } : body.status !== undefined ? { status: body.status } : {}),
        ...(body.affectedServices !== undefined ? { affectedServices: cleanServices(body.affectedServices) } : {}),
        ...(body.impact !== undefined ? { impact: cleanOptionalText(body.impact) } : {}),
        ...(body.response !== undefined ? { response: cleanOptionalText(body.response) } : {}),
        ...(body.recommendation !== undefined ? { recommendation: cleanOptionalText(body.recommendation) } : {}),
        ...(body.publishedAt !== undefined ? { publishedAt: parsedPublishedAt! } : {}),
        ...(body.resolvedAt !== undefined ? { resolvedAt: parsedResolvedAt } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
      },
    })
    res.json(entry)
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Запись не найдена' })
    res.status(500).json({ error: 'Не удалось обновить запись' })
  }
}

export const deleteTransparencyEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.transparencyEntry.delete({ where: { id } })
    res.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Запись не найдена' })
    res.status(500).json({ error: 'Не удалось удалить запись' })
  }
}
