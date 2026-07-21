import prisma from './prisma.service.js'

const FREE_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
  'deepseek-v4-flash',
  'gigachat',
  'gigachat-pro',
  'gigachat-max',
]

export async function ensureDefaultFreeTariff() {
  const tariff = await prisma.tariff.upsert({
    where: { type: 'FREE' },
    update: {},
    create: {
      type: 'FREE',
      name: 'Бесплатный',
      description: 'Для знакомства с платформой — за наш счёт',
      priceMonth: 0,
      creditsPer5h: 50_000,
      creditsPerWeek: 300_000,
      models: FREE_MODELS,
      overrunEnabled: false,
      overrunPriceKopecks: 0,
    },
  })

  const assignment = await prisma.user.updateMany({
    where: { tariffId: null },
    data: { tariffId: tariff.id },
  })

  return { tariff, assignedUsers: assignment.count }
}
