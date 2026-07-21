export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export interface TransparencyIncident {
  id: string
  title: string
  publishedAt: string
  resolvedAt?: string
  severity: IncidentSeverity
  status: IncidentStatus
  affectedServices: string[]
  summary: string
  impact: string
  response: string
}

export interface SecurityAdvisory {
  id: string
  title: string
  publishedAt: string
  severity: IncidentSeverity
  affectedServices: string[]
  summary: string
  recommendation: string
}

/**
 * Публичный реестр инцидентов.
 *
 * Добавляйте новые записи в начало массива. Указывайте только подтверждённые
 * факты и не публикуйте данные, которые могут навредить пользователям или
 * расследованию. После устранения инцидента обновите status и resolvedAt.
 */
export const incidents: TransparencyIncident[] = []

/**
 * Предупреждения безопасности, требующие действий со стороны пользователей.
 * Новые предупреждения также добавляются в начало массива.
 */
export const securityAdvisories: SecurityAdvisory[] = []

export const transparencyMeta = {
  lastUpdated: '21 июля 2026',
  contactEmail: 'hello@arlist.ru',
}
