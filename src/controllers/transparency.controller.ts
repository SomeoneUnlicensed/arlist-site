import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

const ENTRY_TYPES = ['INCIDENT', 'ADVISORY']
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']

const cleanServices = (value: unknown) => Array.isArray(value)
  ? value.map(String).map((item) => item.trim()).filter(Boolean)
  : []

const optionalDate = (value: unknown) => value ? new Date(String(value)) : null

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
    if (!ENTRY_TYPES.includes(type) || !SEVERITIES.includes(severity) || !title?.trim() || !summary?.trim()) {
      return res.status(400).json({ error: 'Укажите тип, серьёзность, заголовок и описание' })
    }
    if (type === 'INCIDENT' && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Для инцидента укажите статус' })
    }
    const entry = await prisma.transparencyEntry.create({
      data: {
        type,
        title: title.trim(),
        summary: summary.trim(),
        severity,
        status: type === 'INCIDENT' ? status : null,
        affectedServices: cleanServices(affectedServices),
        impact: impact?.trim() || null,
        response: response?.trim() || null,
        recommendation: recommendation?.trim() || null,
        publishedAt: optionalDate(publishedAt) ?? new Date(),
        resolvedAt: optionalDate(resolvedAt),
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
    if (body.type !== undefined && !ENTRY_TYPES.includes(body.type)) return res.status(400).json({ error: 'Неверный тип' })
    if (body.severity !== undefined && !SEVERITIES.includes(body.severity)) return res.status(400).json({ error: 'Неверная серьёзность' })
    if (body.status !== undefined && body.status !== null && !STATUSES.includes(body.status)) return res.status(400).json({ error: 'Неверный статус' })
    const entry = await prisma.transparencyEntry.update({
      where: { id },
      data: {
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.summary !== undefined ? { summary: String(body.summary).trim() } : {}),
        ...(body.severity !== undefined ? { severity: body.severity } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.affectedServices !== undefined ? { affectedServices: cleanServices(body.affectedServices) } : {}),
        ...(body.impact !== undefined ? { impact: body.impact?.trim() || null } : {}),
        ...(body.response !== undefined ? { response: body.response?.trim() || null } : {}),
        ...(body.recommendation !== undefined ? { recommendation: body.recommendation?.trim() || null } : {}),
        ...(body.publishedAt !== undefined ? { publishedAt: optionalDate(body.publishedAt) ?? new Date() } : {}),
        ...(body.resolvedAt !== undefined ? { resolvedAt: optionalDate(body.resolvedAt) } : {}),
        ...(body.isPublished !== undefined ? { isPublished: Boolean(body.isPublished) } : {}),
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
