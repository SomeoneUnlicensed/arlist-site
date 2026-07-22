import type { Request, Response } from 'express'
import type { ComponentStatus, IncidentImpact, MaintenanceState } from '@prisma/client'
import prisma from '../services/prisma.service.js'

const COMPONENT_STATUSES = ['OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE'] as const
const INCIDENT_IMPACTS = ['MINOR', 'MAJOR', 'CRITICAL'] as const
const INCIDENT_STATES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'] as const
const MAINTENANCE_STATES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const incidentInclude = {
  components: { orderBy: { order: 'asc' as const } },
  updates: { orderBy: { createdAt: 'desc' as const } },
}

const maintenanceInclude = { components: { orderBy: { order: 'asc' as const } } }

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function uniqueStrings(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))]
}

function impactStatus(impact: IncidentImpact): ComponentStatus {
  if (impact === 'CRITICAL') return 'MAJOR_OUTAGE'
  if (impact === 'MAJOR') return 'PARTIAL_OUTAGE'
  return 'DEGRADED'
}

async function validateComponentIds(componentIds: string[]): Promise<boolean> {
  if (!componentIds.length) return false
  return prisma.statusComponent.count({ where: { id: { in: componentIds } } }).then((count) => count === componentIds.length)
}

async function recalculateComponents(tx: any, componentIds: string[]) {
  for (const componentId of [...new Set(componentIds)]) {
    const maintenance = await tx.scheduledMaintenance.findFirst({
      where: { isPublished: true, status: 'IN_PROGRESS', components: { some: { id: componentId } } },
      select: { id: true },
    })
    if (maintenance) {
      await tx.statusComponent.update({ where: { id: componentId }, data: { status: 'MAINTENANCE' } })
      continue
    }

    const incidents = await tx.statusIncident.findMany({
      where: { isPublished: true, status: { not: 'RESOLVED' }, components: { some: { id: componentId } } },
      select: { impact: true },
    })
    const incident = incidents.find((item: { impact: IncidentImpact }) => item.impact === 'CRITICAL')
      ?? incidents.find((item: { impact: IncidentImpact }) => item.impact === 'MAJOR')
      ?? incidents[0]
    await tx.statusComponent.update({
      where: { id: componentId },
      data: { status: incident ? impactStatus(incident.impact) : 'OPERATIONAL' },
    })
  }
}

export const getPublicStatus = async (_req: Request, res: Response) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const [components, activeIncidents, incidentHistory, maintenance] = await Promise.all([
      prisma.statusComponent.findMany({ where: { isVisible: true }, orderBy: [{ group: 'asc' }, { order: 'asc' }] }),
      prisma.statusIncident.findMany({ where: { isPublished: true, status: { not: 'RESOLVED' } }, include: incidentInclude, orderBy: { publishedAt: 'desc' } }),
      prisma.statusIncident.findMany({ where: { isPublished: true, status: 'RESOLVED', publishedAt: { gte: ninetyDaysAgo } }, include: incidentInclude, orderBy: { resolvedAt: 'desc' }, take: 50 }),
      prisma.scheduledMaintenance.findMany({ where: { isPublished: true, status: { not: 'CANCELLED' }, endsAt: { gte: ninetyDaysAgo } }, include: maintenanceInclude, orderBy: { startsAt: 'desc' }, take: 30 }),
    ])

    const timestamps = [
      ...components.map((item) => item.updatedAt),
      ...activeIncidents.map((item) => item.updatedAt),
      ...incidentHistory.map((item) => item.updatedAt),
      ...maintenance.map((item) => item.updatedAt),
    ]
    const updatedAt = timestamps.length ? new Date(Math.max(...timestamps.map((date) => date.getTime()))) : new Date()
    res.json({ components, activeIncidents, incidentHistory, maintenance, updatedAt })
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить статус сервисов' })
  }
}

export const getAdminStatus = async (_req: Request, res: Response) => {
  try {
    const [components, incidents, maintenance] = await Promise.all([
      prisma.statusComponent.findMany({ orderBy: [{ group: 'asc' }, { order: 'asc' }] }),
      prisma.statusIncident.findMany({ include: incidentInclude, orderBy: { publishedAt: 'desc' } }),
      prisma.scheduledMaintenance.findMany({ include: maintenanceInclude, orderBy: { startsAt: 'desc' } }),
    ])
    res.json({ components, incidents, maintenance })
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить управление статусом' })
  }
}

export const createStatusComponent = async (req: Request, res: Response) => {
  try {
    const { slug, name, description, group, order, status, isVisible } = req.body
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Укажите корректные slug и название' })
    if (status !== undefined && !COMPONENT_STATUSES.includes(status)) return res.status(400).json({ error: 'Неверный статус компонента' })
    if (isVisible !== undefined && typeof isVisible !== 'boolean') return res.status(400).json({ error: 'isVisible должен быть boolean' })
    if (order !== undefined && !Number.isSafeInteger(Number(order))) return res.status(400).json({ error: 'order должен быть целым числом' })
    const component = await prisma.statusComponent.create({ data: {
      slug, name: name.trim(), description: typeof description === 'string' ? description.trim() || null : null,
      group: typeof group === 'string' ? group.trim() || 'Сервисы' : 'Сервисы', order: Number(order ?? 0),
      status: status ?? 'OPERATIONAL', isVisible: isVisible ?? true,
    } })
    res.status(201).json(component)
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Такой slug уже существует' })
    res.status(500).json({ error: 'Не удалось создать компонент' })
  }
}

export const updateStatusComponent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body
    if (body.slug !== undefined && (typeof body.slug !== 'string' || !SLUG_PATTERN.test(body.slug))) return res.status(400).json({ error: 'Неверный slug' })
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) return res.status(400).json({ error: 'Название не может быть пустым' })
    if (body.status !== undefined && !COMPONENT_STATUSES.includes(body.status)) return res.status(400).json({ error: 'Неверный статус компонента' })
    if (body.isVisible !== undefined && typeof body.isVisible !== 'boolean') return res.status(400).json({ error: 'isVisible должен быть boolean' })
    if (body.order !== undefined && !Number.isSafeInteger(Number(body.order))) return res.status(400).json({ error: 'order должен быть целым числом' })
    const component = await prisma.statusComponent.update({ where: { id }, data: {
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: typeof body.description === 'string' ? body.description.trim() || null : null } : {}),
      ...(body.group !== undefined ? { group: typeof body.group === 'string' ? body.group.trim() || 'Сервисы' : 'Сервисы' } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.isVisible !== undefined ? { isVisible: body.isVisible } : {}),
    } })
    res.json(component)
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Компонент не найден' })
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Такой slug уже существует' })
    res.status(500).json({ error: 'Не удалось обновить компонент' })
  }
}

export const deleteStatusComponent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.statusComponent.delete({ where: { id } })
    res.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Компонент не найден' })
    res.status(500).json({ error: 'Не удалось удалить компонент' })
  }
}

export const createStatusIncident = async (req: Request, res: Response) => {
  try {
    const { title, summary, impact, componentIds: rawComponentIds, message, isPublished, publishedAt } = req.body
    const componentIds = uniqueStrings(rawComponentIds)
    const date = publishedAt === undefined ? new Date() : parseDate(publishedAt)
    if (typeof title !== 'string' || !title.trim() || typeof summary !== 'string' || !summary.trim()) return res.status(400).json({ error: 'Укажите заголовок и описание' })
    if (!INCIDENT_IMPACTS.includes(impact)) return res.status(400).json({ error: 'Неверное влияние инцидента' })
    if (!componentIds || !(await validateComponentIds(componentIds))) return res.status(400).json({ error: 'Выберите существующие компоненты' })
    if (isPublished !== undefined && typeof isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    if (!date) return res.status(400).json({ error: 'Неверная дата публикации' })
    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.statusIncident.create({ data: {
        title: title.trim(), summary: summary.trim(), impact, isPublished: isPublished ?? true, publishedAt: date,
        components: { connect: componentIds.map((id) => ({ id })) },
        updates: { create: { status: 'INVESTIGATING', message: typeof message === 'string' && message.trim() ? message.trim() : summary.trim() } },
      }, include: incidentInclude })
      await recalculateComponents(tx, componentIds)
      return created
    })
    res.status(201).json(incident)
  } catch {
    res.status(500).json({ error: 'Не удалось создать инцидент' })
  }
}

export const updateStatusIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const existing = await prisma.statusIncident.findUnique({ where: { id }, include: { components: { select: { id: true } } } })
    if (!existing) return res.status(404).json({ error: 'Инцидент не найден' })
    const body = req.body
    const componentIds = body.componentIds === undefined ? null : uniqueStrings(body.componentIds)
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return res.status(400).json({ error: 'Заголовок не может быть пустым' })
    if (body.summary !== undefined && (typeof body.summary !== 'string' || !body.summary.trim())) return res.status(400).json({ error: 'Описание не может быть пустым' })
    if (body.impact !== undefined && !INCIDENT_IMPACTS.includes(body.impact)) return res.status(400).json({ error: 'Неверное влияние' })
    if (body.isPublished !== undefined && typeof body.isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    if (componentIds && !(await validateComponentIds(componentIds))) return res.status(400).json({ error: 'Выберите существующие компоненты' })
    const affectedIds = [...new Set([...existing.components.map((item) => item.id), ...(componentIds ?? [])])]
    const incident = await prisma.$transaction(async (tx) => {
      const updated = await tx.statusIncident.update({ where: { id }, data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.summary !== undefined ? { summary: body.summary.trim() } : {}),
        ...(body.impact !== undefined ? { impact: body.impact } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(componentIds ? { components: { set: componentIds.map((componentId) => ({ id: componentId })) } } : {}),
      }, include: incidentInclude })
      await recalculateComponents(tx, affectedIds)
      return updated
    })
    res.json(incident)
  } catch {
    res.status(500).json({ error: 'Не удалось обновить инцидент' })
  }
}

export const addIncidentUpdate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const { status, message } = req.body
    if (!INCIDENT_STATES.includes(status) || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Укажите статус и текст обновления' })
    const existing = await prisma.statusIncident.findUnique({ where: { id }, include: { components: { select: { id: true } } } })
    if (!existing) return res.status(404).json({ error: 'Инцидент не найден' })
    const componentIds = existing.components.map((item) => item.id)
    const incident = await prisma.$transaction(async (tx) => {
      await tx.incidentUpdate.create({ data: { incidentId: id, status, message: message.trim() } })
      const updated = await tx.statusIncident.update({ where: { id }, data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null }, include: incidentInclude })
      await recalculateComponents(tx, componentIds)
      return updated
    })
    res.json(incident)
  } catch {
    res.status(500).json({ error: 'Не удалось добавить обновление' })
  }
}

export const deleteStatusIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const existing = await prisma.statusIncident.findUnique({ where: { id }, include: { components: { select: { id: true } } } })
    if (!existing) return res.status(404).json({ error: 'Инцидент не найден' })
    await prisma.$transaction(async (tx) => {
      await tx.statusIncident.delete({ where: { id } })
      await recalculateComponents(tx, existing.components.map((item) => item.id))
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Не удалось удалить инцидент' })
  }
}

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { title, description, startsAt, endsAt, componentIds: rawComponentIds, isPublished } = req.body
    const componentIds = uniqueStrings(rawComponentIds)
    const start = parseDate(startsAt)
    const end = parseDate(endsAt)
    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) return res.status(400).json({ error: 'Укажите название и описание работ' })
    if (!start || !end || end <= start) return res.status(400).json({ error: 'Проверьте время начала и окончания' })
    if (!componentIds || !(await validateComponentIds(componentIds))) return res.status(400).json({ error: 'Выберите существующие компоненты' })
    if (isPublished !== undefined && typeof isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    const maintenance = await prisma.scheduledMaintenance.create({ data: {
      title: title.trim(), description: description.trim(), startsAt: start, endsAt: end,
      isPublished: isPublished ?? true, components: { connect: componentIds.map((id) => ({ id })) },
    }, include: maintenanceInclude })
    res.status(201).json(maintenance)
  } catch {
    res.status(500).json({ error: 'Не удалось запланировать работы' })
  }
}

export const updateMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const existing = await prisma.scheduledMaintenance.findUnique({ where: { id }, include: { components: { select: { id: true } } } })
    if (!existing) return res.status(404).json({ error: 'Работы не найдены' })
    const body = req.body
    const componentIds = body.componentIds === undefined ? null : uniqueStrings(body.componentIds)
    const startsAt = body.startsAt === undefined ? existing.startsAt : parseDate(body.startsAt)
    const endsAt = body.endsAt === undefined ? existing.endsAt : parseDate(body.endsAt)
    if (!startsAt || !endsAt || endsAt <= startsAt) return res.status(400).json({ error: 'Проверьте время начала и окончания' })
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return res.status(400).json({ error: 'Укажите название работ' })
    if (body.description !== undefined && (typeof body.description !== 'string' || !body.description.trim())) return res.status(400).json({ error: 'Укажите описание работ' })
    if (body.status !== undefined && !MAINTENANCE_STATES.includes(body.status)) return res.status(400).json({ error: 'Неверный статус работ' })
    if (body.isPublished !== undefined && typeof body.isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished должен быть boolean' })
    if (componentIds && !(await validateComponentIds(componentIds))) return res.status(400).json({ error: 'Выберите существующие компоненты' })
    const affectedIds = [...new Set([...existing.components.map((item) => item.id), ...(componentIds ?? [])])]
    const maintenance = await prisma.$transaction(async (tx) => {
      const updated = await tx.scheduledMaintenance.update({ where: { id }, data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.startsAt !== undefined ? { startsAt } : {}), ...(body.endsAt !== undefined ? { endsAt } : {}),
        ...(body.status !== undefined ? { status: body.status as MaintenanceState } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(componentIds ? { components: { set: componentIds.map((componentId) => ({ id: componentId })) } } : {}),
      }, include: maintenanceInclude })
      await recalculateComponents(tx, affectedIds)
      return updated
    })
    res.json(maintenance)
  } catch {
    res.status(500).json({ error: 'Не удалось обновить работы' })
  }
}

export const deleteMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const existing = await prisma.scheduledMaintenance.findUnique({ where: { id }, include: { components: { select: { id: true } } } })
    if (!existing) return res.status(404).json({ error: 'Работы не найдены' })
    await prisma.$transaction(async (tx) => {
      await tx.scheduledMaintenance.delete({ where: { id } })
      await recalculateComponents(tx, existing.components.map((item) => item.id))
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Не удалось удалить работы' })
  }
}
