import prisma from './prisma.service.js'

export const DEFAULT_STATUS_PAGE_SETTINGS = {
  id: 'status',
  productName: 'Поток.Статус',
  pageTitle: 'Статус сервисов Арлист',
  description: 'Актуальное состояние сервисов, история инцидентов и плановые работы.',
  supportEmail: 'hello@arlist.ru',
  timezone: 'Europe/Moscow',
  historyDays: 90,
  refreshSeconds: 60,
  showUptimePercent: true,
  showHistory: true,
}

export function ensureStatusPageSettings() {
  return prisma.statusPageSetting.upsert({
    where: { id: 'status' },
    update: {},
    create: DEFAULT_STATUS_PAGE_SETTINGS,
  })
}
